"""Daily set creation with SRS-based quiz selection."""
import random
from datetime import date, datetime, timedelta

from sqlmodel import Session, select

from ..models import (
    DailySet,
    DailySetItem,
    Lesson,
    Quiz,
    QuizSRSState,
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

    # Exclude quizzes answered correctly in the last 7 days when enough fresh ones exist
    cutoff = datetime.utcnow() - timedelta(days=7)
    recently_correct_ids = set(session.exec(
        select(UserAnswer.quiz_id).where(
            UserAnswer.user_id == user_id,
            UserAnswer.is_correct == True,  # noqa: E712
            UserAnswer.answered_at >= cutoff,
        )
    ).all())

    fresh_quizzes = [q for q in all_quizzes if q.id not in recently_correct_ids]
    pool = fresh_quizzes if len(fresh_quizzes) >= DAILY_SET_SIZE else all_quizzes

    # SRS-based selection: due > new > not yet due
    srs_states = {
        s.quiz_id: s
        for s in session.exec(
            select(QuizSRSState).where(QuizSRSState.user_id == user_id)
        ).all()
    }

    due: list[Quiz] = []
    new_quizzes: list[Quiz] = []
    not_due: list[Quiz] = []

    for q in pool:
        state = srs_states.get(q.id)
        if state is None:
            new_quizzes.append(q)
        elif state.next_review <= today:
            due.append(q)
        else:
            not_due.append(q)

    random.shuffle(due)
    random.shuffle(new_quizzes)
    random.shuffle(not_due)

    # Priority order: overdue → new (never seen) → not yet due
    prioritized = due + new_quizzes + not_due
    selected = prioritized[:DAILY_SET_SIZE]

    # Pad if pool is smaller than target
    if len(selected) < DAILY_SET_SIZE and len(pool) > len(selected):
        extras = [q for q in pool if q not in selected]
        selected += random.sample(extras, min(DAILY_SET_SIZE - len(selected), len(extras)))

    daily_set = DailySet(user_id=user_id, date=today)
    session.add(daily_set)
    session.flush()

    for idx, quiz in enumerate(selected):
        item = DailySetItem(daily_set_id=daily_set.id, quiz_id=quiz.id, order=idx)
        session.add(item)

    session.commit()
    session.refresh(daily_set)
    return daily_set
