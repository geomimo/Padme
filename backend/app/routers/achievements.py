"""Achievements listing endpoint."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import User, UserAchievement
from ..services.achievements import ACHIEVEMENT_DEFINITIONS, ensure_achievements_exist

router = APIRouter(prefix="/achievements", tags=["achievements"])


class AchievementOut(BaseModel):
    id: str
    key: str
    name: str
    description: str
    icon: str
    earned: bool
    earned_at: Optional[datetime] = None


@router.get("", response_model=list[AchievementOut])
def list_achievements(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Return all achievements with the user's earned status."""
    achievements = ensure_achievements_exist(session)

    earned_map = {
        ua.achievement_id: ua.earned_at
        for ua in session.exec(
            select(UserAchievement).where(UserAchievement.user_id == current_user.id)
        ).all()
    }

    # Return in definition order
    result = []
    for ach_data in ACHIEVEMENT_DEFINITIONS:
        ach = achievements.get(ach_data["key"])
        if not ach:
            continue
        result.append(
            AchievementOut(
                id=ach.id,
                key=ach.key,
                name=ach.name,
                description=ach.description,
                icon=ach.icon,
                earned=ach.id in earned_map,
                earned_at=earned_map.get(ach.id),
            )
        )
    return result
