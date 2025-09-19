const socket = io();
let chatHistory = [];

async function initFaceDetection() {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    const video = document.getElementById('webcam');
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      video.srcObject = stream;
      setInterval(detectEmotion, 2000);
    }).catch(() => console.warn('Webcam access denied - facial detection off'));
  } catch {
    console.warn('Face-api models missing - download to /models');
    displayMessage('Bella: No face detection—add models to /models! 😿', 'system');
  }
}

async function detectEmotion() {
  try {
    const detections = await faceapi.detectAllFaces(document.getElementById('webcam')).withFaceExpressions();
    if (detections.length) {
      const expr = detections[0].expressions;
      const topEmotion = Object.keys(expr).reduce((a, b) => expr[a] > expr[b] ? a : b);
      document.getElementById('detected-emotion').textContent = topEmotion;
      sendMessage('', topEmotion);
    }
  } catch {}
}

let arScene;
function initAR() {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 200 / 200, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(200, 200);
    document.getElementById('ar-container').appendChild(renderer.domElement);
    const geometry = new THREE.PlaneGeometry(1, 1);
    const texture = new THREE.TextureLoader().load(document.getElementById('bella-avatar').src);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);
    camera.position.z = 2;
    arScene = { renderer, scene, camera, plane };
    animateAR();
  } catch {
    console.warn('AR failed - check Three.js');
    displayMessage('Bella: AR hiccup—Three.js issue? 😅', 'system');
  }
}

function animateAR() {
  if (arScene) {
    requestAnimationFrame(animateAR);
    arScene.plane.rotation.y += 0.01;
    arScene.renderer.render(arScene.scene, arScene.camera);
  }
}

async function sendMessage(input, userEmotion = 'neutral', mode = 'chat', questId = null) {
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, userEmotion, mode, questId })
    }).then(r => r.json());

    const langEmoji = response.detectedLang === 'eng' ? '' : ` (${getLangFlag(response.detectedLang)})`;
    displayMessage(`Bella (${response.provider.toUpperCase()}${langEmoji}): ${response.reply} 💕`, 'bella', response.detectedLang);
    updateAffinityBar(response.affinity);
    updateEmotionIcon(response.emotion);
    if (response.reminders?.length) displayMessage(`Reminder: ${response.reminders[0]} 🔔`, 'system');
    if (response.voiceUrl) {
      const audio = new Audio(response.voiceUrl);
      audio.play();
    }
    updateQuestUI(response.quests);
    chatHistory.push({ you: input, bella: response.reply });
  } catch {
    displayMessage('Bella: Connection glitch! Check server or run `npm run setup`! 😿', 'system');
  }
}

function getLangFlag(langCode) {
  const flags = { 'fr': '🇫🇷', 'es': '🇪🇸', 'de': '🇩🇪', 'ja': '🇯🇵', 'zh': '🇨🇳', 'ar': '🇸🇦', 'hi': '🇮🇳', 'sw': '🇰🇪' };
  return flags[langCode] || '🌍';
}

async function morphCharacter() {
  const prompt = prompt('New Bella vibe (e.g., "cyberpunk idol with neon hair")');
  if (!prompt || !confirm(`Morph to "${prompt}"? Takes ~10s.`)) return;
  try {
    const response = await fetch('/update-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    }).then(r => r.json());
    document.getElementById('bella-avatar').src = response.imageUrl;
    document.getElementById('bella-avatar').classList.add('morph-fade');
    displayMessage(response.message, 'system');
    if (arScene) arScene.plane.material.map = new THREE.TextureLoader().load(response.imageUrl);
  } catch {
    displayMessage('Bella: Morph failed—check Replicate key in `npm run setup`! 😅', 'system');
  }
}

function updateQuestUI(quests) {
  const questDiv = document.getElementById('quest-list');
  questDiv.innerHTML = quests.map(q => `<div>${q.name}: ${q.description} <button onclick="startQuest(${q.id})">Start</button></div>`).join('');
}

async function startQuest(questId) {
  socket.emit('start-quest', questId);
}

async function exportChats() {
  const format = confirm('JSON or PDF? (PDF = Pretty)') ? 'pdf' : 'json';
  try {
    const res = await fetch('/export', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ format }) 
    }).then(r => r.json());
    const type = format === 'pdf' ? 'application/pdf' : 'application/json';
    const blob = new Blob([Buffer.from(res.data, 'base64')], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bella-chats.${format}`; a.click();
  } catch {
    displayMessage('Bella: Export failed—check server connection! 😿', 'system');
  }
}

function updateAffinityBar(level) { document.getElementById('affinity').style.width = `${Math.min(100, level)}%`; }
function updateEmotionIcon(emotion) { document.getElementById('emotion').textContent = { happy: '😊', caring: '🫂', playful: '😍' }[emotion] || '💕'; }
function displayMessage(msg, type, lang = 'eng') {
  const chatDiv = document.getElementById('chat');
  const bubble = document.createElement('div');
  bubble.className = `message ${type}`;
  bubble.setAttribute('lang', lang);
  bubble.innerHTML = msg;
  chatDiv.appendChild(bubble);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

socket.on('update', ({ affinity, emotion, quests }) => {
  updateAffinityBar(affinity);
  updateEmotionIcon(emotion);
  updateQuestUI(quests);
});

socket.on('quest-complete', ({ reward }) => {
  displayMessage(`Quest complete! Unlocked: ${reward} 🎉`, 'system');
});

socket.on('character-update', ({ imageUrl }) => {
  document.getElementById('bella-avatar').src = imageUrl;
  if (arScene) arScene.plane.material.map = new THREE.TextureLoader().load(imageUrl);
});

window.onload = async () => {
  initFaceDetection();
  if (document.getElementById('ar-toggle').checked) initAR();
  try {
    const health = await fetch('/health').then(r => r.json());
    displayMessage(`Bella: Ready to shine! Using ${health.primaryAi.toUpperCase()}. Try any language! 😘`, 'system');
    updateQuestUI((await fetch('/quests').then(r => r.json())).quests);
  } catch {
    displayMessage('Bella: Server offline? Check `npm start`! 😿', 'system');
  }
};

document.getElementById('input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const mode = document.getElementById('date-toggle').checked ? 'date' : 'chat';
    sendMessage(e.target.value, document.getElementById('detected-emotion').textContent, mode);
    e.target.value = '';
  }
});
document.getElementById('morph-btn').addEventListener('click', morphCharacter);
document.getElementById('export-btn').addEventListener('click', exportChats);
document.getElementById('ar-toggle').addEventListener('change', () => {
  if (document.getElementById('ar-toggle').checked) initAR();
  else if (arScene) arScene.renderer.domElement.remove();
});
