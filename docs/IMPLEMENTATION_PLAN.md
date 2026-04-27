# Padme — Implementation Plan

This document is the authoritative reference for building out the full Padme product vision. Reference it across sessions to maintain continuity.

For the product narrative see [`../CLAUDE.md`](../CLAUDE.md) (Product Vision section).

---

## Guiding Principles

- Content (topics, lessons, exercises, paths, chapters) stays **static in Python files** — no DB tables for content.
- Users and all their state (XP, streak, progress, badges, enrollments) live in **SQLite via SQLAlchemy**.
- Correct answers are **never exposed** to the frontend in lesson-fetch responses; they are only returned in answer-check and lesson-complete responses.
- All endpoints prefixed `/api/`. Frontend proxies `/api` → `:5000`.

---

## Current State

| Area | Status |
|---|---|
| Topic grid → lesson list → lesson page | Done |
| XP (`xp_reward + 5×correct`) + daily streak | Done |
| 4 topics, 4 chapters, 11 lessons, 44 exercises (MC + fill blank) | Done |
| Anonymous user via localStorage | Done |
| Per-question flow with immediate feedback (Phase 1) | **Done** |
| Journey map with chapters (Phase 2) | **Done** |
| Lakehouse Levels (Phase 3) | **Done** |
| Onboarding flow — opt-in via `VITE_ONBOARDING_ENABLED` (Phase 4) | **Done** |
| Daily goal + streak shield (Phase 5) | Not built |
| Badges & achievements (Phase 6) | Not built |
| Learning paths (Phase 7) | Not built |
| New question types — code reading, match, order (Phase 8) | Not built |
| Weekly leaderboard (Phase 9) | Not built |
| Shareable public profile (Phase 10) | Not built |

---

## Phase 1 — Lesson Flow Overhaul *(highest priority)*

**Goal:** Replace batch-submit with a one-question-at-a-time flow. Wrong answer shows explanation and retries. Correct answer shows reinforcement note and advances.

### Why first
This is the core learning loop. Every other phase builds on top of it.

### Backend

**Content (`backend/app/content/lessons.py`):**
- Add `explanation_correct: str` and `explanation_wrong: str` to every exercise dict.
- These are informational — safe to expose in the lesson-fetch response.

