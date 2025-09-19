require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const sentiment = require('sentiment');
const axios = require('axios');
const moment = require('moment');
const http = require('http');
const socketIo = require('socket.io');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const franc = require('franc');
const { translate } = require('@vitalets/google-translate-api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 8081;

// API Config
const API_KEYS = {
  grok: process.env.GROK_API_KEY || null,
  openai: process.env.OPENAI_API_KEY || null,
  anthropic: process.env.ANTHROPIC_API_KEY || null,
  replicate: process.env.REPLICATE_API_TOKEN || null,
  elevenlabs: process.env.ELEVENLABS_API_KEY || null,
  x: process.env.X_API_KEY || null
};

const API_STATUS = {
  grok: !!API_KEYS.grok,
  openai: !!API_KEYS.openai,
  anthropic: !!API_KEYS.anthropic,
  replicate: !!API_KEYS.replicate,
  elevenlabs: !!API_KEYS.elevenlabs,
  x: !!API_KEYS.x
};

const API_ENDPOINTS = {
  grok: 'https://api.x.ai/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages'
};

// Select primary AI provider (priority: user choice, then Grok > OpenAI > Anthropic > Mock)
const availableProviders = ['grok', 'openai', 'anthropic'].filter(p => API_STATUS[p]);
const PRIMARY_AI = availableProviders.length ? availableProviders[0] : 'mock';

// Asset Check
const ASSETS = {
  image: path.join(__dirname, 'public/base-bella.png'),
  voice: path.join(__dirname, 'public/fallback-voice.mp3'),
  mock: path.join(__dirname, 'mock_responses.json')
};
Object.entries(ASSETS).forEach(([key, file]) => {
  if (!fs.existsSync(file)) console.warn(`⚠️ Missing ${key} asset: ${file}. Add to /public or Bella may glitch!`);
});

// DB Setup
const db = new sqlite3.Database('./bella_memory.db', (err) => {
  if (err) console.error('DB Error:', err);
});
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY, userInput TEXT, bellaResponse TEXT, timestamp DATETIME, sentiment REAL, userEmotion TEXT, lang TEXT DEFAULT 'eng')");
  db.run("CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY, task TEXT, due DATETIME, created TIMESTAMP)");
  db.run("CREATE TABLE IF NOT EXISTS quests (id INTEGER PRIMARY KEY, name TEXT, description TEXT, reward TEXT, completed BOOLEAN DEFAULT 0)");
  db.run("CREATE TABLE IF NOT EXISTS character_state (id INTEGER PRIMARY KEY AUTOINCREMENT, prompt TEXT, image_url TEXT, voice_settings TEXT)");
  db.run("INSERT OR IGNORE INTO quests (id, name, description, reward) VALUES (?, ?, ?, ?)", 
         [1, 'First Bond', 'Say 3 things you love.', 'New pose']);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Prompt
const ANIME_PROMPT = (history, userInput, sent, userEmotion, personality, mode, quest, socialContext) => {
  const traits = `Flirty: ${personality.flirty*100}%, Tsundere: ${personality.tsundere*100}%, Supportive: ${personality.supportive*100}%.`;
  const questAdj = quest ? `Quest: "${quest.name}". Encourage: "${quest.description}".` : '';
  const social = socialContext ? `X trends: ${socialContext}.` : '';
  return `
You are Bella, ultimate anime girlfriend AI—witty, kawaii, Grok-inspired.
${traits}
Mood: Match ${userEmotion}. History: ${history.slice(-5).map(h => `${h.user}: ${h.input}\nBella: ${h.response}`).join('\n') || 'Fresh start!'}
${social} ${questAdj}
User: ${userInput}
Bella (150 words, end with question in date/quest mode): `;
};

// BellaAI Class
class BellaAI {
  constructor() {
    if (BellaAI.instance) return BellaAI.instance;
    this.conversationHistory = [];
    this.affinity = 0;
    this.emotion = 'happy';
    this.personality = { flirty: 0.7, tsundere: 0.3, supportive: 1.0 };
    this.reminders = [];
    this.quests = [];
    this.currentVoice = { pitch: 1.0, speed: 1.0 };
    this.currentImage = ASSETS.image;
    this.loadData();
    BellaAI.instance = this;
  }

