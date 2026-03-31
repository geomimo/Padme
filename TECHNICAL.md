# Padme — Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Backend](#backend)
   - [Technology Stack](#backend-technology-stack)
   - [Data Models](#data-models)
   - [API Reference](#api-reference)
   - [Business Logic Services](#business-logic-services)
   - [Authentication](#authentication)
   - [Admin Panel](#admin-panel)
4. [Frontend](#frontend)
   - [Technology Stack](#frontend-technology-stack)
   - [Routing & Pages](#routing--pages)
   - [State Management](#state-management)
   - [Component Architecture](#component-architecture)
   - [API Client](#api-client)
5. [Database](#database)
6. [Configuration & Environment Variables](#configuration--environment-variables)
7. [Deployment](#deployment)
   - [Docker (Recommended)](#docker-recommended)
   - [Manual Setup](#manual-setup)
8. [Testing](#testing)
9. [Seed Data](#seed-data)

---

## Architecture Overview

Padme follows a standard client–server architecture with two independently containerized services:

```
┌─────────────────────────────────────────────┐
│                  Browser                    │
│        Next.js 16 (React 19 / TS)           │
│              localhost:3000                 │
└─────────────────────┬───────────────────────┘
                      │ HTTP (REST / JSON)
                      │ Bearer token
┌─────────────────────▼───────────────────────┐
│           FastAPI (Python 3.11)             │
│              localhost:8000                 │
│  ┌──────────────────────────────────────┐  │
│  │  Routers → Services → SQLModel ORM   │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │         SQLite  (padme.db)           │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │     SQLAdmin  (/admin)               │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

Communication is stateless JWT-based REST. The frontend builds to a standalone Next.js bundle; the backend serves JSON from FastAPI.

---

## Project Structure

```
Padme/
├── README.md
├── TECHNICAL.md                 ← this file
├── USER_GUIDE.md
├── docker-compose.yml
│
├── backend/
│   ├── app/
│   │   ├── main.py              # App factory, CORS, router registration
│   │   ├── auth.py              # JWT encode/decode, bcrypt helpers
│   │   ├── database.py          # SQLite engine, session factory
│   │   ├── models.py            # All SQLModel table definitions
│   │   ├── admin.py             # SQLAdmin model views
│   │   ├── dependencies.py      # FastAPI dependency injection
│   │   ├── routers/             # One file per resource
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── categories.py
│   │   │   ├── lessons.py
│   │   │   ├── quizzes.py
│   │   │   ├── daily_set.py
│   │   │   ├── progress.py
│   │   │   ├── review.py
│   │   │   ├── achievements.py
│   │   │   ├── leaderboard.py
│   │   │   ├── history.py
│   │   │   ├── bookmarks.py
│   │   │   ├── paths.py
│   │   │   ├── onboarding.py
│   │   │   └── test_plans.py
│   │   └── services/            # Pure business logic (no HTTP)
│   │       ├── xp.py
│   │       ├── streak.py
│   │       ├── daily_set.py
│   │       ├── srs.py
│   │       └── achievements.py
│   ├── tests/
│   ├── seed.py
│   ├── entrypoint.sh
│   ├── requirements.txt
│   ├── requirements-test.txt
│   ├── Dockerfile
│   └── pytest.ini
│
└── frontend/
    ├── src/
    │   ├── app/                 # Next.js App Router pages
    │   │   ├── page.tsx         # Landing page
    │   │   ├── layout.tsx       # Root layout + providers
    │   │   ├── (auth)/login/    # Login page (unauthenticated layout)
    │   │   └── (app)/           # Authenticated layout
    │   │       ├── dashboard/
    │   │       ├── quiz/
    │   │       ├── review/
    │   │       ├── learn/
    │   │       ├── leaderboard/
    │   │       ├── achievements/
    │   │       ├── history/
    │   │       ├── bookmarks/
    │   │       ├── paths/
    │   │       ├── profile/
    │   │       ├── test-plans/
    │   │       ├── my-tests/
    │   │       ├── test-session/
    │   │       └── onboarding/
    │   ├── components/
    │   │   ├── ui/              # Radix-based primitives
    │   │   ├── quiz/            # Quiz session components
    │   │   ├── auth/
    │   │   ├── layout/          # Sidebar & TopBar
    │   │   ├── dashboard/
    │   │   ├── learn/
    │   │   └── achievements/
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   ├── hooks/
    │   │   ├── useQuizSession.ts
    │   │   └── useReviewSession.ts
    │   ├── lib/
    │   │   ├── api.ts           # Typed API client
    │   │   └── utils.ts
    │   └── types/
    │       └── index.ts         # Shared TypeScript interfaces
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── vitest.config.ts
```

---

## Backend

### Backend Technology Stack

| Concern | Library | Version |
|---------|---------|---------|
| Web framework | FastAPI | 0.115+ |
| ORM / validation | SQLModel (SQLAlchemy + Pydantic) | 0.0.21+ |
| Database | SQLite | (embedded) |
| ASGI server | Uvicorn | 0.30+ |
| Auth: JWT | python-jose[cryptography] | 3.3+ |
| Auth: passwords | bcrypt | 4.0+ |
| Admin UI | SQLAdmin | 0.18+ |
| Form parsing | python-multipart | 0.0.9+ |
| Env vars | python-dotenv | 1.0+ |
| Session signing | itsdangerous | 2.1+ |
| Language | Python | 3.11 |

---

### Data Models

All models live in `backend/app/models.py` and are defined with SQLModel.

#### User

```
id            int          Primary key
email         str          Unique, indexed
hashed_password str
xp            int          Default 0
streak        int          Default 0
longest_streak int         Default 0
streak_freeze_count int    Default 2
onboarding_completed bool  Default False
created_at    datetime
```

#### Category

```
id            int
name          str          e.g. "Delta Lake", "Apache Spark"
description   str
icon          str          Emoji or icon identifier
order         int          Display order
```

#### Lesson

```
id            int
title         str
description   str
category_id   int          FK → Category
order         int
is_published  bool
```

#### Quiz

```
id            int
question      str
type          str          "multiple_choice" | "true_false"
explanation   str          Shown after answering
lesson_id     int          FK → Lesson
is_published  bool
```

#### QuizOption

```
id            int
quiz_id       int          FK → Quiz
text          str
is_correct    bool
```

#### DailySet

```
id            int
user_id       int          FK → User
date          date         The calendar day this set belongs to
is_completed  bool
total_xp_earned int
created_at    datetime
```

#### UserAnswer

```
id            int
daily_set_id  int          FK → DailySet
quiz_id       int          FK → Quiz
selected_option_id int     FK → QuizOption (nullable for T/F)
is_correct    bool
xp_earned     int
answered_at   datetime
```

#### QuizSRSState

```
id            int
user_id       int
quiz_id       int
ease_factor   float        SM-2 ease factor (default 2.5)
interval      int          Days until next review
repetitions   int
next_review   date
last_reviewed date
```

#### Achievement

```
id            int
key           str          Unique identifier e.g. "first_perfect_set"
name          str
description   str
icon          str
```

Plus join models: `UserAchievement`, `UserProgress`, `ReviewSession`, `ReviewAnswer`, `TestPlan`, `TestSession`, `LearningPath`, `UserBookmark`.

---

### API Reference

Base URL: `http://localhost:8000`

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

#### Authentication

| Method | Path | Body | Response | Auth |
|--------|------|------|----------|------|
| POST | `/auth/login` | `{email, password}` | `{access_token, token_type, user}` | No |
| GET | `/auth/me` | — | `User` object | Yes |

#### Users

| Method | Path | Notes |
|--------|------|-------|
| GET | `/users` | Admin only |
| POST | `/users` | Admin only |
| PATCH | `/users/{id}` | Admin only |
| DELETE | `/users/{id}` | Admin only |
| POST | `/users/me/use-streak-freeze` | Consume one streak freeze |

#### Daily Quiz

| Method | Path | Body | Notes |
|--------|------|------|-------|
| GET | `/daily-set` | — | Returns or creates today's 5-quiz set |
| POST | `/daily-set/{id}/answer` | `{quiz_id, selected_option_id?, answer_bool?}` | Returns `{is_correct, xp_earned, explanation}` |
| POST | `/daily-set/{id}/complete` | — | Returns `{xp_earned, streak, achievements_unlocked}` |

#### Progress

| Method | Path | Response |
|--------|------|----------|
| GET | `/progress` | `{xp, streak, longest_streak, category_mastery[], weekly_activity[]}` |

#### Content

| Method | Path | Notes |
|--------|------|-------|
| GET | `/categories` | Public |
| GET | `/categories/{id}` | Public |
| GET | `/lessons?category_id=N` | Filter by category |
| GET | `/lessons/{id}` | |
| GET | `/quizzes/by-lesson/{lesson_id}` | |

#### Leaderboard

| Method | Path | Response |
|--------|------|----------|
| GET | `/leaderboard` | Top 20 users + current user rank |

#### Achievements

| Method | Path | Response |
|--------|------|----------|
| GET | `/achievements` | All achievements with `earned: bool` |

#### Review Sessions

| Method | Path | Body |
|--------|------|------|
| POST | `/review/start` | — |
| GET | `/review/{id}` | — |
| POST | `/review/{id}/answer` | `{quiz_id, selected_option_id?, answer_bool?}` |
| POST | `/review/{id}/complete` | — |

#### History

| Method | Path | Response |
|--------|------|----------|
| GET | `/history` | Past daily sets with scores and XP |

#### Bookmarks

| Method | Path | Body |
|--------|------|------|
| GET | `/bookmarks` | — |
| POST | `/bookmarks` | `{quiz_id}` |
| DELETE | `/bookmarks/{quiz_id}` | — |

#### Learning Paths

| Method | Path | Response |
|--------|------|----------|
| GET | `/paths` | Curated sequences with completion % |

#### Test Plans (Admin-created assignments)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/test-plans` | |
| POST | `/test-plans` | Admin only |
| GET | `/test-plans/{id}` | |
| PUT | `/test-plans/{id}` | Admin only |
| DELETE | `/test-plans/{id}` | Admin only |
| POST | `/test-plans/{id}/sessions` | Start a session |
| GET | `/test-plans/{id}/sessions` | List sessions |
| GET | `/test-sessions/{id}` | |
| POST | `/test-sessions/{id}/answer` | |
| POST | `/test-sessions/{id}/complete` | |

#### Onboarding

| Method | Path | Notes |
|--------|------|-------|
| GET | `/onboarding/quiz` | Initial onboarding questions |
| POST | `/onboarding/complete` | Mark onboarding done |

#### Health

| Method | Path |
|--------|------|
| GET | `/health` |

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

### Business Logic Services

#### XP Service (`app/services/xp.py`)

Calculates XP earned per correct answer with streak bonuses:

| Streak | Bonus |
|--------|-------|
| 0–2 days | +0% |
| 3–6 days | +10% |
| 7–13 days | +20% |
| 14–29 days | +30% |
| 30+ days | +50% |

- **Base XP per correct answer:** 10
- **Perfect set bonus:** +20 XP (all 5 correct)
- **Formula:** `xp = base_xp * (1 + streak_bonus_fraction)`

#### Streak Service (`app/services/streak.py`)

- Increments streak when a daily set is completed
- Resets streak to 0 if the previous calendar day had no completed set
- Updates `longest_streak` if the new streak exceeds the record
- Streak freezes prevent a reset for one missed day (users have 2 by default)

#### Spaced Repetition Service (`app/services/srs.py`)

Implements the **SM-2 algorithm**:

1. After each answer, a quality score is assigned: **4** (correct) or **1** (incorrect)
2. **Ease factor** is updated: `new_ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`
3. **Interval** advances: 1 day → 6 days → `prev_interval * ease_factor`
4. `next_review` date is set `interval` days from today
5. On failure, repetitions reset to 0 and interval returns to 1

#### Daily Set Service (`app/services/daily_set.py`)

Selects exactly 5 quizzes for a user's daily set using this priority order:

1. **Overdue** — quizzes where `next_review <= today`
2. **New** — quizzes never seen by this user
3. **Not yet due** — scheduled for the future (used as fallback)

Quizzes answered correctly within the last 7 days are excluded when there are enough alternative candidates.

#### Achievements Service (`app/services/achievements.py`)

Checks unlock conditions after each completed daily set. Examples:
- `first_quiz` — Complete first quiz
- `first_perfect_set` — 5/5 on a daily set
- `streak_7` — Maintain a 7-day streak
- `streak_30` — Maintain a 30-day streak

---

### Authentication

`backend/app/auth.py` implements:

- **Password hashing:** bcrypt via `passlib`
- **JWT creation:** `python-jose` with HS256, configurable expiry (default 7 days)
- **Dependency:** `get_current_user` is a FastAPI dependency injected into all authenticated routes

Token payload:
```json
{
  "sub": "<user_email>",
  "exp": <unix_timestamp>
}
```

---

### Admin Panel

SQLAdmin at `/admin` provides full CRUD for:
- Users (searchable by email)
- Categories, Lessons, Quizzes, QuizOptions
- DailySets, UserAnswers
- Achievements, TestPlans

Access requires the `ADMIN_SECRET` from the environment. Log in at `/admin/login`.

---

## Frontend

### Frontend Technology Stack

| Concern | Library | Version |
|---------|---------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| UI library | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Animations | Framer Motion | 12.38.0 |
| Confetti | canvas-confetti | 1.9.4 |
| Icons | lucide-react | 1.7.0 |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| State | Zustand | 5.0.12 |
| Components | Radix UI | various |
| Class utils | clsx + tailwind-merge | — |
| Testing | Vitest + Testing Library | 4.1.2 |
| Linting | ESLint 9 + next/core-web-vitals | — |

---

### Routing & Pages

The App Router uses two layout groups:

| Route | Layout | Page |
|-------|--------|------|
| `/` | Root | Landing page |
| `/login` | `(auth)` | Login form |
| `/dashboard` | `(app)` | XP, streak, daily progress |
| `/quiz/[dailySetId]` | `(app)` | 5-question daily set |
| `/review/[sessionId]` | `(app)` | Mistake review session |
| `/learn/[lessonId]` | `(app)` | Lesson content viewer |
| `/leaderboard` | `(app)` | Top XP rankings |
| `/achievements` | `(app)` | Badge gallery |
| `/history` | `(app)` | Past session log |
| `/bookmarks` | `(app)` | Saved quizzes |
| `/paths` | `(app)` | Learning paths |
| `/profile` | `(app)` | User profile & stats |
| `/test-plans` | `(app)` | Admin-assigned test plans |
| `/my-tests` | `(app)` | User's test sessions |
| `/test-session/[sessionId]` | `(app)` | Active test session |
| `/onboarding` | `(app)` | First-run onboarding flow |

Route protection is enforced in the `(app)` layout via `AuthContext`.

---

### State Management

#### AuthContext (`src/contexts/AuthContext.tsx`)

Global React context providing:
- `user` — current `User` object or `null`
- `token` — JWT string stored in `localStorage`
- `login(email, password)` — calls API, stores token, fetches user
- `logout()` — clears token and user
- Automatically re-hydrates from `localStorage` on mount

#### useQuizSession (`src/hooks/useQuizSession.ts`)

Manages in-progress daily set state:
- Current question index
- List of answers submitted
- Loading / submitting flags
- `submitAnswer(quizId, answer)` — calls API, updates local state
- `complete()` — calls complete API, returns XP + achievements

#### useReviewSession (`src/hooks/useReviewSession.ts`)

Same interface as `useQuizSession` but scoped to review (mistakes) sessions.

---

### Component Architecture

#### Quiz Components (`src/components/quiz/`)

| Component | Responsibility |
|-----------|---------------|
| `QuizSession` | Orchestrates the full quiz flow |
| `MultipleChoiceQuestion` | Renders option buttons, highlights correct/wrong |
| `TrueFalseQuestion` | Renders True/False toggle |
| `ProgressBar` | Shows question N of 5 |
| `AnswerFeedback` | Displays explanation after each answer |
| `CompletionScreen` | Final XP tally, streak update, achievements |

#### Layout Components (`src/components/layout/`)

| Component | Responsibility |
|-----------|---------------|
| `AppSidebar` | Navigation links, current XP, streak badge |
| `TopBar` | Page title, user avatar / menu |

#### UI Primitives (`src/components/ui/`)

Thin wrappers around Radix UI: `Button`, `Card`, `Input`, `Badge`, `Progress`, `Dialog`, `Label`, `Select`, `Textarea`, `Tooltip`.

---

### API Client

`src/lib/api.ts` exports a typed client organised by resource:

```typescript
authApi.login(email, password)
authApi.me()

dailySetApi.get()           // GET /daily-set
dailySetApi.answer(id, payload)
dailySetApi.complete(id)

progressApi.get()

categoriesApi.list()
lessonsApi.list(categoryId?)
quizzesApi.byLesson(lessonId)

reviewApi.start()
reviewApi.get(id)
reviewApi.answer(id, payload)
reviewApi.complete(id)

achievementsApi.list()
leaderboardApi.get()
historyApi.get()
bookmarksApi.list()
bookmarksApi.add(quizId)
bookmarksApi.remove(quizId)
pathsApi.list()
onboardingApi.getQuiz()
onboardingApi.complete()

testPlansApi.list()
testPlansApi.get(id)
testPlansApi.startSession(id)
// ...
```

All methods automatically attach the `Authorization: Bearer` header from `localStorage`.

---

## Database

- **Engine:** SQLite (file: `backend/padme.db`)
- **ORM:** SQLModel (built on SQLAlchemy + Pydantic)
- **Schema creation:** `SQLModel.metadata.create_all(engine)` on startup
- **Seeding:** `backend/seed.py` inserts 8 categories, 20 lessons, 60+ quizzes, 2 users, and achievements

The database file is excluded from version control. In Docker it is stored in a named volume (`backend_data`).

---

## Configuration & Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./padme.db` |
| `SECRET_KEY` | JWT signing key (32+ random chars) | — (required) |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `10080` (7 days) |
| `ADMIN_SECRET` | SQLAdmin login secret | — (required) |

Copy `backend/.env.example` to `backend/.env` and fill in the required values.

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL for backend API | `http://localhost:8000` |

This variable is baked into the static bundle at build time, so it must be set before running `npm run build` or `docker compose up --build`.

---

## Deployment

### Docker (Recommended)

```bash
# Clone and start
git clone <repo>
cd Padme
docker compose up --build
```

Services defined in `docker-compose.yml`:

| Service | Port | Notes |
|---------|------|-------|
| `backend` | 8000 | Health-checked; seeds DB on first start |
| `frontend` | 3000 | Depends on backend health check passing |

To point the frontend at a remote API:
```bash
NEXT_PUBLIC_API_URL=https://api.example.com docker compose up --build
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Copy and fill in env vars
cp .env.example .env

# Seed database
python seed.py

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install

# Set API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev        # Development (hot-reload)
# OR
npm run build && npm start   # Production
```

---

## Testing

### Backend

```bash
cd backend
pip install -r requirements-test.txt
pytest
```

Configuration: `backend/pytest.ini`

### Frontend

```bash
cd frontend
npm test           # Run once
npm run test:watch # Watch mode
```

Configuration: `frontend/vitest.config.ts`

Test files are co-located under `frontend/src/__tests__/`.

---

## Seed Data

`backend/seed.py` populates a fresh database with:

- **2 users:** admin (`admin@padme.dev`) and a standard user (`user@padme.dev`)
- **8 categories:** Delta Lake, Apache Spark, MLflow, Databricks SQL, Unity Catalog, Databricks Workflows, AutoML, Databricks Runtime
- **20 lessons** distributed across categories
- **60+ quizzes** (mix of Multiple Choice and True/False), all published
- **Default achievements** for common milestones

Seed passwords are for development only — change them before any public deployment.
