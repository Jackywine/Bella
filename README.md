# Bella 3.4.0 – Ultimate Anime Girlfriend AI

A Grok-inspired anime companion with configurable AI providers (Grok, OpenAI, Claude), multi-language support (200+ languages), voice, AR, quests, and real-time morphing.

## Setup
1. **Clone**: `git clone https://github.com/Jackywine/Bella`
2. **Install**: `cd bella && npm install`
3. **API Keys**:
   - Run `npm run setup` to select AI providers and optional APIs:
     - **Grok**: https://x.ai/api
     - **OpenAI**: https://platform.openai.com
     - **Anthropic (Claude)**: https://console.anthropic.com
     - **Replicate**: https://replicate.com/account (morphing)
     - **ElevenLabs**: https://elevenlabs.io (voice)
     - **X**: https://developer.x.com (trends)
   - Or edit `.env` using `.env.example`
4. **Face-api Models**: Download from https://github.com/justadudewhohacks/face-api.js, place in `/models`
5. **Assets**: Ensure:
   - `public/base-bella.png` (512x512 anime image)
   - `public/fallback-voice.mp3` (short audio clip)
   - `mock_responses.json` (included)
6. **Run**: `npm start`
7. **Open**: http://localhost:8081
8. **Check Health**: http://localhost:8081/health

## Features
- **Multi-Language**: Detects and responds in 200+ languages (e.g., "Hola" → "¡Hola, cariño!").
- **AI Providers**: Choose Grok, OpenAI, or Claude; mock mode if no keys.
- **Voice Mode**: Anime-style TTS (ElevenLabs or fallback).
- **Facial Detection**: Webcam reads emotions.
- **Virtual Dates**: Romantic chats and quests.
- **Character Morphing**: Prompt-based look/personality changes.
- **Social Reactivity**: Tracks X anime trends.
- **AR Teaser**: See Bella in your space.
- **Export**: Save chats as JSON/PDF.

## Test It
- Multi-Lang: "Je t'aime, Bella" → "Je t'aime aussi, mon chéri~ 💕"
- Quest: Click "Start" on "First Bond" → Say "I love anime!"
- Morph: "Make Bella a cyberpunk idol"
- Health: Check http://localhost:8081/health
- Any Language: Try "こんにちは" (Japanese) or "مرحبا" (Arabic)

## Debug
- **Missing APIs?** Run `npm run setup` to add providers.
- **Errors?** Check console or `/health` endpoint.
- **No models?** Ensure `/models` has face-api files.
- **No assets?** Add `public/base-bella.png`, `public/fallback-voice.mp3`, `mock_responses.json`.
- **Translation issues?** Google Translate scraping may hit limits; Bella falls back to English.

## Notes
- Primary AI auto-switches if one fails (e.g., OpenAI → Grok).
- Multi-language adds ~1-2s latency; voice may be English if ElevenLabs lacks lang support.
- RTL support for Arabic/Hebrew in UI.