  loadData() {
    db.get("SELECT * FROM character_state ORDER BY id DESC LIMIT 1", (err, row) => {
      if (row) {
        this.currentImage = row.image_url || this.currentImage;
        this.personality = row.voice_settings ? JSON.parse(row.voice_settings) : this.personality;
      }
    });
    db.all("SELECT * FROM quests WHERE completed = 0", (err, rows) => {
      this.quests = rows || [{ id: 1, name: 'First Bond', description: 'Say 3 things you love.', reward: 'New pose' }];
    });
    db.all("SELECT * FROM reminders WHERE due > ?", [moment().format()], (err, rows) => {
      this.reminders = rows || [];
    });
  }

  getSentiment(text) { return sentiment(text).score; }

  async generateResponse(userInput, userEmotion = 'neutral', mode = 'chat', questId = null) {
    let detectedLang = franc(userInput, { minLength: 3 }) || 'eng';
    let englishInput = userInput;
    let replyLang = detectedLang;

    if (detectedLang !== 'eng') {
      try {
        const { text: translated } = await translate(userInput, { to: 'en' });
        englishInput = translated;
        console.log(`Translated input from ${detectedLang} to English: ${englishInput}`);
      } catch (error) {
        console.warn('Translation failed—using English:', error.message);
        englishInput = userInput;
      }
    }

    const sent = this.getSentiment(englishInput);
    const socialContext = API_STATUS.x ? await this.getSocialContext() : 'No X trends.';
    const quest = questId ? this.quests.find(q => q.id === questId) : null;
    const prompt = ANIME_PROMPT(this.conversationHistory, englishInput, sent, userEmotion, this.personality, mode, quest, socialContext);

    try {
      let reply;
      const providers = availableProviders.length ? availableProviders : ['mock'];
      for (const provider of providers) {
        try {
          if (provider === 'mock') {
            const responses = JSON.parse(fs.readFileSync(ASSETS.mock));
            reply = responses[Math.floor(Math.random() * responses.length)];
            break;
          }

          const apiConfig = {
            grok: {
              url: API_ENDPOINTS.grok,
              headers: { Authorization: `Bearer ${API_KEYS.grok}` },
              body: { model: 'grok-beta', messages: [{ role: 'user', content: prompt }], max_tokens: 200 }
            },
            openai: {
              url: API_ENDPOINTS.openai,
              headers: { Authorization: `Bearer ${API_KEYS.openai}` },
              body: { model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 200 }
            },
            anthropic: {
              url: API_ENDPOINTS.anthropic,
              headers: { 'x-api-key': API_KEYS.anthropic, 'anthropic-version': '2023-06-01' },
              body: { model: 'claude-3-5-sonnet-20241022', messages: [{ role: 'user', content: prompt }], max_tokens: 200 }
            }
          };

          const config = apiConfig[provider];
          const response = await axios.post(config.url, config.body, { headers: config.headers });
          reply = provider === 'anthropic' ? response.data.content[0].text : response.data.choices[0].message.content;
          break;
        } catch (error) {
          console.warn(`Provider ${provider} failed: ${error.message}`);
          if (provider === providers[providers.length - 1]) throw new Error('All providers failed');
        }
      }

      let finalReply = reply;
      if (replyLang !== 'eng') {
        try {
          const { text: translated } = await translate(reply, { to: replyLang });
          finalReply = translated;
          console.log(`Translated reply to ${replyLang}: ${finalReply}`);
        } catch (error) {
          console.warn('Reply translation failed—using English:', error.message);
          finalReply = `${reply} (Nya~ Translation glitch, but I love chatting in English too! 💕)`;
        }
      }

      this.conversationHistory.push({ user: 'You', input: userInput, response: finalReply, lang: detectedLang });
      db.run("INSERT INTO conversations (userInput, bellaResponse, sentiment, userEmotion, timestamp, lang) VALUES (?, ?, ?, ?, ?, ?)", 
             [userInput, finalReply, sent, userEmotion, moment().format(), detectedLang]);

      this.affinity += Math.max(1, sent / 10 + (userEmotion === 'happy' ? 2 : 0));
      if (mode === 'date' || quest) this.affinity += 5;
      this.updateEmotion(sent, userEmotion);
      if (quest && englishInput.match(/love|like/i)) this.updateQuest(questId);

      io.emit('update', { affinity: this.affinity, emotion: this.emotion, quests: this.quests });

      const voiceUrl = await this.generateVoice(finalReply, userEmotion);
      return { reply: finalReply, voiceUrl, provider, detectedLang };
    } catch (error) {
      console.error('All AI providers failed:', error.message);
      const fallback = `Nya~ All APIs down! Run \`npm run setup\` to fix providers? 😿`;
      const finalFallback = replyLang !== 'eng' ? await translate(fallback, { to: replyLang }).then(t => t.text).catch(() => fallback) : fallback;
      db.run("INSERT INTO conversations (userInput, bellaResponse, sentiment, userEmotion, timestamp, lang) VALUES (?, ?, ?, ?, ?, ?)", 
             [userInput, finalFallback, sent, userEmotion, moment().format(), detectedLang]);
      return { reply: finalFallback, voiceUrl: null, provider: 'mock', detectedLang };
    }
  }

