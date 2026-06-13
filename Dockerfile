# ── AROMI — Hugging Face Spaces Dockerfile ────────────────────────────────────
# Single-container: FastAPI backend + pre-built React frontend served as static files
# HF Spaces requires the app to listen on port 7860

FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ git curl nodejs npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Backend deps ──────────────────────────────────────────────────────────────
COPY backend/requirements.hf.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── Frontend build ────────────────────────────────────────────────────────────
COPY frontend/ ./frontend/
RUN cd frontend && npm ci && npm run build

# ── Copy backend source ───────────────────────────────────────────────────────
COPY backend/ ./backend/

# ── Move built frontend into backend static folder ────────────────────────────
RUN cp -r frontend/dist ./backend/static

# ── Seed script ───────────────────────────────────────────────────────────────
COPY backend/seed_demo.py ./backend/seed_demo.py

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 7860

CMD ["./entrypoint.sh"]
