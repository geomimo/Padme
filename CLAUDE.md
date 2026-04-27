# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Vision

Padme is the definitive Duolingo-style learning app for the Databricks ecosystem. The core promise: **show up every day, get a little better, earn proof of it.**

Users learn through three entry points:
- **The Journey** — a linear, progressively harder road through all Databricks content, divided into chapters each ending with a Boss Lesson
- **Topics** — a browsable catalog for targeted, self-directed learning, showing per-topic mastery levels
- **Learning Paths** — curated lesson collections around a goal (e.g. *Databricks Associate Exam Prep*), with enrollment, progress tracking, and a shareable completion certificate

The lesson experience is one question at a time: a wrong answer shows a contextual explanation and retries; a correct answer shows a reinforcement note and advances. XP and a named **Lakehouse Level** accumulate across sessions. A daily streak, streak shields, daily XP goals, badges, and an opt-in weekly leaderboard drive retention.

Full product detail: [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)

## Current Implementation State

Phases 1–6 are complete. The app has a working core learning loop, journey map, level system, optional onboarding flow, daily goal + streak shields, and badges.

| Feature | Status |
|---|---|
| Per-question flow with immediate feedback (Phase 1) | Done |
| Journey map with chapters and winding road (Phase 2) | Done |
| Lakehouse Levels (XP thresholds → named levels) (Phase 3) | Done |
| Onboarding wizard + placement quiz (Phase 4) | Done (opt-in via env var) |
| 4 topics, 11 lessons, 44 exercises (MC + fill blank) | Done |
| Anonymous users via `localStorage` user_id | Done |
| Daily goal + streak shield (Phase 5) | Done |
| Badges & achievements (Phase 6) | Done |
| Learning paths (Phase 7) | Not built |
| New question types — code reading, match, order (Phase 8) | Not built |
| Weekly leaderboard (Phase 9) | Not built |
| Shareable public profile (Phase 10) | Not built |

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
│   │   │   ├── users.py         # POST /api/users/, GET /api/users/<id> (+ level fields)
│   │   │   ├── topics.py        # GET /api/topics/
│   │   │   ├── lessons.py       # GET /api/lessons/, GET /api/lessons/<id>,
│   │   │   │                    # POST /api/lessons/<id>/check, POST /api/lessons/<id>/complete
│   │   │   └── journey.py       # GET /api/journey/?user_id=<id>
│   │   └── content/
│   │       └── lessons.py       # Static content: TOPICS, CHAPTERS, LESSONS
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_users.py
│   │   ├── test_topics.py
│   │   └── test_lessons.py
│   ├── config.py                # DevelopmentConfig, TestingConfig, ProductionConfig
│   └── run.py                   # Entry point
└── frontend/
    ├── .env.example             # Documents VITE_ONBOARDING_ENABLED flag
    ├── src/
    │   ├── config/
    │   │   └── levels.js        # LEVELS array + getLevelForXP / getNextLevel / xpProgressToNextLevel
    │   ├── context/
    │   │   └── UserContext.jsx  # Loads/creates user; exposes useUser() + initUser()
    │   ├── components/
    │   │   ├── Navbar.jsx/module.css      # Level pill + XP + streak
    │   │   ├── LessonNode.jsx/module.css  # Journey map node (completed/current/locked)
    │   │   ├── FeedbackPanel.jsx/module.css  # Correct/wrong feedback after /check
    │   │   ├── TopicCard.jsx/module.css   # data-topic attr drives per-topic hover glow
    │   │   ├── LessonCard.jsx/module.css
    │   │   ├── Exercise.jsx               # Routes to ExerciseMultipleChoice or ExerciseFillBlank
    │   │   ├── ExerciseMultipleChoice.jsx # A/B/C/D letter badges
    │   │   └── ExerciseFillBlank.jsx      # inline underline input
    │   └── pages/
    │       ├── JourneyPage.jsx/module.css   # Default home — scrollable chapter road
    │       ├── OnboardingPage.jsx/module.css # 3-step wizard (goal / experience / daily time)
    │       ├── PlacementQuizPage.jsx/module.css # 5-question quiz for advanced users
    │       ├── Home.jsx/module.css          # Topic grid (accessible via /topics)
    │       ├── TopicPage.jsx/module.css     # Lesson list for a topic
    │       ├── LessonPage.jsx/module.css    # One-question-at-a-time flow + results screen
    │       └── ProfilePage.jsx/module.css   # Level card + XP progress bar + stats
    └── vite.config.js            # port 3000, /api proxy to :5000
