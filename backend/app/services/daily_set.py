import random
from datetime import date, datetime, timedelta
from typing import Optional

from sqlmodel import Session, select

from ..models import (
    DailySet,
    DailySetItem,
    Lesson,
    Quiz,
    UserAnswer,
)

DAILY_SET_SIZE = 5


def get_or_create_daily_set(user_id: str, session: Session) -> DailySet:
    today = date.today().isoformat()

    existing = session.exec(
        select(DailySet).where(DailySet.user_id == user_id, DailySet.date == today)
    ).first()
    if existing:
        return existing

    # Fetch all quizzes from published lessons
    published_lesson_ids = session.exec(
        select(Lesson.id).where(Lesson.is_published == True)  # noqa: E712
    ).all()

    if not published_lesson_ids:
        # No content yet — return an empty set
        daily_set = DailySet(user_id=user_id, date=today)
        session.add(daily_set)
        session.commit()
        session.refresh(daily_set)
        return daily_set

    all_quizzes = session.exec(
        select(Quiz).where(Quiz.lesson_id.in_(published_lesson_ids))
    ).all()

    if not all_quizzes:
        daily_set = DailySet(user_id=user_id, date=today)
        session.add(daily_set)
        session.commit()
        session.refresh(daily_set)
        return daily_set

    # Exclude quizzes correctly answered in the last 7 days
    cutoff = (date.today() - timedelta(days=7)).isoformat()
    recent_correct_ids: set[str] = set(
        session.exec(
            select(UserAnswer.quiz_id).where(
                UserAnswer.user_id == user_id,
                UserAnswer.is_correct == True,  # noqa: E712
                UserAnswer.answered_at >= datetime.fromisoformat(cutoff),
            )
        ).all()
    )

    fresh = [q for q in all_quizzes if q.id not in recent_correct_ids]
    pool = fresh if len(fresh) >= DAILY_SET_SIZE else all_quizzes

    selected = random.sample(pool, min(DAILY_SET_SIZE, len(pool)))

    # Pad with random quizzes if pool is smaller than DAILY_SET_SIZE
    if len(selected) < DAILY_SET_SIZE and len(all_quizzes) > len(selected):
        extras = [q for q in all_quizzes if q not in selected]
        selected += random.sample(extras, min(DAILY_SET_SIZE - len(selected), len(extras)))

    daily_set = DailySet(user_id=user_id, date=today)
    session.add(daily_set)
    session.flush()  # get the id before adding items

    for idx, quiz in enumerate(selected):
        item = DailySetItem(daily_set_id=daily_set.id, quiz_id=quiz.id, order=idx)
        session.add(item)

    session.commit()
    session.refresh(daily_set)
    return daily_set
