import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .admin import create_admin
from .database import create_db_and_tables
from .routers import auth, categories, daily_set, lessons, progress, quizzes, test_plans, users

load_dotenv()

app = FastAPI(
    title="Padme — Databricks Learning API",
    version="1.0.0",
    description="Duolingo-style quiz platform for learning Databricks.",
)

# Session middleware required by SQLAdmin
app.add_middleware(SessionMiddleware, secret_key=os.getenv("ADMIN_SECRET", "change-me"))

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(lessons.router)
app.include_router(quizzes.router)
app.include_router(daily_set.router)
app.include_router(progress.router)
app.include_router(test_plans.router)
app.include_router(test_plans.sessions_router)

# SQLAdmin panel
create_admin(app)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health")
def health():
    return {"status": "ok"}
