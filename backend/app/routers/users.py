"""User management — admin only."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..auth import hash_password
from ..database import get_session
from ..dependencies import require_admin
from ..models import User

router = APIRouter(prefix="/users", tags=["users"])


class CreateUserRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    role: str = "user"


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str
    xp: int
    streak: int
    longest_streak: int
    last_active_date: Optional[str]
    is_active: bool
    created_at: str

    @classmethod
    def from_user(cls, u: User) -> "UserOut":
        return cls(
            **{**u.model_dump(), "created_at": u.created_at.isoformat()}
        )


@router.get("", response_model=list[UserOut])
def list_users(
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    users = session.exec(select(User).order_by(User.created_at.desc())).all()
    return [UserOut.from_user(u) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    body: CreateUserRequest,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        role=body.role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return UserOut.from_user(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    body: UpdateUserRequest,
    session: Session = Depends(get_session),
    _: User = Depends(require_admin),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.name is not None:
        user.name = body.name
    if body.role is not None:
        user.role = body.role
    if body.is_active is not None:
        user.is_active = body.is_active

    session.add(user)
    session.commit()
    session.refresh(user)
    return UserOut.from_user(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
