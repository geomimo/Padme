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

All 10 phases are complete. The app has a full learning loop, journey map, level system, optional onboarding, daily goal + streak shields, badges, learning paths, new question types, weekly leaderboard, and shareable public profiles.

| Feature | Status |
|---|---|
| Per-question flow with immediate feedback (Phase 1) | Done |
| Journey map with chapters and winding road (Phase 2) | Done |
| Lakehouse Levels (XP thresholds → named levels) (Phase 3) | Done |
| Onboarding wizard + placement quiz (Phase 4) | Done (opt-in via env var) |
| 4 topics, 11 lessons, 52 exercises (MC + fill blank + code_reading + match_pairs + order_steps) | Done |
| Anonymous users via `localStorage` user_id | Done |
| Daily goal + streak shield (Phase 5) | Done |
| Badges & achievements (Phase 6) | Done |
| Learning paths (Phase 7) | Done |
| New question types — code reading, match pairs, order steps (Phase 8) | Done |
| Weekly leaderboard with league tiers (Phase 9) | Done |
| Shareable public profile (Phase 10) | Done |

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
│   │   ├── models.py            # User, UserProgress, UserAnswer, UserBadge, UserPath, UserWeeklyXP
│   │   ├── routes/
│   │   │   ├── users.py         # POST /api/users/, GET /api/users/<id>, GET /api/users/<id>/public
│   │   │   ├── topics.py        # GET /api/topics/
│   │   │   ├── lessons.py       # GET /api/lessons/, GET /api/lessons/<id>,
│   │   │   │                    # POST /api/lessons/<id>/check, POST /api/lessons/<id>/complete
│   │   │   ├── journey.py       # GET /api/journey/?user_id=<id>
│   │   │   └── leaderboard.py   # GET /api/leaderboard/?user_id=<id>
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
    │   │   ├── Exercise.jsx               # Routes to all exercise type components
    │   │   ├── ExerciseCodeReading.jsx    # Code block + MC options
    │   │   ├── ExerciseMatchPairs.jsx     # Two-column tap-to-pair
    │   │   ├── ExerciseOrderSteps.jsx     # Up/down arrow reordering
    │   │   ├── LeagueBadge.jsx            # Bronze/Silver/Gold/Diamond tier badge
    │   │   └── BadgeIcon.jsx              # Earned/locked badge with tooltip
    │   └── pages/
    │       ├── JourneyPage.jsx/module.css   # Default home — scrollable chapter road
    │       ├── OnboardingPage.jsx/module.css # 3-step wizard (goal / experience / daily time)
    │       ├── PlacementQuizPage.jsx/module.css # 5-question quiz for advanced users
    │       ├── Home.jsx/module.css          # Topic grid (accessible via /topics)
    │       ├── TopicPage.jsx/module.css     # Lesson list for a topic
    │       ├── LessonPage.jsx/module.css    # One-question-at-a-time flow + results screen
    │       ├── LeaderboardPage.jsx/module.css # Opt-in weekly league
    │       ├── PublicProfilePage.jsx/module.css # Shareable read-only profile at /profile/:userId
    │       └── ProfilePage.jsx/module.css   # Level card + XP progress bar + stats + share button
    └── vite.config.js            # port 3000, /api proxy to :5000
```

## Data model

- **User** — `id`, `xp`, `streak`, `last_active_date`, `daily_goal_xp`, `streak_shields`, `daily_xp_today`, `leaderboard_opt_in`, `league_tier`. No username/password.
- **UserProgress** — `user_id`, `lesson_id` (string), `score`, `total`, `xp_earned`. Unique per user+lesson; best score is kept on retry.
- **UserAnswer** — log of every individual exercise attempt.
- **UserBadge** — `user_id`, `badge_id`, `earned_at`. Unique per user+badge.
- **UserPath** — `user_id`, `path_id`, `enrolled_at`, `completed_at`. Unique per user+path.
- **UserWeeklyXP** — `user_id`, `iso_week` (e.g. "2026-W17"), `weekly_xp`, `league_tier`. Unique per user+week.

No Topic/Lesson/Exercise DB tables — all content is static in `backend/app/content/lessons.py`.

## Lesson content

Defined in `backend/app/content/lessons.py` as three structures:
- `TOPICS` — ordered list of topic dicts (`id`, `title`, `description`, `icon`, `lesson_ids`)
- `CHAPTERS` — ordered list of chapter dicts (`id`, `title`, `lesson_ids`, `boss_lesson_id`, `order`). A chapter is unlocked when the previous chapter's boss lesson is completed; the first chapter is always unlocked.
- `LESSONS` — dict keyed by `lesson_id`; each lesson has `chapter_id`, `order`, `boss` flag, and an `exercises` list

Exercise types: `multiple_choice`, `fill_blank`, `code_reading`, `match_pairs`, `order_steps`. **Correct answers are stripped before sending to the frontend** — only returned in the `/check` and `/complete` responses.

- `code_reading` — same as MC but includes a `code` field with a syntax-highlighted code snippet
- `match_pairs` — `lefts[]` + `rights[]` arrays; answer is a JSON dict `{left: right}`
- `order_steps` — `steps[]` array; answer is a JSON array of original step indices in user's order

Current content: 4 topics, 4 chapters, 11 lessons, 52 exercises.
- Spark Fundamentals / ch_spark: spark_intro (code_reading), spark_dataframes (match_pairs), spark_ops (order_steps)
- Delta Lake / ch_delta: delta_intro (code_reading), delta_acid (match_pairs), delta_timetravel
- MLflow / ch_mlflow: mlflow_tracking (code_reading), mlflow_registry
- Unity Catalog / ch_unity: unity_intro (match_pairs), unity_namespace (order_steps)

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
| `GET` | `/api/users/<id>` | User profile + completed lessons + level + leaderboard fields |
| `GET` | `/api/users/<id>/public` | Public read-only profile (XP, level, streak, badges, mastery) |
| `PATCH` | `/api/users/<id>/settings` | Update `daily_goal_xp`, `leaderboard_opt_in` |
| `GET` | `/api/users/<id>/badges` | All badges with earned status |
| `GET` | `/api/topics/?user_id=<id>` | Topics with completion % |
| `GET` | `/api/lessons/?topic_id=<id>&user_id=<id>` | Lessons for a topic |
| `GET` | `/api/lessons/<id>` | Lesson detail + exercises (no correct answers) |
| `POST` | `/api/lessons/<id>/check` | `{user_id, exercise_id, answer}` → `{correct, explanation}` |
| `POST` | `/api/lessons/<id>/complete` | `{user_id, answers}` → `{score, xp_earned, total_xp, streak, results, new_badges}` |
| `GET` | `/api/journey/?user_id=<id>` | Chapters with lessons and per-lesson completion + unlock status |
| `GET` | `/api/leaderboard/?user_id=<id>` | Weekly league leaderboard for user's tier |

## Design system

Dark theme. CSS custom properties in `src/index.css`:
- `--primary: #ff3621` (Databricks red)
- `--success: #00c55a`, `--bg: #0d0e10`, `--surface: #16181d`, `--surface-2: #1e2128`
- `--font-display: 'Syne'`, `--font-mono: 'JetBrains Mono'`
- Per-topic hover glows on TopicCard: spark=amber, delta=blue, mlflow=violet, unity=green
