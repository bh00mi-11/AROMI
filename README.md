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
1. 🎙️ **Universal Voice Assistant:** We built a multi-lingual NLP engine that understands Hindi, English, and Hinglish. Workers can simply "talk" to AROMI to log data, update records, and query guidelines, bypassing complex user interfaces.
2. 📸 **AI-Powered Photo Screening:** Using advanced Computer Vision, AROMI can analyze a child's photo to detect visible indicators of malnutrition, providing an immediate second opinion to the health worker.
3. 📈 **Automated Clinical Tracking:** Automatically calculates WHO Z-scores based on entered physical measurements (Weight, Height, MUAC) to instantly classify children into Normal, MAM, or SAM categories.
4. 📅 **Smart Triage & Visit Scheduler:** An algorithmic scheduler that prioritizes home visits based on clinical urgency, complete with one-click WhatsApp and Phone call integrations to contact parents.

---

## ⚙️ How We Built It (Architecture & Tech Stack)

AROMI was engineered for scale, reliability, and accessibility in low-bandwidth environments.

### 🌐 Frontend (Web Portal)
- **React 18 & TypeScript:** For a robust, type-safe administrative interface.
- **TailwindCSS:** A highly responsive, accessible design system tailored for government/administrative portals.
- **Context API:** Lightweight global state management for seamless user sessions.

### 🧠 Backend & AI Engine
- **FastAPI (Python):** High-performance, asynchronous REST API.
- **OpenRouter & LLMs:** Powers the intelligent reasoning for the Universal Voice Assistant and RAG (Retrieval-Augmented Generation) guidelines helper.
- **Faster-Whisper:** Fast, on-device audio transcription for processing Hindi/Hinglish voice commands.
- **ChromaDB:** Vector database for embedding and querying official DISHA/MWCD medical guidelines.
- **SQLAlchemy:** Relational data modeling.

### 📱 Mobile App (Field Workers)
- **Flutter:** Cross-platform (Android/iOS) mobile companion app allowing on-the-go data entry, offline sync capabilities, and direct access to the voice assistant.

---

## 🚀 Key Features for Hackathon Judges

* **Multi-modal Input:** Users can interact via touch/text or voice, drastically reducing the learning curve for rural workers.
* **Instant Actionability:** The dashboard doesn't just show data; it provides actionable steps (e.g., "Schedule Visit", "Refer to PHC", "Send WhatsApp").
* **Bilingual UI Interface:** Full UI toggle between English and Hindi, built directly into the core layout without relying on external browser translation tools that break DOM structures.
* **Automated MPRs:** One-click Monthly Progress Report (MPR) generation saves hours of manual aggregation for supervisors.

---

## 🛠️ Local Development Setup

To test the project locally:

### 1️⃣ Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python seed_demo.py
uvicorn app.main:app --reload
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

## 🔮 What's Next for AROMI

1. **Full Offline-First Architecture:** Transitioning the mobile app to a complete local-first sync model using WatermelonDB/Isar to support areas with zero internet connectivity.
2. **Predictive Malnutrition Modeling:** Training localized ML models on historical regional data to predict malnutrition outbreaks before they occur.
3. **Regional Dialect Support:** Expanding the Voice Assistant NLP to support Marathi, Bengali, and Tamil.

---
<div align="center">
  <b>AROMI</b> • <i>Digitizing Care, Empowering Futures.</i>
</div>