**New endpoint:** `POST /api/lessons/<lesson_id>/check`
- Request: `{ "exercise_id": str, "answer": str, "user_id": str }`
- Response: `{ "correct": bool, "explanation": str }`
- Validates answer against content, returns the appropriate explanation.
- Logs to `UserAnswer` table (same as today's complete endpoint does).
- File: `backend/app/routes/lessons.py`

**Lesson-fetch response update** (`GET /api/lessons/<id>`):
- Include `explanation_correct` and `explanation_wrong` per exercise (they don't reveal the answer).

### Frontend

**`LessonPage.jsx` — full rewrite:**
- State machine: `{ phase: 'question' | 'feedback' | 'results', currentIndex, answers }`
- On answer submit: call `POST /check`, show feedback panel.
- If wrong: display `explanation_wrong`, show retry button, re-present same question.
- If correct: display `explanation_correct`, show "Continue" button, advance index.
- When all questions answered correctly: call existing `POST /complete`, transition to results screen.

**New `FeedbackPanel` component (`frontend/src/components/FeedbackPanel.jsx`):**
- Props: `correct: bool`, `explanation: str`, `onContinue: fn`
- Green border + checkmark for correct; red border + X for wrong.
- Styled via `FeedbackPanel.module.css`.

**Results screen update:**
- Add "concepts covered" list — one sentence per question (sourced from `explanation_correct`).
- Primary CTA: next lesson in journey/path (or back to map if none).

### Key files
- `backend/app/content/lessons.py` — add explanations to all 44 exercises
- `backend/app/routes/lessons.py` — add `/check` route
- `frontend/src/pages/LessonPage.jsx` — rewrite flow
- `frontend/src/components/FeedbackPanel.jsx` — new component

---

## Phase 2 — The Journey

**Goal:** A scrollable, linear road through all content, divided into chapters, each ending with a Boss Lesson.

### Content structure additions (`backend/app/content/lessons.py`)

Add a `CHAPTERS` list:
```python
CHAPTERS = [
  {
    "id": "ch_spark",
    "title": "Spark Foundations",
    "description": "...",
    "lesson_ids": ["spark_intro", "spark_dataframes", "spark_ops"],
    "boss_lesson_id": "spark_boss",
    "order": 1,
  },
  ...
]
```

Add a `boss` boolean flag to boss lessons in `LESSONS`. Boss lessons are longer (8–10 questions), harder, and award a chapter badge.

Add `chapter_id` and `order` fields to each lesson in `LESSONS`.

### Backend

**New endpoint:** `GET /api/journey/?user_id=<id>`
- Returns `CHAPTERS` list, each with its lessons and per-lesson completion status for the user.
- A chapter is "unlocked" if the previous chapter's boss lesson is completed (first chapter always unlocked).
- File: `backend/app/routes/journey.py` (new file, register blueprint in `app/__init__.py`)

### Frontend

**New `JourneyPage.jsx` (`frontend/src/pages/JourneyPage.jsx`):**
- Scrollable vertical road.
- Each chapter is a section with a header and a row/column of lesson nodes.
- Completed nodes: filled icon. Current node: pulsing ring. Locked nodes: greyed out.
- Boss lesson node is visually distinct (larger, shield icon).
- Tapping a node navigates to the lesson.

**Navigation update:**
- Home screen becomes Journey by default.
- Navbar: Journey | Topics | Paths | Profile.

**New `LessonNode` component** for the map.

### Key files
- `backend/app/content/lessons.py` — add `CHAPTERS`, boss lessons, per-lesson `chapter_id`/`order`
- `backend/app/routes/journey.py` — new blueprint
- `backend/app/__init__.py` — register journey blueprint
- `frontend/src/pages/JourneyPage.jsx` — new page
- `frontend/src/components/LessonNode.jsx` — new component
- `frontend/src/App.jsx` (or router file) — add `/journey` route, make it default

---

## Phase 3 — Lakehouse Levels

**Goal:** XP thresholds map to Databricks-flavored level names. Displayed in Navbar, Profile, and results screen. Level-up triggers a celebration.

### Level definitions (frontend config)

```js
// frontend/src/config/levels.js
export const LEVELS = [
  { min: 0,    name: 'Spark Rookie',          icon: '🔥' },
  { min: 200,  name: 'Bronze Committer',       icon: '🥉' },
  { min: 500,  name: 'Delta Writer',           icon: '📝' },
  { min: 1000, name: 'Streaming Practitioner', icon: '🌊' },
  { min: 2000, name: 'Lakehouse Architect',    icon: '🏛️' },
  { min: 4000, name: 'Databricks Master',      icon: '⚡' },
];

export function getLevelForXP(xp) { ... }
export function getNextLevel(xp) { ... }
export function xpProgressToNextLevel(xp) { ... } // 0–1 float
```

### Backend

- `GET /api/users/<id>` response: add `level_name`, `level_icon`, `xp_to_next_level`.
- Compute from the same `LEVELS` config (duplicated or derived in Python).

### Frontend

- `Navbar.jsx`: show level icon + name next to XP.
- `ProfilePage.jsx`: level card with XP progress bar to next level.
- `LessonPage.jsx` results: detect XP crossing a level threshold, show level-up banner.

### Key files
- `frontend/src/config/levels.js` — new config file
- `backend/app/routes/users.py` — add level fields to response
- `frontend/src/components/Navbar.jsx`
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/pages/LessonPage.jsx`

---

## Phase 4 — Onboarding

**Goal:** First-visit flow captures goal, experience level, and daily time commitment. Recommends a journey starting point.

### Flow (frontend only, no new endpoints)

Three screens shown before user creation when no `user_id` in localStorage:

1. **Goal** — "Pass a certification" / "New to Databricks" / "Deepen a specific skill"
2. **Experience** — Beginner / Intermediate / Advanced
3. **Daily time** — 5 min (Light) / 10 min (Regular) / 20+ min (Intense)

Store selections in localStorage: `padme_goal`, `padme_experience`, `padme_daily_goal_xp` (10 / 30 / 80).

After the three screens, create the user (`POST /api/users/`), then offer the placement quiz (skippable). Based on experience level, navigate to the recommended chapter in the Journey:
- Beginner → Chapter 1
- Intermediate → Chapter 3
- Advanced → placement quiz determines start

**Placement quiz:** 5–7 questions sampled from mid-journey lessons. Answered count of correct responses maps to a starting chapter.

### Key files
- `frontend/src/pages/OnboardingPage.jsx` — new page (3-step wizard)
- `frontend/src/pages/PlacementQuizPage.jsx` — new page
- `frontend/src/context/UserContext.jsx` — gate user creation behind onboarding completion
- `frontend/src/App.jsx` — redirect to `/onboarding` if no user_id

---

## Phase 5 — Daily Goal & Streak Shield

**Goal:** User sets a daily XP target. Hitting it earns a streak shield (max 1/week). Shields absorb a missed day.

### Data model changes

```python
# backend/app/models.py — add to User
daily_goal_xp = db.Column(db.Integer, default=30)
streak_shields = db.Column(db.Integer, default=0)
daily_xp_today = db.Column(db.Integer, default=0)
daily_xp_date = db.Column(db.Date, nullable=True)
shield_granted_week = db.Column(db.Integer, nullable=True)  # ISO week number
```

### Backend logic changes

**`backend/app/routes/lessons.py` — `POST /complete`:**
- Increment `daily_xp_today` when xp is earned; reset it on a new day.
- When `daily_xp_today >= daily_goal_xp` for the first time today: check if a shield was already granted this ISO week; if not, grant one (`streak_shields += 1`, record `shield_granted_week`).

**Streak logic (`backend/app/routes/users.py` or shared util):**
- On a missed day: if `streak_shields > 0`, consume one shield and keep the streak; otherwise reset.

**`GET /api/users/<id>`:** include `daily_goal_xp`, `daily_xp_today`, `streak_shields`.

**New endpoint:** `PATCH /api/users/<id>/settings` — update `daily_goal_xp`.

### Frontend

- Home screen: daily goal progress bar (XP today / goal, e.g. "20 / 30 XP").
- Streak counter: show shield count badge when shields > 0.
- Settings option (in Profile) to change daily goal.

### Key files
- `backend/app/models.py`
- `backend/app/routes/lessons.py`
- `backend/app/routes/users.py` (new `PATCH /settings` route)
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/ProfilePage.jsx`

---

## Phase 6 — Badges & Achievements

**Goal:** Discrete collectible milestones. Checked and awarded at lesson completion and streak update. Displayed on profile and briefly shown on results screen.

### Badge definitions (static, `backend/app/content/badges.py`)

```python
BADGES = [
  { "id": "streak_7",       "name": "Week Warrior",     "description": "7-day streak",            "icon": "🔥" },
  { "id": "streak_30",      "name": "Monthly Devotee",  "description": "30-day streak",           "icon": "📅" },
  { "id": "streak_100",     "name": "Century Streak",   "description": "100-day streak",          "icon": "💯" },
  { "id": "perfect_lesson", "name": "No Mistakes",      "description": "Complete a lesson with no wrong answers", "icon": "⭐" },
  { "id": "topic_spark",    "name": "Spark Master",     "description": "≥80% on all Spark lessons", "icon": "⚡" },
  { "id": "topic_delta",    "name": "Delta Expert",     "description": "≥80% on all Delta lessons", "icon": "🔺" },
  { "id": "topic_mlflow",   "name": "ML Practitioner",  "description": "≥80% on all MLflow lessons", "icon": "🧪" },
  { "id": "topic_unity",    "name": "Unity Champion",   "description": "≥80% on all Unity lessons", "icon": "🏰" },
  { "id": "comeback",       "name": "Back in Business", "description": "Returned after a 7+ day gap", "icon": "🔄" },
  { "id": "path_complete",  "name": "Path Graduate",    "description": "Completed a learning path",  "icon": "🎓" },
]
```

### Data model

```python
# backend/app/models.py
class UserBadge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.String, nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('user_id', 'badge_id'),)
```

### Backend

**Badge evaluation util (`backend/app/utils/badges.py`):**
- `evaluate_badges(user, user_progresses) -> list[badge_id]` — checks all conditions, returns newly earned badge ids.
- Called at the end of `POST /complete` and after streak updates.
- Newly earned badges returned in the `POST /complete` response under `new_badges`.

**`GET /api/users/<id>/badges`** — returns all earned badges with metadata.

### Frontend

- `ProfilePage.jsx`: badge wall section (grid of badge icons, greyed out if unearned).
- `LessonPage.jsx` results: if `new_badges` in response, show badge unlock notification.
- `BadgeIcon` component with tooltip.

### Key files
- `backend/app/content/badges.py` — new file
- `backend/app/models.py` — `UserBadge` model
- `backend/app/utils/badges.py` — new utility
- `backend/app/routes/lessons.py` — call badge evaluator in complete
- `backend/app/routes/users.py` — add `/badges` endpoint
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/pages/LessonPage.jsx`
- `frontend/src/components/BadgeIcon.jsx` — new component

---

## Phase 7 — Learning Paths

**Goal:** Curated lesson collections around a theme or certification goal. Users enroll, track progress, earn a completion badge.

### Path definitions (static, `backend/app/content/paths.py`)

```python
PATHS = [
  {
    "id": "path_de_associate",
    "title": "Databricks Data Engineer Associate — Exam Prep",
    "description": "Cover all exam domains for the DE Associate certification.",
    "lesson_ids": ["spark_intro", "spark_dataframes", "delta_intro", "delta_acid", ...],
    "estimated_minutes": 90,
    "certification_tier": "associate",
    "badge_id": "path_de_associate",
  },
  {
    "id": "path_mlflow_starter",
    "title": "Getting Started with MLflow",
    ...
  },
  ...
]
```

### Data model

```python
# backend/app/models.py
class UserPath(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, db.ForeignKey('user.id'), nullable=False)
    path_id = db.Column(db.String, nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    __table_args__ = (db.UniqueConstraint('user_id', 'path_id'),)
```

### Backend

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/paths/?user_id=<id>` | All paths with enrollment + completion status |
| `GET` | `/api/paths/<id>?user_id=<id>` | Path detail, lessons with per-lesson completion |
| `POST` | `/api/paths/<id>/enroll` | Enroll user: `{ user_id }` |
| `POST` | `/api/paths/<id>/unenroll` | Unenroll user |

Path completion: checked in `POST /complete` — after a lesson is completed, check if all lessons in any enrolled path are now done; if so, set `completed_at` and award path badge.

### Frontend

**New `PathsPage.jsx`:** catalog of all paths, each showing title, estimated time, cert tier, and enrollment status.

**New `PathDetailPage.jsx`:** enrolled view with sequential lesson list, progress bar, and completion certificate on 100%.

**`PathCard` component:** title, description, tags (cert tier, estimated time), enroll button.

**Navbar update:** add Paths route.

### Key files
- `backend/app/content/paths.py` — new file
- `backend/app/models.py` — `UserPath` model
- `backend/app/routes/paths.py` — new blueprint
- `backend/app/__init__.py` — register paths blueprint
- `frontend/src/pages/PathsPage.jsx` — new page
- `frontend/src/pages/PathDetailPage.jsx` — new page
- `frontend/src/components/PathCard.jsx` — new component

---

## Phase 8 — New Question Types

**Goal:** Expand beyond multiple choice and fill blank to include code reading, match pairs, and arrange steps.

### Content schema additions (`backend/app/content/lessons.py`)

**`code_reading`:**
```python
{
  "id": "ex_id",
  "type": "code_reading",
  "code": "df.write.format('delta').save('/path')",
  "question": "What format does this write operation use?",
  "options": ["parquet", "delta", "orc", "csv"],
  "correct_answer": "delta",
  "explanation_correct": "...",
  "explanation_wrong": "...",
}
```

**`match_pairs`:**
```python
{
  "type": "match_pairs",
  "question": "Match each operation to its description.",
  "pairs": [
    { "left": "MERGE INTO", "right": "Upsert rows" },
    { "left": "OPTIMIZE",   "right": "Compact small files" },
  ],
  "correct_answer": { "MERGE INTO": "Upsert rows", "OPTIMIZE": "Compact small files" },
  ...
}
```

**`order_steps`:**
```python
{
  "type": "order_steps",
  "question": "Put these steps in the correct order.",
  "steps": ["Create schema", "Write data", "Read with Spark", "Register in Unity Catalog"],
  "correct_answer": [0, 2, 1, 3],  # indices in correct order
  ...
}
```

### Backend

- `POST /api/lessons/<id>/check` must handle all new types.
- Answer comparison logic per type: string match (MC/fill), dict comparison (match), list comparison (order).

### Frontend

**New components:**
- `ExerciseCodeReading.jsx` — syntax-highlighted code block (`react-syntax-highlighter` or pre/code styled) + question + MC options.
- `ExerciseMatchPairs.jsx` — two columns, tap left then tap right to pair. Show visual lines between matched pairs.
- `ExerciseOrderSteps.jsx` — draggable list (`@dnd-kit/core`) for reordering.

**`LessonPage.jsx`:** extend the exercise-type router to include the three new types.

### Key files
- `backend/app/content/lessons.py` — add exercises of new types
- `backend/app/routes/lessons.py` — update `/check` for new types
- `frontend/src/components/ExerciseCodeReading.jsx` — new
- `frontend/src/components/ExerciseMatchPairs.jsx` — new
- `frontend/src/components/ExerciseOrderSteps.jsx` — new
- `frontend/src/pages/LessonPage.jsx` — extend exercise router

---

## Phase 9 — Weekly Leaderboard

**Goal:** Opt-in weekly XP competition. Users grouped into leagues by level. Top finishers promoted, bottom demoted end-of-week.

### Data model

```python
class UserWeeklyXP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String, db.ForeignKey('user.id'), nullable=False)
    iso_week = db.Column(db.String, nullable=False)    # e.g. "2026-W17"
    weekly_xp = db.Column(db.Integer, default=0)
    league_tier = db.Column(db.Integer, default=1)     # 1=Bronze … 4=Diamond
    __table_args__ = (db.UniqueConstraint('user_id', 'iso_week'),)
```

```python
# User model: add
leaderboard_opt_in = db.Column(db.Boolean, default=False)
league_tier = db.Column(db.Integer, default=1)
```

### Backend

- `POST /complete` accumulates `weekly_xp` for the current ISO week.
- End-of-week promotion: lazy evaluation on first request of a new week — promote top 25%, demote bottom 25% from the previous week's record.
- `GET /api/leaderboard/?user_id=<id>` — returns current league members, sorted by weekly XP, with the requesting user highlighted.
- `PATCH /api/users/<id>/settings` — toggle `leaderboard_opt_in`.

### Frontend

**New `LeaderboardPage.jsx`:** opt-in prompt if not enrolled; league tier banner; ranked list of users with XP and level; user's own row highlighted.

**`LeagueBadge` component:** Bronze / Silver / Gold / Diamond visual.

### Key files
- `backend/app/models.py` — `UserWeeklyXP`, update `User`
- `backend/app/routes/leaderboard.py` — new blueprint
- `backend/app/__init__.py` — register
- `frontend/src/pages/LeaderboardPage.jsx` — new page
- `frontend/src/components/LeagueBadge.jsx` — new

---

## Phase 10 — Shareable Public Profile

**Goal:** Every user has a public URL they can share to show streak, level, badges, and topic mastery.

### Backend

**`GET /api/users/<id>/public`:**
- Returns: `xp`, `level_name`, `streak`, `badges` (earned), `topic_mastery` (per-topic score averages), `paths_completed`.
- No PII — anonymous by design.

### Frontend

**`PublicProfilePage.jsx`:** same layout as `ProfilePage.jsx` but read-only, no settings. Accessible without a user_id in localStorage.

**Share button** on `ProfilePage.jsx`: copies `<origin>/profile/<user_id>` to clipboard. Show "Link copied!" toast.

### Key files
- `backend/app/routes/users.py` — add `/public` endpoint
- `frontend/src/pages/PublicProfilePage.jsx` — new page
- `frontend/src/pages/ProfilePage.jsx` — add share button

---

## Suggested Build Order

```
Phase 1 (Lesson Flow)  →  Phase 2 (Journey)  →  Phase 3 (Levels)
       ↓
Phase 4 (Onboarding)   →  Phase 5 (Daily Goal + Shield)
       ↓
Phase 6 (Badges)       →  Phase 7 (Learning Paths)
       ↓
Phase 8 (Question Types)  →  Phase 9 (Leaderboard)  →  Phase 10 (Public Profile)
```

Phases 1–3 form the MVP loop. Phases 4–7 complete the retention and engagement layer. Phases 8–10 are depth and social features.

---

## API Surface (full target state)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/users/` | Create anonymous user |
| `GET` | `/api/users/<id>` | Full user profile with level, daily goal, shields |
| `GET` | `/api/users/<id>/badges` | Earned badges |
| `GET` | `/api/users/<id>/public` | Public read-only profile |
| `PATCH` | `/api/users/<id>/settings` | Update daily_goal_xp, leaderboard_opt_in |
| `GET` | `/api/topics/?user_id=<id>` | Topics with mastery levels |
| `GET` | `/api/lessons/?topic_id=<id>&user_id=<id>` | Lessons for a topic |
| `GET` | `/api/lessons/<id>` | Lesson detail + exercises (no correct answers) |
| `POST` | `/api/lessons/<id>/check` | Check single answer → correct + explanation |
| `POST` | `/api/lessons/<id>/complete` | Submit completed lesson → score, xp, streak, new_badges |
| `GET` | `/api/journey/?user_id=<id>` | Journey chapters with lesson completion |
| `GET` | `/api/paths/?user_id=<id>` | All learning paths with enrollment status |
| `GET` | `/api/paths/<id>?user_id=<id>` | Path detail with lesson progress |
| `POST` | `/api/paths/<id>/enroll` | Enroll user in path |
| `POST` | `/api/paths/<id>/unenroll` | Unenroll user from path |
| `GET` | `/api/leaderboard/?user_id=<id>` | Weekly leaderboard for user's league |

---

## Target Data Model (full)

```
User
  id, xp, streak, last_active_date
  daily_goal_xp, daily_xp_today, daily_xp_date
  streak_shields, shield_granted_week
  league_tier, leaderboard_opt_in

UserProgress
  user_id, lesson_id, score, total, xp_earned
  (unique per user+lesson; best score retained on retry)

UserAnswer
  user_id, lesson_id, exercise_id, answer, correct, created_at

UserBadge
  user_id, badge_id, earned_at

UserPath
  user_id, path_id, enrolled_at, completed_at

UserWeeklyXP
  user_id, iso_week, weekly_xp, league_tier
```

---

## Design System (unchanged)

Dark theme. CSS custom properties in `frontend/src/index.css`:
- `--primary: #ff3621` (Databricks red)
- `--success: #00c55a`, `--bg: #0d0e10`, `--surface: #16181d`, `--surface-2: #1e2128`
- `--font-display: 'Syne'`, `--font-mono: 'JetBrains Mono'`
- Per-topic accent glows: spark=amber, delta=blue, mlflow=violet, unity=green
