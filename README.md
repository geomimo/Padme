# Padme

A Duolingo-style learning app for the Databricks ecosystem. Progress through structured lessons on Spark, Delta Lake, MLflow, and Unity Catalog — earning XP, building streaks, and competing in weekly leagues.

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # Windows
pip install -r requirements.txt
python run.py  # http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm start  # http://localhost:3000
```

Visit **http://localhost:3000**.

## Features

- **Journey** — linear road through all content, divided into chapters each ending with a Boss Lesson
- **Topics** — browsable catalog for self-directed learning with per-topic mastery %
- **Learning Paths** — curated lesson sets for certification goals (e.g. DE Associate exam prep)
- **5 question types** — multiple choice, fill in the blank, code reading, match pairs, order steps
- **Lakehouse Levels** — XP thresholds map to named levels (Spark Rookie → Databricks Master)
- **Daily goal + streak shields** — set an XP target; shields absorb a missed day (1/week)
- **Badges** — 10 collectible achievements (streak milestones, perfect lessons, topic mastery)
- **Weekly leaderboard** — opt-in league tiers (Bronze → Diamond) with end-of-week promotion
- **Shareable public profile** — `/profile/<user_id>` shows level, stats, badges, and topic mastery
- **No authentication** — anonymous users via `localStorage` session

## Stack

- **Backend**: Python / Flask / SQLite (SQLAlchemy) — `db.create_all()` runs on startup, no migration step
- **Frontend**: React + Vite / React Router / CSS Modules
- **Fonts**: Syne (UI) + JetBrains Mono (numbers/code)

## Content

4 topics · 4 chapters · 11 lessons · 52 exercises  
Boss lessons cap each chapter and unlock the next.

| Topic | Chapter | Lessons |
|---|---|---|
| Spark Fundamentals | Spark Foundations | spark_intro, spark_dataframes, spark_ops, spark_boss |
| Delta Lake | Delta Lake | delta_intro, delta_acid, delta_timetravel, delta_boss |
| MLflow | MLflow | mlflow_tracking, mlflow_registry, mlflow_boss |
| Unity Catalog | Unity Catalog | unity_intro, unity_namespace, unity_boss |

## Project Structure

```
padme/
├── backend/
│   ├── app/
│   │   ├── content/        # Static lesson/badge/path definitions
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── routes/         # Flask blueprints
│   │   └── utils/          # Badge evaluation
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/     # Exercise types, Navbar, FeedbackPanel, BadgeIcon, LeagueBadge
│   │   ├── pages/          # Journey, Topics, Lesson, Profile, Leaderboard, PublicProfile, Paths
│   │   ├── config/         # Level definitions
│   │   └── context/        # UserContext
│   └── vite.config.js
├── CLAUDE.md               # Full development guide
└── README.md
```

## Onboarding (optional)

Set `VITE_ONBOARDING_ENABLED=true` in `frontend/.env` to enable the 3-step wizard (goal → experience → daily time) and placement quiz for new users. Off by default — anonymous user is auto-created on first visit.
