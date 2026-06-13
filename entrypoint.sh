#!/bin/bash
set -e

cd /app/backend

# Initialise DB + seed demo data on first boot
echo "🌱 Running database migrations..."
python -c "from app.database import engine; from app.models.models import Base; Base.metadata.create_all(bind=engine)"

echo "🌱 Seeding demo data..."
python seed_demo.py || echo "Seed already done or skipped."

echo "🚀 Starting AROMI API on port 7860..."
exec uvicorn app.main:app --host 0.0.0.0 --port 7860
