from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, func, select

from ..database import get_session
from ..dependencies import get_current_user, require_admin
from ..models import Category, Lesson, User

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryIn(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order: int = 0


class CategoryOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    order: int
    lesson_count: int = 0


@router.get("", response_model=list[CategoryOut])
def list_categories(session: Session = Depends(get_session), _: User = Depends(get_current_user)):
    cats = session.exec(select(Category).order_by(Category.order, Category.name)).all()
    result = []
    for c in cats:
        count = session.exec(select(func.count(Lesson.id)).where(Lesson.category_id == c.id)).one()
        result.append(CategoryOut(**c.model_dump(), lesson_count=count))
    return result


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryIn, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    existing = session.exec(select(Category).where(Category.name == body.name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category name already exists")
    cat = Category(**body.model_dump())
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return CategoryOut(**cat.model_dump(), lesson_count=0)


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: str, session: Session = Depends(get_session), _: User = Depends(get_current_user)):
    cat = session.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    count = session.exec(select(func.count(Lesson.id)).where(Lesson.category_id == category_id)).one()
    return CategoryOut(**cat.model_dump(), lesson_count=count)


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: str,
    body: CategoryIn,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    cat = session.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in body.model_dump().items():
        setattr(cat, k, v)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    count = session.exec(select(func.count(Lesson.id)).where(Lesson.category_id == category_id)).one()
    return CategoryOut(**cat.model_dump(), lesson_count=count)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: str, session: Session = Depends(get_session), _: User = Depends(require_admin)):
    cat = session.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    # Cascade delete lessons + quizzes
    lessons = session.exec(select(Lesson).where(Lesson.category_id == category_id)).all()
    from ..models import Quiz, QuizOption
    for lesson in lessons:
        quizzes = session.exec(select(Quiz).where(Quiz.lesson_id == lesson.id)).all()
        for quiz in quizzes:
            session.exec(select(QuizOption).where(QuizOption.quiz_id == quiz.id))
            for opt in session.exec(select(QuizOption).where(QuizOption.quiz_id == quiz.id)).all():
                session.delete(opt)
            session.delete(quiz)
        session.delete(lesson)
    session.delete(cat)
    session.commit()
