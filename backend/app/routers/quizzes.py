from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user, require_admin
from ..models import Lesson, Quiz, QuizOption, User

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OptionIn(BaseModel):
    text: str
    is_correct: bool
    order: int = 0


class QuizIn(BaseModel):
    lesson_id: str
    type: str          # "MULTIPLE_CHOICE" | "TRUE_FALSE"
    question: str
    explanation: Optional[str] = None
    detail: Optional[str] = None
    xp_reward: int = 10
    order: int = 0
    options: list[OptionIn]


class OptionOut(BaseModel):
    id: str
    text: str
    order: int
    # is_correct is intentionally omitted here (used for admin only)


class OptionAdminOut(OptionOut):
    is_correct: bool


class QuizOut(BaseModel):
    id: str
    lesson_id: str
    type: str
    question: str
    explanation: Optional[str]
    detail: Optional[str]
    xp_reward: int
    order: int
    options: list[OptionOut]


class QuizAdminOut(QuizOut):
    options: list[OptionAdminOut]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_options(quiz_id: str, session: Session) -> list[QuizOption]:
    return session.exec(
        select(QuizOption).where(QuizOption.quiz_id == quiz_id).order_by(QuizOption.order)
    ).all()


# ---------------------------------------------------------------------------
# Lesson-scoped listing (admin)
# ---------------------------------------------------------------------------

@router.get("/by-lesson/{lesson_id}", response_model=list[QuizAdminOut])
def list_quizzes_for_lesson(
    lesson_id: str,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    quizzes = session.exec(select(Quiz).where(Quiz.lesson_id == lesson_id).order_by(Quiz.order)).all()
    result = []
    for quiz in quizzes:
        opts = _get_options(quiz.id, session)
        result.append(QuizAdminOut(**quiz.model_dump(), options=[OptionAdminOut(**o.model_dump()) for o in opts]))
    return result


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.post("", response_model=QuizAdminOut, status_code=status.HTTP_201_CREATED)
def create_quiz(body: QuizIn, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    if not session.get(Lesson, body.lesson_id):
        raise HTTPException(status_code=404, detail="Lesson not found")

    quiz_data = body.model_dump(exclude={"options"})
    quiz = Quiz(**quiz_data)
    session.add(quiz)
    session.flush()

    for opt_in in body.options:
        opt = QuizOption(quiz_id=quiz.id, **opt_in.model_dump())
        session.add(opt)

    session.commit()
    session.refresh(quiz)
    opts = _get_options(quiz.id, session)
    return QuizAdminOut(**quiz.model_dump(), options=[OptionAdminOut(**o.model_dump()) for o in opts])


@router.get("/{quiz_id}", response_model=QuizAdminOut)
def get_quiz(quiz_id: str, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    opts = _get_options(quiz_id, session)
    return QuizAdminOut(**quiz.model_dump(), options=[OptionAdminOut(**o.model_dump()) for o in opts])


@router.put("/{quiz_id}", response_model=QuizAdminOut)
def update_quiz(
    quiz_id: str,
    body: QuizIn,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    for k, v in body.model_dump(exclude={"options"}).items():
        setattr(quiz, k, v)
    session.add(quiz)

    # Replace options
    for old_opt in _get_options(quiz_id, session):
        session.delete(old_opt)
    session.flush()

    for opt_in in body.options:
        session.add(QuizOption(quiz_id=quiz.id, **opt_in.model_dump()))

    session.commit()
    session.refresh(quiz)
    opts = _get_options(quiz.id, session)
    return QuizAdminOut(**quiz.model_dump(), options=[OptionAdminOut(**o.model_dump()) for o in opts])


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: str, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    quiz = session.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    for opt in _get_options(quiz_id, session):
        session.delete(opt)
    session.delete(quiz)
    session.commit()
