# AROMI (Anganwadi Resource Optimization and Management Intelligence)

AROMI is a comprehensive, AI-powered health and growth monitoring platform designed specifically for Anganwadi Centers. It provides an intuitive, multilingual interface to streamline daily administrative tasks, track child nutrition, and schedule prioritized home visits.

## 🚀 Features

- **Advanced Growth Tracking**: Automated WHO Z-score calculations for identifying SAM (Severe Acute Malnutrition) and MAM (Moderate Acute Malnutrition) cases.
- **Smart Home Visits Scheduler**: An AI-prioritized home visit scheduler that flags overdue visits and categorizes them by urgency. Includes quick-action buttons for WhatsApp messaging and direct calling.
- **Universal Voice Assistant**: Navigate, query, and perform data entry via natural language voice commands (Hindi/Hinglish/English).
- **Photo Screening AI**: Integrated computer vision to detect malnutrition via physical indicators.
- **Monthly Progress Reports (MPR)**: One-click automated report generation for CDPOs and supervisors.
- **Integrated Flutter App**: A cross-platform mobile companion app for field workers.

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Backend**: Python, FastAPI, SQLAlchemy, SQLite (Dev) / PostgreSQL (Prod)
- **Mobile**: Flutter
- **AI/ML Integration**: Whisper (Speech-to-Text), OpenRouter (LLM Reasoning), ChromaDB

## 📦 Local Development Setup

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Environment variables
cp .env.example .env

# Generate seed data and run server
python seed_demo.py
uvicorn app.main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Mobile App (Flutter)

```bash
cd flutter_app
flutter pub get
flutter run
```

## 🔐 Security & Compliance
- Compliant with local government and NIC security guidelines for Anganwadi authentications.
- Secure token-based API communication.
- Encrypted data at rest.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome. Feel free to check the issues page if you want to contribute.

## 📄 License
This project is licensed under the MIT License.
