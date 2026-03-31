"""Mistake review sessions."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import (
    Quiz,
    QuizOption,
    ReviewSession,
    ReviewSessionItem,
    User,
    UserAnswer,
)
from ..services.srs import update_srs_state

router = APIRouter(prefix="/review", tags=["review"])

REVIEW_SESSION_SIZE = 10


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OptionPublic(BaseModel):
    id: str
    text: str
    order: int


class ReviewQuizPublic(BaseModel):
    id: str
    type: str
    question: str
    explanation: Optional[str] = None
    xp_reward: int
    difficulty: str
    order: int
    options: list[OptionPublic]


class ReviewSessionOut(BaseModel):
    id: str
    is_completed: bool
    quizzes: list[ReviewQuizPublic]


class ReviewAnswerRequest(BaseModel):
    quiz_id: str
    answer: str   # option id (MC) or "true"/"false" (T/F)


class ReviewAnswerResponse(BaseModel):
    is_correct: bool
    explanation: Optional[str]
    detail: Optional[str]
    correct_option_id: Optional[str] = None


class ReviewCompleteResponse(BaseModel):
    correct_count: int
    total_count: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_review_quizzes(session_id: str, session: Session) -> list[ReviewQuizPublic]:
    items = session.exec(
        select(ReviewSessionItem)
        .where(ReviewSessionItem.session_id == session_id)
        .order_by(ReviewSessionItem.order)
    ).all()
    quizzes = []
    for item in items:
        quiz = session.get(Quiz, item.quiz_id)
        if not quiz:
            continue
        opts = session.exec(
            select(QuizOption)
            .where(QuizOption.quiz_id == quiz.id)
            .order_by(QuizOption.order)
        ).all()
        quizzes.append(
            ReviewQuizPublic(
                id=quiz.id,
                type=quiz.type,
                question=quiz.question,
                explanation=quiz.explanation,
                xp_reward=quiz.xp_reward,
                difficulty=quiz.difficulty,
                order=item.order,
                options=[OptionPublic(id=o.id, text=o.text, order=o.order) for o in opts],
            )
        )
    return quizzes


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/start", response_model=ReviewSessionOut)
def start_review(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new review session with up to 10 recently-missed quizzes."""
    # Collect unique quiz_ids the user has answered incorrectly (most recent first)
    incorrect_answers = session.exec(
        select(UserAnswer)
        .where(
            UserAnswer.user_id == current_user.id,
            UserAnswer.is_correct == False,  # noqa: E712
        )
        .order_by(UserAnswer.answered_at.desc())
    ).all()

    seen: set[str] = set()
    quiz_ids: list[str] = []
    for ans in incorrect_answers:
        if ans.quiz_id not in seen:
            seen.add(ans.quiz_id)
            quiz_ids.append(ans.quiz_id)
        if len(quiz_ids) >= REVIEW_SESSION_SIZE:
            break

    if not quiz_ids:
        raise HTTPException(status_code=404, detail="No mistakes to review yet — keep practicing!")

    review = ReviewSession(user_id=current_user.id)
    session.add(review)
    session.flush()

    for idx, quiz_id in enumerate(quiz_ids):
        item = ReviewSessionItem(session_id=review.id, quiz_id=quiz_id, order=idx)
        session.add(item)

    session.commit()
    session.refresh(review)

    return ReviewSessionOut(
        id=review.id,
        is_completed=review.is_completed,
        quizzes=_load_review_quizzes(review.id, session),
    )


@router.get("/{session_id}", response_model=ReviewSessionOut)
def get_review(
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    review = session.get(ReviewSession, session_id)
    if not review or review.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review session not found")
    return ReviewSessionOut(
        id=review.id,
        is_completed=review.is_completed,
        quizzes=_load_review_quizzes(review.id, session),
    )


@router.post("/{session_id}/answer", response_model=ReviewAnswerResponse)
def submit_review_answer(
    session_id: str,
    body: ReviewAnswerRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    review = session.get(ReviewSession, session_id)
    if not review or review.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review session not found")
    if review.is_completed:
        raise HTTPException(status_code=400, detail="Review session already completed")

    item = session.exec(
        select(ReviewSessionItem).where(
            ReviewSessionItem.session_id == session_id,
            ReviewSessionItem.quiz_id == body.quiz_id,
        )
    ).first()
    if not item:
        raise HTTPException(status_code=400, detail="Quiz not in this review session")

    quiz = session.get(Quiz, body.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    is_correct = False
    correct_option_id: Optional[str] = None

    if quiz.type == "TRUE_FALSE":
        correct_opt = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id, QuizOption.is_correct == True)  # noqa: E712
        ).first()
        if correct_opt:
            correct_option_id = correct_opt.id
            is_correct = body.answer.lower() == correct_opt.text.lower()
    else:
        chosen_opt = session.get(QuizOption, body.answer)
        if chosen_opt and chosen_opt.quiz_id == quiz.id:
            is_correct = chosen_opt.is_correct
        correct_opt = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id, QuizOption.is_correct == True)  # noqa: E712
        ).first()
        if correct_opt:
            correct_option_id = correct_opt.id

    # Record answer (no XP for review)
    ua = UserAnswer(
        user_id=current_user.id,
        quiz_id=quiz.id,
        review_session_id=session_id,
        answer=body.answer,
        is_correct=is_correct,
        xp_earned=0,
    )
    session.add(ua)

    # Update SRS state
    update_srs_state(current_user.id, quiz.id, is_correct, session)
    session.commit()

    return ReviewAnswerResponse(
        is_correct=is_correct,
        explanation=quiz.explanation,
        detail=quiz.detail,
        correct_option_id=correct_option_id,
    )


@router.post("/{session_id}/complete", response_model=ReviewCompleteResponse)
def complete_review(
    session_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    review = session.get(ReviewSession, session_id)
    if not review or review.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Review session not found")

    if review.is_completed:
        return ReviewCompleteResponse(
            correct_count=review.correct_count,
            total_count=review.total_count,
        )

    items = session.exec(
        select(ReviewSessionItem).where(ReviewSessionItem.session_id == session_id)
    ).all()
    total = len(items)

    answers = session.exec(
        select(UserAnswer).where(
            UserAnswer.user_id == current_user.id,
            UserAnswer.review_session_id == session_id,
        )
    ).all()
    correct = sum(1 for a in answers if a.is_correct)

    review.is_completed = True
    review.correct_count = correct
    review.total_count = total
    review.completed_at = datetime.utcnow()
    session.add(review)
    session.commit()

    return ReviewCompleteResponse(correct_count=correct, total_count=total)