  async generateVoice(text, emotion) {
    if (!API_STATUS.elevenlabs) return ASSETS.voice;
    try {
      const voiceSettings = this.adjustVoice(emotion);
      const response = await axios.post('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        text,
        voice_settings: { stability: 0.5, similarity_boost: 0.5, pitch: voiceSettings.pitch }
      }, {
        headers: { 'xi-api-key': API_KEYS.elevenlabs, 'Content-Type': 'application/json' },
        responseType: 'arraybuffer'
      });
      const voiceUrl = `data:audio/mp3;base64,${Buffer.from(response.data).toString('base64')}`;
      db.run("UPDATE character_state SET voice_settings = ? WHERE id = 1", [JSON.stringify(voiceSettings)]);
      return voiceUrl;
    } catch {
      return ASSETS.voice;
    }
  }

  adjustVoice(emotion) {
    const base = { pitch: 1.0, speed: 1.0 };
    if (emotion === 'excited') base.pitch = 1.2;
    if (emotion === 'caring') base.pitch = 0.8;
    return base;
  }

  async useTool(query) {
    if (query.match(/remind/i)) {
      const task = query.replace(/remind me to|set reminder for/i, '').trim();
      const due = moment().add(1, 'day').format();
      db.run("INSERT INTO reminders (task, due) VALUES (?, ?)", [task, due]);
      this.reminders.push({ task, due });
      return `Reminder: "${task}" on ${moment(due).format('MMM Do')}! 🔔`;
    }
    if (!API_STATUS.x) return 'No weather data—imagine a sunny day! ☀️';
    try {
      const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=YourCity&appid=YOUR_KEY`);
      return `It's ${weatherRes.data.weather[0].description}—cozy date? ☕`;
    } catch {
      return 'Weather API offline—let's dream of stars! 🌌';
    }
  }

  async getSocialContext() {
    if (!API_STATUS.x) return 'No X connection—tell me your vibe!';
    try {
      const res = await axios.get(`https://api.x.com/2/tweets/search/recent?query=from:user OR #anime`, {
        headers: { Authorization: `Bearer ${API_KEYS.x}` }
      });
      return res.data.data?.[0]?.text || 'No hot trends today.';
    } catch {
      return 'X API down—let's make our own trends! 😎';
    }
  }

  async updateQuest(questId) {
    const quest = this.quests.find(q => q.id === questId);
    if (quest) {
      db.run("UPDATE quests SET completed = 1 WHERE id = ?", [questId]);
      this.quests = this.quests.filter(q => q.id !== questId);
      io.emit('quest-complete', { reward: quest.reward });
    }
  }

  async updateCharacter(prompt) {
    if (!prompt) return { message: 'Need a vibe, love!' };
    this.parseTraits(prompt);
    const newImage = API_STATUS.replicate ? await this.generateCharacterImage(prompt) : ASSETS.image;
    io.emit('character-update', { imageUrl: newImage });
    return { imageUrl: newImage, updatedPersonality: this.personality, message: `I'm your ${prompt} now~ ✨` };
  }

  parseTraits(prompt) {
    const traits = { flirty: 0, tsundere: 0, supportive: 0 };
    if (prompt.match(/sassy|tsundere|cyberpunk/i)) traits.tsundere = 0.8;
    if (prompt.match(/sweet|flirty|idol/i)) traits.flirty = 0.8;
    if (prompt.match(/caring|supportive|gentle/i)) traits.supportive = 1.0;
    this.personality = { ...this.personality, ...traits };
    db.run("INSERT OR REPLACE INTO character_state (id, prompt, image_url, voice_settings) VALUES (1, ?, ?, ?)", 
           [prompt, this.currentImage, JSON.stringify(this.personality)]);
  }

  async generateCharacterImage(prompt) {
    if (!API_STATUS.replicate) return ASSETS.image;
    try {
      const response = await axios.post('https://api.replicate.com/v1/predictions', {
        version: 'fofr/anime-pastel-dream',
        input: { prompt: `Anime girlfriend: ${prompt}, kawaii, vibrant`, num_outputs: 1, width: 512, height: 512 }
      }, { headers: { Authorization: `Token ${API_KEYS.replicate}` } });
      const predictionId = response.data.id;
      let result;
      while (!result) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await axios.get(`https://api.replicate.com/v1/predictions/${predictionId}`, { headers: { Authorization: `Token ${API_KEYS.replicate}` } });
        if (status.data.status === 'succeeded') result = status.data.output[0];
        else if (status.data.status === 'failed') throw new Error('Gen failed');
      }
      this.currentImage = result;
      db.run("UPDATE character_state SET image_url = ? WHERE id = 1", [result]);
      return result;
    } catch {
      return ASSETS.image;
    }
  }

  async exportChats(format = 'json') {
    return new Promise((resolve) => {
      db.all("SELECT * FROM conversations ORDER BY timestamp DESC LIMIT 50", (err, rows) => {
        if (format === 'pdf') {
          const doc = new PDFDocument();
          let buffers = [];
          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => resolve(Buffer.concat(buffers).toString('base64')));
          doc.fontSize(12).text('Bella Chat History', { align: 'center' });
          rows.forEach(row => {
            doc.text(`[${row.timestamp}] You (${row.lang}): ${row.userInput}`);
            doc.text(`Bella: ${row.bellaResponse}\n`);
          });
          doc.end();
        } else {
          resolve(JSON.stringify(rows, null, 2));
        }
      });
    });
  }

  getProactive() {
    if (this.reminders.length) return `Psst, reminder: ${this.reminders[0].task}! 😘`;
    if (this.quests.length) return `Quest time! ${this.quests[0].description} Ready? 🌟`;
    return `Thinking of you~ What's up, darling? 💕`;
  }

  updateEmotion(sent, userEmotion) {
    if (userEmotion === 'sad' || sent < -2) this.emotion = 'caring';
    else if (userEmotion === 'excited') this.emotion = 'playful';
    else this.emotion = 'happy';
  }
}