```

## Data model

- **User** — `id`, `xp`, `streak`, `last_active_date`. No username/password.
- **UserProgress** — `user_id`, `lesson_id` (string), `score`, `total`, `xp_earned`. Unique per user+lesson; best score is kept on retry.
- **UserAnswer** — log of every individual exercise attempt.

No Topic/Lesson/Exercise DB tables — all content is static in `backend/app/content/lessons.py`.

## Lesson content

Defined in `backend/app/content/lessons.py` as three structures:
- `TOPICS` — ordered list of topic dicts (`id`, `title`, `description`, `icon`, `lesson_ids`)
- `CHAPTERS` — ordered list of chapter dicts (`id`, `title`, `lesson_ids`, `boss_lesson_id`, `order`). A chapter is unlocked when the previous chapter's boss lesson is completed; the first chapter is always unlocked.
- `LESSONS` — dict keyed by `lesson_id`; each lesson has `chapter_id`, `order`, `boss` flag, and an `exercises` list

Exercise types: `multiple_choice` (options list + correct_answer) and `fill_blank` (correct_answer string, case-insensitive match). **Correct answers are stripped before sending to the frontend** — only returned in the `/check` and `/complete` responses.

Current content: 4 topics, 4 chapters, 11 lessons, 44 exercises.
- Spark Fundamentals / ch_spark: spark_intro, spark_dataframes, spark_ops
- Delta Lake / ch_delta: delta_intro, delta_acid, delta_timetravel
- MLflow / ch_mlflow: mlflow_tracking, mlflow_registry
- Unity Catalog / ch_unity: unity_intro, unity_namespace

## XP & streaks

- XP earned = `lesson.xp_reward` + `5 × correct_answers`
- On retry, only the XP delta above the previous best is added
- Streak increments when `last_active_date` was yesterday; resets if gap > 1 day; no-ops if already active today

## Lakehouse Levels

XP thresholds map to named levels. Defined in `frontend/src/config/levels.js` (frontend) and mirrored in `backend/app/routes/users.py` (backend — included in `GET /api/users/<id>` response).

| Min XP | Level name |
|--------|-----------|
| 0 | Spark Rookie 🔥 |
| 200 | Bronze Committer 🥉 |
| 500 | Delta Writer 📝 |
| 1000 | Streaming Practitioner 🌊 |
| 2000 | Lakehouse Architect 🏛️ |
| 4000 | Databricks Master ⚡ |

`GET /api/users/<id>` includes `level_name`, `level_icon`, and `xp_to_next_level` in its response.

## Onboarding

Controlled by `VITE_ONBOARDING_ENABLED=true` in `frontend/.env` (see `.env.example`).

- **Unset (default)**: anonymous user is auto-created on first visit — no wizard shown.
- **`true`**: new users see a 3-step wizard (goal → experience → daily time). Advanced users are then offered a 5-question placement quiz; others go straight to the journey.

Selections are stored in `localStorage`: `padme_goal`, `padme_experience`, `padme_daily_goal_xp`.

## API shape

All endpoints prefixed `/api/`. Frontend proxies `/api` to `:5000`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users/` | Create anonymous user → `{id, xp, streak, ...}` |
| `GET` | `/api/users/<id>` | User profile + completed lessons + `level_name`, `level_icon`, `xp_to_next_level` |
| `GET` | `/api/topics/?user_id=<id>` | Topics with completion % |
| `GET` | `/api/lessons/?topic_id=<id>&user_id=<id>` | Lessons for a topic |
| `GET` | `/api/lessons/<id>` | Lesson detail + exercises (no correct answers) |
| `POST` | `/api/lessons/<id>/check` | `{user_id, exercise_id, answer}` → `{correct, explanation}` |
| `POST` | `/api/lessons/<id>/complete` | `{user_id, answers}` → `{score, xp_earned, total_xp, streak, results}` |
| `GET` | `/api/journey/?user_id=<id>` | Chapters with lessons and per-lesson completion + unlock status |

## Design system

Dark theme. CSS custom properties in `src/index.css`:
- `--primary: #ff3621` (Databricks red)
- `--success: #00c55a`, `--bg: #0d0e10`, `--surface: #16181d`, `--surface-2: #1e2128`
- `--font-display: 'Syne'`, `--font-mono: 'JetBrains Mono'`
- Per-topic hover glows on TopicCard: spark=amber, delta=blue, mlflow=violet, unity=green
