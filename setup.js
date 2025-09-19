const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const envTemplate = `
# AI Providers (select at least one for chats)
GROK_API_KEY=your_grok_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional APIs (enhance features)
REPLICATE_API_TOKEN=your_replicate_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
X_API_KEY=your_x_key_here
`;

async function validateApiKey(provider, key) {
  if (key === 'skip' || !key) return false;
  try {
    const tests = {
      grok: { url: 'https://api.x.ai/v1/models', headers: { Authorization: `Bearer ${key}` } },
      openai: { url: 'https://api.openai.com/v1/models', headers: { Authorization: `Bearer ${key}` } },
      anthropic: { url: 'https://api.anthropic.com/v1/models', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } },
      replicate: { url: 'https://api.replicate.com/v1/models', headers: { Authorization: `Token ${key}` } },
      elevenlabs: { url: 'https://api.elevenlabs.io/v1/voices', headers: { 'xi-api-key': key } },
      x: { url: 'https://api.x.com/2/users/me', headers: { Authorization: `Bearer ${key}` } }
    };
    if (!tests[provider]) return true;
    await axios.get(tests[provider].url, { headers: tests[provider].headers });
    return true;
  } catch {
    return false;
  }
}

async function setup() {
  console.log(`
🌟 Bella AI Setup (v3.4.0) 🌟
Select AI providers for chats (Grok, OpenAI, Claude) and optional APIs.
Multi-language support enabled! Bella detects/translates 200+ languages automatically.
Get keys from:
- Grok: https://x.ai/api
- OpenAI: https://platform.openai.com
- Anthropic: https://console.anthropic.com
- Replicate: https://replicate.com/account (morphing)
- ElevenLabs: https://elevenlabs.io (voice)
- X: https://developer.x.com (trends)
`);

  const questions = [
    {
      type: 'checkbox',
      name: 'aiProviders',
      message: 'Select AI providers for chats (at least one recommended):',
      choices: [
        { name: 'Grok (xAI)', value: 'grok' },
        { name: 'OpenAI (ChatGPT)', value: 'openai' },
        { name: 'Anthropic (Claude)', value: 'anthropic' }
      ],
      validate: input => input.length > 0 || 'Select at least one provider or Bella will use offline mode!'
    },
    {
      type: 'input',
      name: 'grok',
      message: 'Grok API Key:',
      default: 'skip',
      when: answers => answers.aiProviders.includes('grok'),
      validate: async input => (await validateApiKey('grok', input)) || 'Invalid Grok key! Enter a valid key or "skip".'
    },
    {
      type: 'input',
      name: 'openai',
      message: 'OpenAI API Key:',
      default: 'skip',
      when: answers => answers.aiProviders.includes('openai'),
      validate: async input => (await validateApiKey('openai', input)) || 'Invalid OpenAI key! Enter a valid key or "skip".'
    },
    {
      type: 'input',
      name: 'anthropic',
      message: 'Anthropic API Key:',
      default: 'skip',
      when: answers => answers.aiProviders.includes('anthropic'),
      validate: async input => (await validateApiKey('anthropic', input)) || 'Invalid Anthropic key! Enter a valid key or "skip".'
    },
    {
      type: 'checkbox',
      name: 'optionalApis',
      message: 'Select optional APIs to enhance Bella:',
      choices: [
        { name: 'Replicate (Character Morphing)', value: 'replicate' },
        { name: 'ElevenLabs (Voice Synthesis)', value: 'elevenlabs' },
        { name: 'X (Social Trends)', value: 'x' }
      ]
    },
    {
      type: 'input',
      name: 'replicate',
      message: 'Replicate API Token:',
      default: 'skip',
      when: answers => answers.optionalApis.includes('replicate'),
      validate: async input => (await validateApiKey('replicate', input)) || 'Invalid Replicate token! Enter a valid token or "skip".'
    },
    {
      type: 'input',
      name: 'elevenlabs',
      message: 'ElevenLabs API Key:',
      default: 'skip',
      when: answers => answers.optionalApis.includes('elevenlabs'),
      validate: async input => (await validateApiKey('elevenlabs', input)) || 'Invalid ElevenLabs key! Enter a valid key or "skip".'
    },
    {
      type: 'input',
      name: 'x',
      message: 'X API Key:',
      default: 'skip',
      when: answers => answers.optionalApis.includes('x'),
      validate: async input => (await validateApiKey('x', input)) || 'Invalid X key! Enter a valid key or "skip".'
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Save API keys to .env?',
      default: true
    }
  ];

  const answers = await inquirer.prompt(questions);
  if (!answers.confirm) {
    console.log('❌ Setup canceled. Run `npm run setup` again to configure.');
    return;
  }

  const envContent = `
# Selected AI Providers: ${answers.aiProviders.join(', ')}
GROK_API_KEY=${answers.grok === 'skip' ? '' : answers.grok}
OPENAI_API_KEY=${answers.openai === 'skip' ? '' : answers.openai}
ANTHROPIC_API_KEY=${answers.anthropic === 'skip' ? '' : answers.anthropic}
# Optional APIs: ${answers.optionalApis.join(', ')}
REPLICATE_API_TOKEN=${answers.replicate === 'skip' ? '' : answers.replicate}
ELEVENLABS_API_KEY=${answers.elevenlabs === 'skip' ? '' : answers.elevenlabs}
X_API_KEY=${answers.x === 'skip' ? '' : answers.x}
`;

  fs.writeFileSync(path.join(__dirname, '.env'), envContent.trim());
  fs.writeFileSync(path.join(__dirname, '.env.example'), envTemplate.trim());
  console.log('✅ .env saved! Run `npm start` to launch Bella.');
  console.log('📌 Download face-api models to /models: https://github.com/justadudewhohacks/face-api.js');
  console.log('📌 Ensure assets: public/base-bella.png, public/fallback-voice.mp3, mock_responses.json');
}

setup().catch(err => console.error('Setup failed:', err));