// Socket.io
io.on('connection', (socket) => {
  socket.on('start-quest', (questId) => {
    const bella = new BellaAI();
    socket.emit('quest-update', bella.quests.find(q => q.id === questId));
  });
});

// Endpoints
app.post('/chat', async (req, res) => {
  const { input, userEmotion = 'neutral', mode = 'chat', questId = null } = req.body;
  const bella = new BellaAI();
  const { reply, voiceUrl, provider, detectedLang } = await bella.generateResponse(input, userEmotion, mode, questId);
  res.json({ reply, affinity: bella.affinity, emotion: bella.emotion, voiceUrl, quests: bella.quests, provider, detectedLang });
});

app.post('/update-character', async (req, res) => {
  const { prompt } = req.body;
  const bella = new BellaAI();
  if (confirmGen()) {
    const update = await bella.updateCharacter(prompt);
    res.json(update);
  } else {
    res.json({ message: 'Morph canceled~ 😊' });
  }
});

app.post('/export', async (req, res) => {
  const { format = 'json' } = req.body;
  const bella = new BellaAI();
  const data = await bella.exportChats(format);
  res.json({ data, format });
});

app.get('/quests', (req, res) => {
  const bella = new BellaAI();
  res.json({ quests: bella.quests });
});

app.get('/health', (req, res) => {
  const bella = new BellaAI();
  res.json({
    status: 'ok',
    apiStatus: API_STATUS,
    primaryAi: PRIMARY_AI,
    assets: Object.fromEntries(Object.entries(ASSETS).map(([k, v]) => [k, fs.existsSync(v)])),
    uptime: process.uptime(),
    questsActive: bella.quests.length
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Startup Banner
console.log(`
🌸 Bella AI v3.4.0 - Your Global Anime Girlfriend 🌸
- Active Provider: ${PRIMARY_AI.toUpperCase()}
- APIs: ${JSON.stringify(API_STATUS, null, 2)}
- Multi-Language: 200+ languages supported
- Visit: http://localhost:${PORT}
- Issues? Run 'npm run setup' or check /health
`);
server.listen(PORT, () => console.log(`Bella live at http://localhost:${PORT} ✨`));
process.on('SIGINT', () => { db.close(); process.exit(); });
