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
### AI Nutrition Intelligence for Anganwadi Workers

AROMI is a complete AI-powered field tool for Anganwadi workers — from SAM photo screening and automated Hindi WhatsApp & voice alerts, to RAG knowledge base, WHO growth analytics, AI activity planner, smart visit scheduling, attendance management, and one-click MPR generation.

**Team Binary Biryani | Redrob AI Hackathon 2026**

## Demo Login
```
Email:    priya@aromi.demo
Password: demo1234
```

## Features
| Feature | Description |
|---|---|
| 📷 SAM Photo Screening | Claude 3 Haiku vision model detects SAM/MAM from child photo with Hindi explanation |
| 📲 WhatsApp Alerts | Auto-sends Hindi WhatsApp to parent + supervisor on SAM detection via Twilio |
| 📞 Hindi Voice Call | Automated Hindi voice call triggered on SAM — no literacy needed |
| 📊 Dashboard | Live SAM/MAM counts, visits due, attendance today, risk flags |
| 👧 Children | Full child profiles — DOB, parent contacts, nutrition history, growth chart |
| 📈 Growth Tracker | Weight/MUAC → WHO Z-score (WAZ/HAZ) → SHAP-style Hindi explanation |
| 🎯 Activity Planner | AI generates age-appropriate daily activity plans in Hindi |
| 📋 Attendance | Tap-to-mark attendance + meal tracking with bulk save |
| 🏠 Smart Visits | Priority-ordered home visit scheduler for SAM/MAM cases with overdue alerts |
| 📄 MPR Generator | One-click Monthly Progress Report from attendance + growth + SAM data |
| 🎤 Voice Agent | Hindi speech-to-text (Whisper) — log vitals by voice |
| 🤖 AI Agent Pipeline | 5-agent orchestration: health, risk, intervention, visit, reporting |
| 📚 RAG Knowledge Base | 15-entry WHO/ICDS/DISHA knowledge base, works offline |
| 📶 Offline Mode | Dexie.js queue, syncs when back online |

## Architecture
```
React (Vite + Tailwind) ──► FastAPI ──► SQLite
                          ──► OpenRouter (Claude 3 Haiku Vision)
                          ──► Twilio (WhatsApp + Hindi Voice Call)
                          ──► ChromaDB (optional RAG vector store)
Offline: Dexie.js IndexedDB queue ──► background sync
```

## Alert Flow (SAM Detection)
```
Worker uploads photo
      ↓
Claude 3 Haiku detects SAM (confidence score + Hindi indicators)
      ↓
WhatsApp → Parent (तुरंत PHC जाएं)
      ↓
WhatsApp → Supervisor (high priority alert)
      ↓
Hindi Voice Call → Parent (automated TwiML)
```

## Environment Variables
Set these in `.env` (local) or HF Secrets (deployment):
```
# Core
DATABASE_URL=sqlite:///./aromi.db
JWT_SECRET=your-random-secret-here
ENVIRONMENT=development

# AI
OPENROUTER_API_KEY=sk-or-...
LLM_MODEL=anthropic/claude-3-haiku

# Twilio (WhatsApp + Voice Alerts)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_CALLER_NUMBER=+1xxxxxxxxxx

# Alert targets
ALERT_PARENT_NUMBER=+91xxxxxxxxxx
ALERT_SUPERVISOR_NUMBER=+91xxxxxxxxxx
```

## Local Setup
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python seed_demo.py
uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Dexie.js
- **Backend**: FastAPI, SQLAlchemy, SQLite, Python 3.11, Pydantic v2
- **AI**: Claude 3 Haiku Vision (OpenRouter), Whisper STT, Embedded RAG
- **Alerts**: Twilio WhatsApp Sandbox, Twilio Voice (TwiML Hindi)
- **Deployment**: Docker, Hugging Face Spaces (Port 7860)
