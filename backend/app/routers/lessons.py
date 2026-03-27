from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, func, select

from ..database import get_session
from ..dependencies import get_current_user, require_admin
from ..models import Category, Lesson, Quiz, User

router = APIRouter(prefix="/lessons", tags=["lessons"])


class LessonIn(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: str
    order: int = 0
    is_published: bool = False


class LessonOut(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category_id: str
    order: int
    is_published: bool
    quiz_count: int = 0


@router.get("", response_model=list[LessonOut])
def list_lessons(
    category_id: Optional[str] = None,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    q = select(Lesson)
    if category_id:
        q = q.where(Lesson.category_id == category_id)
    lessons = session.exec(q.order_by(Lesson.order, Lesson.title)).all()
    result = []
    for l in lessons:
        count = session.exec(select(func.count(Quiz.id)).where(Quiz.lesson_id == l.id)).one()
        result.append(LessonOut(**l.model_dump(), quiz_count=count))
    return result


@router.post("", response_model=LessonOut, status_code=status.HTTP_201_CREATED)
def create_lesson(body: LessonIn, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    if not session.get(Category, body.category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    lesson = Lesson(**body.model_dump())
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return LessonOut(**lesson.model_dump(), quiz_count=0)


@router.get("/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: str, session: Session = Depends(get_session), _: User = Depends(get_current_user)):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    count = session.exec(select(func.count(Quiz.id)).where(Quiz.lesson_id == lesson_id)).one()
    return LessonOut(**lesson.model_dump(), quiz_count=count)


@router.put("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: str,
    body: LessonIn,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not session.get(Category, body.category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in body.model_dump().items():
        setattr(lesson, k, v)
    lesson.updated_at = datetime.utcnow()
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    count = session.exec(select(func.count(Quiz.id)).where(Quiz.lesson_id == lesson_id)).one()
    return LessonOut(**lesson.model_dump(), quiz_count=count)


@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(lesson_id: str, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    from ..models import QuizOption
    quizzes = session.exec(select(Quiz).where(Quiz.lesson_id == lesson_id)).all()
    for quiz in quizzes:
        for opt in session.exec(select(QuizOption).where(QuizOption.quiz_id == quiz.id)).all():
            session.delete(opt)
        session.delete(quiz)
    session.delete(lesson)
    session.commit()
