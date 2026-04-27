# Padme

A Duolingo-style interactive learning application for Databricks concepts. Users progress through structured lessons covering Spark, Delta Lake, MLflow, and Unity Catalog, earning XP and tracking streaks.

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install -r requirements.txt
python run.py  # Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

Visit **http://localhost:3000** in your browser.

## Architecture

- **Backend**: Flask + SQLite
- **Frontend**: React + Vite
- **No authentication**: Anonymous users with localStorage session
- **4 topics**: Spark, Delta Lake, MLflow, Unity Catalog
- **11 lessons**: 44 exercises total

## Project Structure

```
padme/
├── backend/           # Flask API
├── frontend/          # React + Vite app
├── CLAUDE.md          # Development guide
└── README.md
```

## Features

- 🎯 Learn Databricks fundamentals through interactive exercises
- ⭐ Earn XP points for correct answers
- 🔥 Build streaks by learning daily
- 📊 Track progress across topics
- 🎓 Review lessons anytime
