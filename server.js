require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));  // public folder serve करेगा

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { text, emotion } = req.body;
  
  // फिलहाल simple reply (AI connect कर सकते हैं बाद में)
  let reply = `मैंने सुना: "${text}". तुम्हारा mood ${emotion} लग रहा है।`;
  
  res.json({ reply });
});

// Server start
app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
