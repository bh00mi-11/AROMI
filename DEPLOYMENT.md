# AROOMI Deployment Guide

## Production Architecture
AROMI can be deployed via Docker (recommended for full local AI support) or Serverless (Vercel).

### Option A: Serverless (Vercel)
**WARNING: Vercel Serverless Functions have a 250MB uncompressed size limit.**
The local development environment uses `torch`, `faster-whisper`, and `chromadb` which exceed 3GB uncompressed. 

**Vercel Whisper / RAG Readiness: NOT READY (for local inference).**
To deploy on Vercel, you must:
1. Change `VOICE_TRANSCRIBER=remote` in your environment (which would use an external API like OpenAI).
2. Remove `torch`, `torchaudio`, `faster-whisper`, `chromadb`, and `sentence-transformers` from `backend/requirements.txt`.
3. Use a hosted PostgreSQL database instead of SQLite.

### Option B: Container Deployment (Cloud Run, AWS ECS, Railway)
**RECOMMENDED**
Because AROOMI runs embedded AI models (Faster-Whisper for Hindi/English voice and ChromaDB for RAG), deploying as a Docker container is required for full functionality without external vendor lock-in.

1. Build the Docker image: `docker build -t aromi-backend ./backend`
2. Deploy to Cloud Run / Railway.
3. Configure `DATABASE_URL` to a persistent PostgreSQL instance.

## Environment Variables (.env)
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@host:5432/aromi
JWT_SECRET=your-secure-random-256-bit-secret
OPENROUTER_API_KEY=your-openrouter-key
LLM_MODEL=openai/gpt-4o
CORS_ORIGINS=https://aroomi-frontend.vercel.app
WHISPER_MODEL=small
VOICE_TRANSCRIBER=local
```
