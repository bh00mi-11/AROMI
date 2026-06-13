---
title: AROMI — AI-Powered Anganwadi Assistant
emoji: 🌱
colorFrom: orange
colorTo: green
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# AROMI 🌱
### AI Resource & Operations Management Interface for Anganwadi Workers

AROMI is a multilingual (Hindi/Marathi) mobile-first PWA that uses a 5-agent AI orchestration pipeline to help Anganwadi workers manage child nutrition, attendance, and reporting.

## Demo Login
```
Email:    priya@aromi.demo
Password: demo1234
```

## Features
| Feature | Description |
|---|---|
| 📊 Dashboard | Impact metrics, MAM/SAM counts, daily summary |
| 👧 Children | Attendance toggle with bulk save, status badges |
| 📈 Growth Tracker | Weight/MUAC → WHO Z-score → auto-intervention |
| 🎯 Activity Planner | Hindi/Marathi AI activity cards by age group |
| 📋 MPR Generator | One-tap monthly report with Hindi summary |
| 🎤 Voice Agent | Hindi mic recording + browser TTS playback |
| 🤖 Agent Pipeline | 5-agent orchestration with live animation |
| 📚 WHO/ICDS RAG | 15-entry knowledge base, works offline |
| 📶 Offline Mode | Dexie.js queue, syncs when back online |

## Architecture
```
React (Vite + Tailwind) ──► FastAPI ──► SQLite
                          ──► OpenRouter (LLM)
                          ──► ChromaDB (optional vector store)
Offline: Dexie.js IndexedDB queue ──► background sync
```

## Environment Variables
Set these as HF Secrets:
```
OPENROUTER_API_KEY=sk-or-...
SECRET_KEY=your-random-secret
```

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Dexie.js
- **Backend**: FastAPI, SQLAlchemy, SQLite, Python 3.11
- **AI**: OpenRouter (Mistral/Llama), ChromaDB, faster-whisper
- **Deployment**: Docker, Hugging Face Spaces
