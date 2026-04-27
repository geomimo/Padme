# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Padme is a Duolingo-style interactive learning application for Databricks concepts. Users progress through structured lessons covering Spark, Delta Lake, MLflow, and Unity Catalog, earning XP and tracking streaks. The app is self-contained — no live Databricks connection required.

**No auth** — users are anonymous. A `user_id` is created on first visit and stored in `localStorage`. No JWT, no login flow.

## Stack

- **Backend**: Python/Flask, SQLite via SQLAlchemy, Flask-CORS. `db.create_all()` runs on startup — no migration step needed for dev.
- **Frontend**: React + Vite, React Router DOM, CSS Modules. Fonts: `Syne` (UI) + `JetBrains Mono` (numbers/mono) via Google Fonts.
- **Testing**: pytest (backend). No frontend tests yet.

## Commands

### Backend

```bash
cd backend
python -m venv .venv && source .venv/Scripts/activate  # Windows
pip install -r requirements.txt
python run.py        # dev server on :5000 (creates DB tables automatically)

pytest               # run all tests
pytest tests/test_foo.py
pytest -k "test_name"
```

### Frontend

```bash
cd frontend
npm install
npm start            # Vite dev server on :3000 (proxies /api → :5000)
npm run build        # production build
```

## Architecture

```
padme/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask factory — registers blueprints, calls db.create_all()
│   │   ├── models.py            # User, UserProgress, UserAnswer
│   │   ├── routes/
│   │   │   ├── users.py         # POST /api/users/, GET /api/users/<id>
│   │   │   ├── topics.py        # GET /api/topics/
│   │   │   └── lessons.py       # GET /api/lessons/, GET /api/lessons/<id>, POST /api/lessons/<id>/complete
│   │   └── content/
│   │       └── lessons.py       # Static lesson data (TOPICS list + LESSONS dict)
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_users.py
│   │   ├── test_topics.py
│   │   └── test_lessons.py
│   ├── config.py                # DevelopmentConfig, TestingConfig, ProductionConfig
│   └── run.py                   # Entry point
└── frontend/
    ├── src/
    │   ├── api/index.js          # Fetch wrappers for all endpoints
    │   ├── context/UserContext.jsx  # Creates/loads user on mount; exposes useUser()
    │   ├── components/
    │   │   ├── Navbar.jsx/module.css
    │   │   ├── TopicCard.jsx/module.css   # data-topic attr drives per-topic hover glow
    │   │   ├── LessonCard.jsx/module.css
    │   │   ├── ProgressBar.jsx/module.css # shimmer animation
    │   │   ├── ExerciseMultipleChoice.jsx # A/B/C/D letter badges
    │   │   ├── ExerciseFillBlank.jsx      # inline underline input
    │   │   └── Exercise.module.css
    │   └── pages/
    │       ├── Home.jsx/module.css        # topic grid + hero stats
    │       ├── TopicPage.jsx/module.css   # lesson list for a topic
    │       ├── LessonPage.jsx/module.css  # exercise flow + results screen
    │       └── ProfilePage.jsx/module.css
    └── vite.config.js            # port 3000, /api proxy to :5000
```

## Data model

- **User** — `id`, `xp`, `streak`, `last_active_date`. No username/password.
- **UserProgress** — `user_id`, `lesson_id` (string), `score`, `total`, `xp_earned`. Unique per user+lesson; best score is kept on retry.
- **UserAnswer** — log of every individual exercise attempt.

No Topic/Lesson/Exercise DB tables — all content is static in `backend/app/content/lessons.py`.

## Lesson content

Defined in `backend/app/content/lessons.py` as two structures:
- `TOPICS` — ordered list of topic dicts (`id`, `title`, `description`, `icon`, `lesson_ids`)
- `LESSONS` — dict keyed by `lesson_id`; each lesson has an `exercises` list

Exercise types: `multiple_choice` (options list + correct_answer) and `fill_blank` (correct_answer string, case-insensitive match). **Correct answers are stripped before sending to the frontend** — only returned in the `POST .../complete` response.

Current content: 4 topics, 11 lessons, 44 exercises.
- Spark Fundamentals: spark_intro, spark_dataframes, spark_ops
- Delta Lake: delta_intro, delta_acid, delta_timetravel
- MLflow: mlflow_tracking, mlflow_registry
- Unity Catalog: unity_intro, unity_namespace

## XP & streaks

- XP earned = `lesson.xp_reward` + `5 × correct_answers`
- On retry, only the XP delta above the previous best is added
- Streak increments when `last_active_date` was yesterday; resets if gap > 1 day; no-ops if already active today

## API shape

All endpoints prefixed `/api/`. Frontend proxies `/api` to `:5000`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users/` | Create anonymous user → `{id, xp, streak, ...}` |
| `GET` | `/api/users/<id>` | User profile + completed lessons |
| `GET` | `/api/topics/?user_id=<id>` | Topics with completion % |
| `GET` | `/api/lessons/?topic_id=<id>&user_id=<id>` | Lessons for a topic |
| `GET` | `/api/lessons/<id>` | Lesson detail + exercises (no correct answers) |
| `POST` | `/api/lessons/<id>/complete` | Submit `{user_id, answers:{ex_id: answer}}` → score, xp_earned, streak, per-exercise results |

## Design system

Dark theme. CSS custom properties in `src/index.css`:
- `--primary: #ff3621` (Databricks red)
- `--success: #00c55a`, `--bg: #0d0e10`, `--surface: #16181d`, `--surface-2: #1e2128`
- `--font-display: 'Syne'`, `--font-mono: 'JetBrains Mono'`
- Per-topic hover glows on TopicCard: spark=amber, delta=blue, mlflow=violet, unity=green
