from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from ..auth import ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, hash_password, verify_password
from ..database import get_session
from ..dependencies import get_current_user
from ..models import User

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str | None
    role: str
    xp: int
    streak: int
    longest_streak: int
    last_active_date: str | None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_access_token(
        {"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut(**user.model_dump()),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(**current_user.model_dump())
