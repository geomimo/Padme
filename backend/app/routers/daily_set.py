from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import (
    DailySet,
    DailySetItem,
    Quiz,
    QuizOption,
    User,
    UserAnswer,
    UserProgress,
)
from ..services.daily_set import get_or_create_daily_set
from ..services.streak import update_streak
from ..services.xp import xp_for_answer, xp_for_set

router = APIRouter(prefix="/daily-set", tags=["daily-set"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OptionPublic(BaseModel):
    id: str
    text: str
    order: int


class QuizPublic(BaseModel):
    id: str
    type: str
    question: str
    xp_reward: int
    order: int
    options: list[OptionPublic]


class DailySetOut(BaseModel):
    id: str
    date: str
    is_completed: bool
    xp_earned: int
    quizzes: list[QuizPublic]


class AnswerRequest(BaseModel):
    quiz_id: str
    answer: str   # option id (MC) or "true"/"false" (T/F)


class AnswerResponse(BaseModel):
    is_correct: bool
    explanation: Optional[str]
    xp_earned: int
    correct_option_id: Optional[str] = None  # for MC: reveal correct answer after submission


class CompleteResponse(BaseModel):
    xp_earned: int
    new_total_xp: int
    streak: int
    longest_streak: int
    perfect_set: bool
    correct_count: int
    total_count: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_quizzes(daily_set_id: str, session: Session) -> list[QuizPublic]:
    items = session.exec(
        select(DailySetItem)
        .where(DailySetItem.daily_set_id == daily_set_id)
        .order_by(DailySetItem.order)
    ).all()

    quizzes: list[QuizPublic] = []
    for item in items:
        quiz = session.get(Quiz, item.quiz_id)
        if not quiz:
            continue
        opts = session.exec(
            select(QuizOption)
            .where(QuizOption.quiz_id == quiz.id)
            .order_by(QuizOption.order)
        ).all()
        # Strip is_correct from options
        quizzes.append(
            QuizPublic(
                **quiz.model_dump(exclude={"explanation", "lesson_id", "created_at"}),
                options=[OptionPublic(id=o.id, text=o.text, order=o.order) for o in opts],
            )
        )
    return quizzes


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=DailySetOut)
def get_today(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    daily_set = get_or_create_daily_set(current_user.id, session)
    return DailySetOut(
        id=daily_set.id,
        date=daily_set.date,
        is_completed=daily_set.is_completed,
        xp_earned=daily_set.xp_earned,
        quizzes=_load_quizzes(daily_set.id, session),
    )


@router.post("/{daily_set_id}/answer", response_model=AnswerResponse)
def submit_answer(
    daily_set_id: str,
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    daily_set = session.get(DailySet, daily_set_id)
    if not daily_set or daily_set.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Daily set not found")
    if daily_set.is_completed:
        raise HTTPException(status_code=400, detail="Daily set already completed")

    # Verify quiz belongs to this daily set
    item = session.exec(
        select(DailySetItem).where(
            DailySetItem.daily_set_id == daily_set_id,
            DailySetItem.quiz_id == body.quiz_id,
        )
    ).first()
    if not item:
        raise HTTPException(status_code=400, detail="Quiz not in this daily set")

    quiz = session.get(Quiz, body.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Determine correctness server-side
    is_correct = False
    correct_option_id: Optional[str] = None

    if quiz.type == "TRUE_FALSE":
        correct_opt = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id, QuizOption.is_correct == True)  # noqa: E712
        ).first()
        if correct_opt:
            correct_option_id = correct_opt.id
            is_correct = body.answer.lower() == correct_opt.text.lower()
    else:  # MULTIPLE_CHOICE
        chosen_opt = session.get(QuizOption, body.answer)
        if chosen_opt and chosen_opt.quiz_id == quiz.id:
            is_correct = chosen_opt.is_correct
        correct_opt = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id, QuizOption.is_correct == True)  # noqa: E712
        ).first()
        if correct_opt:
            correct_option_id = correct_opt.id

    xp = xp_for_answer(quiz.xp_reward, current_user.streak) if is_correct else 0

    # Persist answer (allow overwrite if already answered)
    existing = session.exec(
        select(UserAnswer).where(
            UserAnswer.user_id == current_user.id,
            UserAnswer.quiz_id == quiz.id,
            UserAnswer.daily_set_id == daily_set_id,
        )
    ).first()
    if existing:
        existing.answer = body.answer
        existing.is_correct = is_correct
        existing.xp_earned = xp
        existing.answered_at = datetime.utcnow()
        session.add(existing)
    else:
        session.add(
            UserAnswer(
                user_id=current_user.id,
                quiz_id=quiz.id,
                daily_set_id=daily_set_id,
                answer=body.answer,
                is_correct=is_correct,
                xp_earned=xp,
            )
        )
    session.commit()

    return AnswerResponse(
        is_correct=is_correct,
        explanation=quiz.explanation,
        xp_earned=xp,
        correct_option_id=correct_option_id,
    )


@router.post("/{daily_set_id}/complete", response_model=CompleteResponse)
def complete_set(
    daily_set_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    daily_set = session.get(DailySet, daily_set_id)
    if not daily_set or daily_set.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Daily set not found")

    # Idempotency: already completed
    if daily_set.is_completed:
        return CompleteResponse(
            xp_earned=daily_set.xp_earned,
            new_total_xp=current_user.xp,
            streak=current_user.streak,
            longest_streak=current_user.longest_streak,
            perfect_set=False,
            correct_count=0,
            total_count=0,
        )

    # Count correct answers for this set
    items = session.exec(
        select(DailySetItem).where(DailySetItem.daily_set_id == daily_set_id)
    ).all()
    total_count = len(items)

    answers = session.exec(
        select(UserAnswer).where(
            UserAnswer.user_id == current_user.id,
            UserAnswer.daily_set_id == daily_set_id,
        )
    ).all()
    correct_count = sum(1 for a in answers if a.is_correct)

    # Update streak first (affects XP bonus)
    update_streak(current_user, session)
    session.refresh(current_user)

    xp = xp_for_set(correct_count, total_count, current_user.streak)
    perfect = correct_count == total_count and total_count > 0

    # Mark set complete
    daily_set.is_completed = True
    daily_set.xp_earned = xp
    daily_set.completed_at = datetime.utcnow()
    session.add(daily_set)

    # Award XP
    current_user.xp += xp
    session.add(current_user)

    # Update UserProgress per lesson
    for item in items:
        quiz = session.get(Quiz, item.quiz_id)
        if not quiz:
            continue
        answer = next((a for a in answers if a.quiz_id == item.quiz_id), None)
        progress = session.exec(
            select(UserProgress).where(
                UserProgress.user_id == current_user.id,
                UserProgress.lesson_id == quiz.lesson_id,
            )
        ).first()
        if not progress:
            progress = UserProgress(user_id=current_user.id, lesson_id=quiz.lesson_id)
        progress.total_quizzes += 1
        if answer and answer.is_correct:
            progress.correct_answers += 1
        session.add(progress)

    session.commit()
    session.refresh(current_user)

    return CompleteResponse(
        xp_earned=xp,
        new_total_xp=current_user.xp,
        streak=current_user.streak,
        longest_streak=current_user.longest_streak,
        perfect_set=perfect,
        correct_count=correct_count,
        total_count=total_count,
    )
