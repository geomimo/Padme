"""Weekly / all-time XP leaderboard."""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import User

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    xp: int
    streak: int
    is_current_user: bool


@router.get("", response_model=list[LeaderboardEntry])
def get_leaderboard(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Return the top-20 users ordered by XP (all-time)."""
    users = session.exec(
        select(User)
        .where(User.is_active == True)  # noqa: E712
        .order_by(User.xp.desc())
        .limit(20)
    ).all()

    result = []
    for rank, user in enumerate(users, start=1):
        result.append(
            LeaderboardEntry(
                rank=rank,
                user_id=user.id,
                name=user.name or user.email.split("@")[0],
                xp=user.xp,
                streak=user.streak,
                is_current_user=user.id == current_user.id,
            )
        )
    return result
