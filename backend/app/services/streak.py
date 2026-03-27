from datetime import date, timedelta

from sqlmodel import Session

from ..models import User


def update_streak(user: User, session: Session) -> None:
    """Update user streak based on today's completion. Idempotent."""
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    if user.last_active_date == today:
        # Already completed today — nothing to do
        return

    if user.last_active_date == yesterday:
        user.streak += 1
    else:
        # Missed one or more days (or first ever completion)
        user.streak = 1

    user.last_active_date = today
    if user.streak > user.longest_streak:
        user.longest_streak = user.streak

    session.add(user)
    session.commit()
    session.refresh(user)
