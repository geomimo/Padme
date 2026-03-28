"""Learning paths (curated ordered lesson sequences)."""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import Lesson, LearningPath, LearningPathItem, User, UserProgress

router = APIRouter(prefix="/paths", tags=["paths"])

MASTERY_THRESHOLD = 80.0  # % accuracy to consider a lesson "mastered"


class PathLessonOut(BaseModel):
    item_id: str
    lesson_id: str
    title: str
    description: Optional[str]
    order: int
    total_quizzes: int
    correct_answers: int
    completion_pct: float
    is_mastered: bool


class LearningPathOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    order: int
    lessons: list[PathLessonOut]
    total_lessons: int
    mastered_lessons: int


@router.get("", response_model=list[LearningPathOut])
def list_paths(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    paths = session.exec(
        select(LearningPath)
        .where(LearningPath.is_published == True)  # noqa: E712
        .order_by(LearningPath.order)
    ).all()

    result = []
    for path in paths:
        items = session.exec(
            select(LearningPathItem)
            .where(LearningPathItem.path_id == path.id)
            .order_by(LearningPathItem.order)
        ).all()

        lessons_out: list[PathLessonOut] = []
        mastered = 0
        for item in items:
            lesson = session.get(Lesson, item.lesson_id)
            if not lesson:
                continue
            prog = session.exec(
                select(UserProgress).where(
                    UserProgress.user_id == current_user.id,
                    UserProgress.lesson_id == lesson.id,
                )
            ).first()
            total_q = prog.total_quizzes if prog else 0
            correct = prog.correct_answers if prog else 0
            pct = round(correct / total_q * 100, 1) if total_q else 0.0
            is_mastered = pct >= MASTERY_THRESHOLD and total_q > 0
            if is_mastered:
                mastered += 1
            lessons_out.append(
                PathLessonOut(
                    item_id=item.id,
                    lesson_id=lesson.id,
                    title=lesson.title,
                    description=lesson.description,
                    order=item.order,
                    total_quizzes=total_q,
                    correct_answers=correct,
                    completion_pct=pct,
                    is_mastered=is_mastered,
                )
            )

        result.append(
            LearningPathOut(
                id=path.id,
                title=path.title,
                description=path.description,
                icon=path.icon,
                color=path.color,
                order=path.order,
                lessons=lessons_out,
                total_lessons=len(lessons_out),
                mastered_lessons=mastered,
            )
        )
    return result
