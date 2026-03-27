# Padme — Learn Databricks

A Duolingo-style web application for learning Databricks through daily quizzes, XP, and streaks.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + SQLModel + SQLite |
| Admin panel | SQLAdmin (auto-generated CRUD) |
| Auth | Custom JWT (bcrypt + python-jose) |
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion + canvas-confetti |

## Getting Started

### Docker (recommended)

```bash
docker compose up --build
```

The backend seeds the database automatically on first run.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| Admin panel | http://localhost:8000/admin |

To override the API URL (e.g. for a remote deployment):
```bash
NEXT_PUBLIC_API_URL=https://api.example.com docker compose up --build
```

### Manual (development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python seed.py         # creates DB + inserts 8 categories, 20 lessons, 60 quizzes
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Seed Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@padme.dev | admin123 |
| User | user@padme.dev | user123 |

## Features

- **Daily sets**: 5 quiz questions per day (Multiple Choice & True/False)
- **XP system**: 10 XP per correct answer + streak bonuses (up to +50%)
- **Streaks**: Maintain a streak by completing your daily set every day
- **Perfect set bonus**: +20 XP for 5/5 correct
- **Admin panel**: Full CRUD for categories, lessons, quizzes, and users at `/admin`
- **8 Databricks topics**: Delta Lake, Apache Spark, MLflow, Databricks SQL, Unity Catalog, Workflows, AutoML, Runtime

## Environment Variables

**`backend/.env`**
```
DATABASE_URL=sqlite:///./padme.db
SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ADMIN_SECRET=<your-admin-panel-secret>
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
