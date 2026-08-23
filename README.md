<div align="center">

# 🌟 AROMI
**Anganwadi Resource Optimization and Management Intelligence**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](#)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)

*An AI-powered health and growth monitoring platform designed to streamline daily administrative tasks, track child nutrition, and schedule prioritized home visits for Anganwadi Centers.*

[Features](#-key-features) • [Tech Stack](#-technology-stack) • [Installation](#-getting-started) • [Mobile App](#-mobile-companion)

</div>

---

## 🎯 About The Project

AROMI is a comprehensive ecosystem built to empower Anganwadi workers. By combining a modern web dashboard with an intelligent voice assistant and a cross-platform mobile app, AROMI eliminates tedious manual paperwork. It allows health workers to focus on what truly matters: **the health and well-being of the children in their communities.**

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🎙️ **Universal Voice Assistant** | Navigate, query, and perform data entry via natural language voice commands (Hindi / Hinglish / English). |
| 📈 **Advanced Growth Tracking** | Automated WHO Z-score calculations for instant identification of SAM and MAM cases. |
| 📅 **Smart Home Visits Scheduler** | AI-prioritized home visit scheduler that flags overdue visits, categorized by clinical urgency. |
| 📸 **Photo Screening AI** | Integrated computer vision to detect early signs of malnutrition via physical indicators. |
| 📊 **One-Click MPR** | Automated Monthly Progress Report (MPR) generation for CDPOs and supervisors. |
| 📱 **Cross-Platform App** | A dedicated Flutter mobile companion app for field workers on the go. |

---

## 💻 Technology Stack

### **Frontend (Web Portal)**
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS & Lucide Icons
- **State Management:** React Context API

### **Backend (API & AI Services)**
- **Framework:** FastAPI (Python)
- **Database:** SQLite (Dev) / PostgreSQL (Prod) via SQLAlchemy
- **AI/ML:** Whisper (Speech-to-Text), OpenRouter (LLM Reasoning), ChromaDB (Vector Store)

### **Mobile App**
- **Framework:** Flutter (Dart)
- **Platforms:** Android, iOS

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [Flutter SDK](https://flutter.dev/docs/get-started/install)

### 1️⃣ Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env

# Generate seed data and run the server
python seed_demo.py
uvicorn app.main:app --reload
```
*The API will be available at `http://localhost:8000`*

### 2️⃣ Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The web app will be available at `http://localhost:5173`*

---

## 📱 Mobile Companion (Flutter)

To run the mobile app for field workers:

```bash
# Navigate to the flutter app directory
cd flutter_app

# Get dependencies
flutter pub get

# Run the app on an emulator or connected device
flutter run
```

---

## 🔒 Security & Compliance

- **Data Privacy:** Compliant with local government and NIC security guidelines for Anganwadi authentications.
- **Secure Communcation:** Token-based API communication with encrypted data at rest.
- **Role-Based Access:** Distinct authentication gateways for Anganwadi Workers (AWW), Supervisors (CDPO), and Medical Officers.

---

<div align="center">
  <p>Built with ❤️ for a healthier tomorrow.</p>
</div>
