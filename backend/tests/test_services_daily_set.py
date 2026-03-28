"""Unit tests for the daily set generation service."""
from datetime import date, timedelta

import pytest
from sqlmodel import Session, select

from app.auth import hash_password
from app.models import (
    Category,
    DailySet,
    DailySetItem,
    Lesson,
    Quiz,
    QuizOption,
    User,
    UserAnswer,
)
from app.services.daily_set import DAILY_SET_SIZE, get_or_create_daily_set


def _make_user(session) -> User:
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        email=f"ds-{uuid.uuid4()}@test.com",
        hashed_password=hash_password("x"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _make_quiz_bank(session, count: int) -> tuple[User, list[Quiz]]:
    """Create a published lesson with `count` MC quizzes and return (user, quizzes)."""
    cat = Category(name=f"Cat-{count}", description="")
    session.add(cat)
    session.flush()

    lesson = Lesson(title=f"Lesson-{count}", category_id=cat.id, is_published=True)
    session.add(lesson)
    session.flush()

    quizzes = []
    for i in range(count):
        quiz = Quiz(
            lesson_id=lesson.id,
            type="MULTIPLE_CHOICE",
            question=f"Question {i}?",
            xp_reward=10,
            order=i,
        )
        session.add(quiz)
        session.flush()
        # Add a correct option so answer validation works
        opt = QuizOption(quiz_id=quiz.id, text="Correct", is_correct=True, order=0)
        session.add(opt)
        quizzes.append(quiz)

    session.commit()
    for q in quizzes:
        session.refresh(q)

    user = _make_user(session)
    return user, quizzes


class TestGetOrCreateDailySet:
    def test_creates_new_set_for_today(self, session):
        user, _ = _make_quiz_bank(session, 10)
        daily_set = get_or_create_daily_set(user.id, session)
        assert daily_set is not None
        assert daily_set.user_id == user.id
        assert daily_set.date == date.today().isoformat()

    def test_returns_existing_set_on_second_call(self, session):
        user, _ = _make_quiz_bank(session, 10)
        first = get_or_create_daily_set(user.id, session)
        second = get_or_create_daily_set(user.id, session)
        assert first.id == second.id

    def test_set_has_correct_number_of_items(self, session):
        user, _ = _make_quiz_bank(session, 10)
        daily_set = get_or_create_daily_set(user.id, session)
        items = session.exec(
            select(DailySetItem).where(DailySetItem.daily_set_id == daily_set.id)
        ).all()
        assert len(items) == DAILY_SET_SIZE

    def test_empty_set_when_no_published_lessons(self, session):
        user = _make_user(session)
        daily_set = get_or_create_daily_set(user.id, session)
        items = session.exec(
            select(DailySetItem).where(DailySetItem.daily_set_id == daily_set.id)
        ).all()
        assert len(items) == 0

    def test_set_smaller_than_daily_size_when_few_quizzes(self, session):
        """With only 3 quizzes, the set uses all 3."""
        user, quizzes = _make_quiz_bank(session, 3)
        daily_set = get_or_create_daily_set(user.id, session)
        items = session.exec(
            select(DailySetItem).where(DailySetItem.daily_set_id == daily_set.id)
        ).all()
        assert len(items) == 3

    def test_avoids_recently_correct_quizzes(self, session):
        """Questions answered correctly in the last 7 days are not included when enough fresh exist."""
        user, quizzes = _make_quiz_bank(session, 10)

        # Mark first 5 quizzes as recently correctly answered
        from datetime import datetime
        recently = datetime.utcnow()
        for q in quizzes[:5]:
            ua = UserAnswer(
                user_id=user.id,
                quiz_id=q.id,
                answer="Correct",
                is_correct=True,
                answered_at=recently,
            )
            session.add(ua)
        session.commit()

        daily_set = get_or_create_daily_set(user.id, session)
        items = session.exec(
            select(DailySetItem).where(DailySetItem.daily_set_id == daily_set.id)
        ).all()

        recent_ids = {q.id for q in quizzes[:5]}
        item_quiz_ids = {i.quiz_id for i in items}
        # Should not include any recently correct quizzes (5 fresh remain)
        assert item_quiz_ids.isdisjoint(recent_ids)

    def test_falls_back_to_all_quizzes_when_insufficient_fresh(self, session):
        """Falls back to full pool when fewer than 5 fresh questions exist."""
        user, quizzes = _make_quiz_bank(session, 5)

        # Mark all 5 as recently correct
        from datetime import datetime
        for q in quizzes:
            ua = UserAnswer(
                user_id=user.id,
                quiz_id=q.id,
                answer="Correct",
                is_correct=True,
                answered_at=datetime.utcnow(),
            )
            session.add(ua)
        session.commit()

        daily_set = get_or_create_daily_set(user.id, session)
        items = session.exec(
            select(DailySetItem).where(DailySetItem.daily_set_id == daily_set.id)
        ).all()
        # Falls back to all 5 quizzes
        assert len(items) == 5

    def test_set_is_not_completed_initially(self, session):
        user, _ = _make_quiz_bank(session, 10)
        daily_set = get_or_create_daily_set(user.id, session)
        assert daily_set.is_completed is False

    def test_items_have_sequential_order(self, session):
        user, _ = _make_quiz_bank(session, 10)
        daily_set = get_or_create_daily_set(user.id, session)
        items = session.exec(
            select(DailySetItem)
            .where(DailySetItem.daily_set_id == daily_set.id)
            .order_by(DailySetItem.order)
        ).all()
        orders = [i.order for i in items]
        assert orders == list(range(len(orders)))
