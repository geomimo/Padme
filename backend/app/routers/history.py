"""Answer history — past daily set sessions."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import DailySet, DailySetItem, User, UserAnswer

router = APIRouter(prefix="/history", tags=["history"])


class SessionHistoryItem(BaseModel):
    id: str
    date: str
    xp_earned: int
    correct_count: int
    total_count: int
    perfect: bool
    completed_at: Optional[datetime]


@router.get("", response_model=list[SessionHistoryItem])
def get_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Return the last 30 completed daily sets for the current user."""
    daily_sets = session.exec(
        select(DailySet)
        .where(
            DailySet.user_id == current_user.id,
            DailySet.is_completed == True,  # noqa: E712
        )
        .order_by(DailySet.date.desc())
        .limit(30)
    ).all()

    result = []
    for ds in daily_sets:
        items = session.exec(
            select(DailySetItem).where(DailySetItem.daily_set_id == ds.id)
        ).all()
        total = len(items)

        answers = session.exec(
            select(UserAnswer).where(
                UserAnswer.user_id == current_user.id,
                UserAnswer.daily_set_id == ds.id,
            )
        ).all()
        correct = sum(1 for a in answers if a.is_correct)

        result.append(
            SessionHistoryItem(
                id=ds.id,
                date=ds.date,
                xp_earned=ds.xp_earned,
                correct_count=correct,
                total_count=total,
                perfect=correct == total and total > 0,
                completed_at=ds.completed_at,
            )
        )
    return result
