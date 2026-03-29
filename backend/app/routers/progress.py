from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import Category, DailySet, Lesson, User, UserProgress

router = APIRouter(prefix="/progress", tags=["progress"])

MASTERY_THRESHOLD = 80.0


class CategoryProgress(BaseModel):
    category_id: str
    category_name: str
    icon: Optional[str]
    color: Optional[str]
    total_quizzes: int
    correct_answers: int
    completion_pct: float
    is_mastered: bool


class LessonProgressOut(BaseModel):
    lesson_id: str
    lesson_title: str
    category_id: str
    total_quizzes: int
    correct_answers: int
    completion_pct: float


class DayActivity(BaseModel):
    date: str
    completed: bool


class ProgressOut(BaseModel):
    xp: int
    streak: int
    longest_streak: int
    last_active_date: Optional[str]
    streak_freezes: int
    categories: list[CategoryProgress]
    weak_areas: list[CategoryProgress]
    weekly_activity: list[DayActivity]
    lessons: list[LessonProgressOut]


@router.get("", response_model=ProgressOut)
def get_progress(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    cats = session.exec(select(Category).order_by(Category.order)).all()
    category_progress: list[CategoryProgress] = []
    all_lesson_progress: list[LessonProgressOut] = []

    for cat in cats:
        lessons = session.exec(select(Lesson).where(Lesson.category_id == cat.id)).all()
        lesson_ids = [l.id for l in lessons]
        if not lesson_ids:
            continue

        progresses = session.exec(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id,
                UserProgress.lesson_id.in_(lesson_ids),
            )
        ).all()
        prog_map = {p.lesson_id: p for p in progresses}

        total_q = sum(p.total_quizzes for p in progresses)
        correct = sum(p.correct_answers for p in progresses)
        pct = round(correct / total_q * 100, 1) if total_q else 0.0
        is_mastered = pct >= MASTERY_THRESHOLD and total_q > 0

        category_progress.append(
            CategoryProgress(
                category_id=cat.id,
                category_name=cat.name,
                icon=cat.icon,
                color=cat.color,
                total_quizzes=total_q,
                correct_answers=correct,
                completion_pct=pct,
                is_mastered=is_mastered,
            )
        )

        # Per-lesson progress
        for lesson in lessons:
            prog = prog_map.get(lesson.id)
            lq = prog.total_quizzes if prog else 0
            lc = prog.correct_answers if prog else 0
            lpct = round(lc / lq * 100, 1) if lq else 0.0
            all_lesson_progress.append(
                LessonProgressOut(
                    lesson_id=lesson.id,
                    lesson_title=lesson.title,
                    category_id=cat.id,
                    total_quizzes=lq,
                    correct_answers=lc,
                    completion_pct=lpct,
                )
            )

    # Weak areas: categories with attempts, sorted by accuracy asc (exclude perfect / no attempts)
    attempted = [c for c in category_progress if c.total_quizzes > 0]
    weak_areas = sorted(attempted, key=lambda c: c.completion_pct)[:3]

    # Last 7-day activity
    today = date.today()
    weekly: list[DayActivity] = []
    for delta in range(6, -1, -1):
        d = (today - timedelta(days=delta)).isoformat()
        completed_set = session.exec(
            select(DailySet).where(
                DailySet.user_id == current_user.id,
                DailySet.date == d,
                DailySet.is_completed == True,  # noqa: E712
            )
        ).first()
        weekly.append(DayActivity(date=d, completed=completed_set is not None))

    return ProgressOut(
        xp=current_user.xp,
        streak=current_user.streak,
        longest_streak=current_user.longest_streak,
        last_active_date=current_user.last_active_date,
        streak_freezes=current_user.streak_freezes,
        categories=category_progress,
        weak_areas=weak_areas,
        weekly_activity=weekly,
        lessons=all_lesson_progress,
    )
