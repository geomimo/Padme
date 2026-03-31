"""Onboarding placement quiz — one question per category for new users."""
import random
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import Category, Lesson, Quiz, QuizOption, User

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class OptionPublic(BaseModel):
    id: str
    text: str
    order: int


class OnboardingQuiz(BaseModel):
    id: str
    type: str
    question: str
    xp_reward: int
    difficulty: str
    category_name: str
    category_icon: Optional[str]
    options: list[OptionPublic]


@router.get("/quiz", response_model=list[OnboardingQuiz])
def get_onboarding_quiz(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Return one random quiz per category (up to 8) for the placement quiz."""
    categories = session.exec(select(Category).order_by(Category.order)).all()

    result: list[OnboardingQuiz] = []
    for cat in categories:
        lesson_ids = session.exec(
            select(Lesson.id).where(
                Lesson.category_id == cat.id,
                Lesson.is_published == True,  # noqa: E712
            )
        ).all()
        if not lesson_ids:
            continue

        quizzes = session.exec(
            select(Quiz).where(Quiz.lesson_id.in_(lesson_ids))
        ).all()
        if not quizzes:
            continue

        quiz = random.choice(quizzes)
        opts = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id).order_by(QuizOption.order)
        ).all()
        result.append(
            OnboardingQuiz(
                id=quiz.id,
                type=quiz.type,
                question=quiz.question,
                xp_reward=quiz.xp_reward,
                difficulty=quiz.difficulty,
                category_name=cat.name,
                category_icon=cat.icon,
                options=[OptionPublic(id=o.id, text=o.text, order=o.order) for o in opts],
            )
        )

    return result


@router.post("/complete", status_code=204)
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Mark the user's onboarding as complete."""
    current_user.onboarding_complete = True
    session.add(current_user)
    session.commit()
