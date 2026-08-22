# AROOMI

AROMI (Anganwadi Resource Optimization and Management Intelligence) is an integrated health and growth monitoring platform featuring advanced Universal Voice capabilities.

## Features
- **Universal Voice Assistant**: Navigate, query, and perform data entry via natural language (Hindi/Hinglish/English).
- **Growth Tracking**: Advanced visualization of SAM/MAM indicators using WHO Z-scores.
- **Smart Visits**: AI-prioritized home visit scheduler.
- **Photo Screening**: Malnutrition detection via facial/body indicators (OpenRouter/AI).
- **Daily ECCE Activity Planner**: Auto-generates multilingual teaching plans.
- **MPR Generator**: One-click Monthly Progress Reports.
- **RAG Helper**: Embedded Anganwadi guidelines available via chat and voice.

## Architecture
- **Frontend**: React, TypeScript, Vite, TailwindCSS.
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite (dev) / Postgres (prod).
- **AI/ML**: Faster-Whisper (local transcription), OpenRouter (LLM reasoning), ChromaDB (Vector store).

## Local Development Setup

### 1. Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Update variables
python seed_demo.py   # Generate local dev database
uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment (Vercel / Docker)
Please refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed configuration, Vercel Serverless constraints (250MB limit), and external API requirements.

## Testing & Verifications
- Run backend compilation tests: `python -m compileall app`
- Run frontend type/build tests: `npm run build`
