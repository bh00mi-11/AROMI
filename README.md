<div align="center">

# 🌟 AROMI
**Anganwadi Resource Optimization and Management Intelligence**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](#)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![AI/ML](https://img.shields.io/badge/AI%2FML-Enabled-FF6F00?style=for-the-badge&logo=openai&logoColor=white)](#)

*An intelligent, multi-modal platform built to empower grassroots health workers (Anganwadis) and eradicate child malnutrition.*

</div>

---

## 🚨 The Problem

At the grassroots level of India's healthcare system, **Anganwadi Workers (AWWs)** are the frontline warriors against child malnutrition. However, they are overwhelmed by systemic inefficiencies:
- **Mountains of Paperwork:** Workers spend up to 40% of their time filling out redundant physical registers instead of focusing on child care.
- **Language Barriers:** Digital tools are rarely accessible in native, regional languages.
- **Delayed Intervention:** Tracking Severe Acute Malnutrition (SAM) and Moderate Acute Malnutrition (MAM) cases manually leads to delayed clinical referrals.
- **Lack of Prioritization:** Without data-driven insights, scheduling critical home visits is reduced to guesswork.

## 💡 The Solution: What is AROMI?

**AROMI** is a holistic, AI-powered ecosystem that digitizes, automates, and optimizes the workflow of Anganwadi centers. By providing both a **Web Admin Dashboard** and a **Cross-Platform Mobile App**, AROMI ensures that workers, supervisors, and medical officers are seamlessly connected.

### Core Pillars
1. 🎙️ **Universal Voice Assistant:** We built a multi-lingual NLP engine that understands Hindi, Marathi, English, and Hinglish. Powered by Faster-Whisper with in-memory streaming, workers can simply "talk" to AROMI to log data, update records, and query guidelines.
2. 📸 **AI-Powered Photo Screening & Rapid SAM Triage:** Using Computer Vision, AROMI analyzes child photos to detect malnutrition indicators and automatically triggers asynchronous emergency PHC alerts for Severe Acute Malnutrition (SAM).
3. 📈 **Official WHO LMS Clinical Growth Curves:** Calculates exact Weight-for-Age Z-scores (WAZ) using official WHO LMS tables (0–60 months) with Box-Cox power transformations and fractional age linear interpolation.
4. 📚 **Contextual RAG Guidelines (24 Official Sources):** 24 authoritative WHO, MoHFW, MWCD, and ICMR-NIN guidelines indexed in Supabase `pgvector` with hybrid multilingual BM25 search and strict out-of-domain clinical safety guardrails.
5. 🔍 **Explainable AI (XAI) Panel:** Transparent decision support displaying confidence meters, SHAP feature weights, verified citation popups, sequential protocol steps, and Web Speech TTS audio readouts.
6. 📅 **Smart Triage & Visit Scheduler:** Algorithmic scheduler that prioritizes home visits based on clinical urgency, complete with 1-click WhatsApp and Phone call integrations.

> 📖 **Looking for a deep-dive on recent upgrades?** See the [Complete Improvements & Architecture Changelog](IMPROVEMENTS_README.md).

---

## ⚙️ Architecture & Tech Stack

AROMI was engineered for scale, reliability, sub-second latency, and accessibility in low-bandwidth environments.

### 🌐 Frontend (Web Portal)
- **React 18 & TypeScript:** Robust, type-safe administrative interface and clinical panels.
- **Explainable AI UI (`AIAnalysisPanel.tsx`):** High-craft XAI component with confidence meters, sequential action plans, and cited source inspection modals.
- **Web Speech API:** In-browser Speech-to-Text (Voice Search) and Text-to-Speech (Hindi, Marathi, English).
- **TailwindCSS:** High-contrast, accessible design system tailored for government/administrative health portals.
- **Context API & Axios Client:** Unified typed API client (`api.ts`) with automatic JWT interceptors and PDF download handlers.

### 🧠 Backend & AI Engine
- **FastAPI (Python 3.12):** Asynchronous, high-performance REST API.
- **Supabase PostgreSQL + `pgvector`:** Cloud relational database with connection pooling and HNSW cosine distance indexing for 384-dimensional multilingual embeddings.
- **Contextual RAG Retrieval:** Hybrid retrieval combining in-memory Devanagari/English BM25 with `intfloat/multilingual-e5-small` embeddings across 24 official WHO/ICDS/MoHFW guidelines.
- **WHO LMS Box-Cox Engine:** Exact $Z = ((W/M)^L - 1)/(L \cdot S)$ growth curve computations for 0–60 months.
- **Faster-Whisper (In-Memory Streaming):** Disk-free in-memory audio buffer processing with optimized CPU decoding (`beam_size=1`).
- **Asynchronous Task Queue (`BackgroundTaskQueue`):** Non-blocking queue with timeout enforcement and exponential backoff retries for emergency PHC alerts.
- **Multi-Tier TTLCache:** High-speed in-memory response caching for dashboard metrics (60s), ECCE plans (24h), and RAG queries (30m).

### 📱 Mobile App (Field Workers)
- **Flutter:** Cross-platform (Android/iOS) mobile companion app allowing on-the-go data entry, offline sync capabilities, and direct access to the voice assistant.

---

## 🚀 Key Features for Healthcare Administrators & Evaluators

* **Explainable & Grounded AI:** Every recommendation cites official WHO/MoHFW guidelines with interactive source verification and SHAP feature analysis.
* **Clinical Safety Guardrails:** Strict cosine/BM25 relevance thresholds filter out off-topic queries and deliver polite clinical advisories.
* **Instant Actionability:** 1-click WhatsApp dispatches, automated emergency PHC escalation alerts, and direct PDF dossier downloads.
* **Multilingual Inclusivity:** Native Hindi, Marathi, and English support across voice, text, and speech synthesis.
* **Automated MPRs & ECCE Plans:** Instant Monthly Progress Report compilation and 24-hour cached ECCE preschool activity curriculums.

---

## 🛠️ Local Development Setup

### 1️⃣ Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Run database and vector migration to Supabase
python migrate_to_supabase.py

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*(API runs on `http://localhost:8000`)*

### 2️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*(Web Portal runs on `http://localhost:5173`)*

### 3️⃣ Mobile App (Flutter)
```bash
cd flutter_app
flutter pub get
flutter run
```

---

## 🧪 Running Automated Verification Tests

To run the backend test suite:
```bash
cd backend
PYTHONPATH=. pytest tests/test_backend_improvements.py -v
```

---

## 🔮 Roadmap
1. **Edge On-Device SLMs:** Fine-tuning quantized small language models (SLMs) on device for 100% offline edge clinical reasoning.
2. **Predictive Malnutrition Modeling:** Spatial-temporal forecasting models predicting regional seasonal malnutrition spikes.
3. **Expanded Indian Language Support:** Adding Gujarati, Tamil, Telugu, and Bengali voice and text models.

---
<div align="center">
  <b>AROMI</b> • <i>Digitizing Care, Empowering Futures.</i>
</div>

