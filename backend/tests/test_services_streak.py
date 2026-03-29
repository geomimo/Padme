"""Unit tests for the streak service."""
from datetime import date, timedelta

import pytest
from app.models import User
from app.services.streak import update_streak


def make_user(session, last_active: str | None = None, streak: int = 0, longest: int = 0) -> User:
    from app.auth import hash_password
    import uuid
    user = User(
        id=str(uuid.uuid4()),
        email=f"streak-{uuid.uuid4()}@test.com",
        hashed_password=hash_password("x"),
        streak=streak,
        longest_streak=longest,
        last_active_date=last_active,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


class TestUpdateStreak:
    def test_first_ever_completion_sets_streak_to_1(self, session):
        user = make_user(session, last_active=None, streak=0)
        update_streak(user, session)
        assert user.streak == 1

    def test_first_completion_sets_last_active_to_today(self, session):
        user = make_user(session, last_active=None)
        update_streak(user, session)
        assert user.last_active_date == date.today().isoformat()

    def test_consecutive_day_increments_streak(self, session):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        user = make_user(session, last_active=yesterday, streak=5)
        update_streak(user, session)
        assert user.streak == 6

    def test_missed_day_resets_streak_to_1(self, session):
        two_days_ago = (date.today() - timedelta(days=2)).isoformat()
        user = make_user(session, last_active=two_days_ago, streak=10)
        update_streak(user, session)
        assert user.streak == 1

    def test_already_completed_today_is_idempotent(self, session):
        today = date.today().isoformat()
        user = make_user(session, last_active=today, streak=5)
        update_streak(user, session)
        assert user.streak == 5  # unchanged

    def test_longest_streak_updated_when_exceeded(self, session):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        user = make_user(session, last_active=yesterday, streak=9, longest=9)
        update_streak(user, session)
        assert user.longest_streak == 10

    def test_longest_streak_not_lowered(self, session):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        user = make_user(session, last_active=yesterday, streak=5, longest=20)
        update_streak(user, session)
        assert user.longest_streak == 20  # still 20, not overwritten

    def test_missed_week_resets_to_1(self, session):
        week_ago = (date.today() - timedelta(days=7)).isoformat()
        user = make_user(session, last_active=week_ago, streak=50)
        update_streak(user, session)
        assert user.streak == 1

    def test_streak_persisted_to_db(self, session):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        user = make_user(session, last_active=yesterday, streak=3)
        update_streak(user, session)
        session.refresh(user)
        assert user.streak == 4
