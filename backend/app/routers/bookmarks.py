"""User bookmark management."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..dependencies import get_current_user
from ..models import Quiz, QuizOption, User, UserBookmark
from ..services.achievements import check_and_award

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OptionPublic(BaseModel):
    id: str
    text: str
    order: int


class BookmarkedQuiz(BaseModel):
    bookmark_id: str
    quiz_id: str
    type: str
    question: str
    explanation: Optional[str]
    detail: Optional[str]
    difficulty: str
    xp_reward: int
    options: list[OptionPublic]


class BookmarkRequest(BaseModel):
    quiz_id: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("", response_model=list[BookmarkedQuiz])
def list_bookmarks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    bookmarks = session.exec(
        select(UserBookmark)
        .where(UserBookmark.user_id == current_user.id)
        .order_by(UserBookmark.created_at.desc())
    ).all()

    result = []
    for bm in bookmarks:
        quiz = session.get(Quiz, bm.quiz_id)
        if not quiz:
            continue
        opts = session.exec(
            select(QuizOption).where(QuizOption.quiz_id == quiz.id).order_by(QuizOption.order)
        ).all()
        result.append(
            BookmarkedQuiz(
                bookmark_id=bm.id,
                quiz_id=quiz.id,
                type=quiz.type,
                question=quiz.question,
                explanation=quiz.explanation,
                detail=quiz.detail,
                difficulty=quiz.difficulty,
                xp_reward=quiz.xp_reward,
                options=[OptionPublic(id=o.id, text=o.text, order=o.order) for o in opts],
            )
        )
    return result


@router.post("", response_model=BookmarkedQuiz, status_code=status.HTTP_201_CREATED)
def add_bookmark(
    body: BookmarkRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(UserBookmark).where(
            UserBookmark.user_id == current_user.id,
            UserBookmark.quiz_id == body.quiz_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already bookmarked")

    quiz = session.get(Quiz, body.quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    bm = UserBookmark(user_id=current_user.id, quiz_id=body.quiz_id)
    session.add(bm)
    session.commit()
    session.refresh(bm)

    # Award "first bookmark" achievement if applicable
    check_and_award(current_user, session)

    opts = session.exec(
        select(QuizOption).where(QuizOption.quiz_id == quiz.id).order_by(QuizOption.order)
    ).all()
    return BookmarkedQuiz(
        bookmark_id=bm.id,
        quiz_id=quiz.id,
        type=quiz.type,
        question=quiz.question,
        explanation=quiz.explanation,
        detail=quiz.detail,
        difficulty=quiz.difficulty,
        xp_reward=quiz.xp_reward,
        options=[OptionPublic(id=o.id, text=o.text, order=o.order) for o in opts],
    )


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark(
    quiz_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    bm = session.exec(
        select(UserBookmark).where(
            UserBookmark.user_id == current_user.id,
            UserBookmark.quiz_id == quiz_id,
        )
    ).first()
    if not bm:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    session.delete(bm)
    session.commit()
