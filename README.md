# 🚀 Causal Edge: Enterprise Digital Twin Platform
🌐 **Production Deployment:** [https://causaledge.vercel.app/](https://causaledge.vercel.app/)

![Status](https://img.shields.io/badge/Status-Production_Ready-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)

## 🎥 Platform Demonstration

<video src="https://github.com/user-attachments/assets/956e930c-2b53-46ef-a24b-abd52c7f0fa9" autoplay loop muted playsinline width="100%"></video>

**Causal Edge** is an enterprise-grade, AI-powered predictive maintenance Digital Twin platform built for industrial hardware ecosystems. Designed to solve complex real-world manufacturing and logistics challenges, this platform acts as a centralized command center. It leverages advanced causal AI to predict, isolate, and explain catastrophic hardware failures across entire fleets of vehicles or machinery in real-time before they occur.

## ✨ Key Capabilities

- **🧠 Bayesian Causal Inference:** Dynamically calculates how a fault in one physical component (e.g., a wheel bearing) cascades into downstream failures (e.g., suspension, drivetrain) using a probabilistic causal graph, allowing engineers to identify true root causes.
- **📡 Real-Time Telemetry Processing:** A high-throughput Python-based engine ingests live sensor data (vibration, temperature, torque, pressure) across the fleet, streaming synchronized analytics to the frontend via WebSockets.
- **🕵️ Z-Score Anomaly Detection:** Utilizes mathematically rigorous statistical deviation models on the edge to detect critical hardware anomalies with zero false positives.
- **🤝 Distributed Fleet Quorum:** Individual machines share anomaly data to reach a consensus. Once an anomaly pattern is confirmed across the fleet, the fault signature is hashed and committed to an immutable ledger for audit and compliance.
- **🤖 Explainable AI Narrative:** Demystifies "black box" machine learning by generating a real-time, step-by-step causal narrative explaining exactly *why* the AI made its diagnosis and recommending preventative maintenance actions.
- **🎨 Executive UI/UX:** A state-of-the-art dashboard featuring real-time interactive causal trees, glowing status indicators, and responsive telemetry data visualization.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Custom CSS (Glassmorphism aesthetics) + TailwindCSS
- **Data Visualization:** Recharts, Custom SVG Animations

### Backend
- **Framework:** Python + FastAPI
- **Database:** SQLite + SQLAlchemy
- **AI/ML:** Python Standard Library (Mathematical Modeling)
- **Communication:** WebSockets, AsyncIO Event Bus

## 🚀 Deployment & Operations

### 1. Start the Backend (Python)
Ensure you have Python 3.10+ installed.
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python run.py
```
*The backend API and WebSocket server will initialize on `http://localhost:8000`.*

### 2. Start the Frontend (React)
Ensure you have Node.js installed. Open a **new** terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The Vite dev server will start on `http://localhost:5173`.*

## 📖 Architecture & Design
Please refer to `ARCHITECTURE.md` for a comprehensive technical breakdown of the simulation loop, distributed event bus, and causal propagation mathematics.
