import uuid
from datetime import datetime, date as _date
from typing import Optional
from sqlmodel import SQLModel, Field, UniqueConstraint


def _id() -> str:
    return str(uuid.uuid4())


def _today() -> str:
    return _date.today().isoformat()


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(SQLModel, table=True):
    __tablename__ = "user"

    id: str = Field(default_factory=_id, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    name: Optional[str] = None
    role: str = Field(default="user")          # "user" | "admin"
    xp: int = Field(default=0)
    streak: int = Field(default=0)
    longest_streak: int = Field(default=0)
    last_active_date: Optional[str] = None     # "YYYY-MM-DD"
    streak_freezes: int = Field(default=0)
    onboarding_complete: bool = Field(default=False)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------

class Category(SQLModel, table=True):
    __tablename__ = "category"

    id: str = Field(default_factory=_id, primary_key=True)
    name: str = Field(unique=True)
    description: Optional[str] = None
    icon: Optional[str] = None    # emoji
    color: Optional[str] = None   # hex colour
    order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Lesson(SQLModel, table=True):
    __tablename__ = "lesson"

    id: str = Field(default_factory=_id, primary_key=True)
    title: str
    description: Optional[str] = None
    category_id: str = Field(foreign_key="category.id")
    order: int = Field(default=0)
    is_published: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Quiz(SQLModel, table=True):
    __tablename__ = "quiz"

    id: str = Field(default_factory=_id, primary_key=True)
    lesson_id: str = Field(foreign_key="lesson.id")
    type: str        # "MULTIPLE_CHOICE" | "TRUE_FALSE"
    question: str
    explanation: Optional[str] = None
    detail: Optional[str] = None   # Extended "Learn More" content
    difficulty: str = Field(default="beginner")  # "beginner" | "intermediate" | "advanced"
    xp_reward: int = Field(default=10)
    order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QuizOption(SQLModel, table=True):
    __tablename__ = "quizoption"

    id: str = Field(default_factory=_id, primary_key=True)
    quiz_id: str = Field(foreign_key="quiz.id")
    text: str
    is_correct: bool = Field(default=False)
    order: int = Field(default=0)


# ---------------------------------------------------------------------------
# Daily learning set
# ---------------------------------------------------------------------------

class DailySet(SQLModel, table=True):
    __tablename__ = "dailyset"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_dailyset_user_date"),)

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    date: str        # "YYYY-MM-DD"
    is_completed: bool = Field(default=False)
    xp_earned: int = Field(default=0)
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DailySetItem(SQLModel, table=True):
    __tablename__ = "dailysetitem"
    __table_args__ = (UniqueConstraint("daily_set_id", "quiz_id", name="uq_dailysetitem"),)

    id: str = Field(default_factory=_id, primary_key=True)
    daily_set_id: str = Field(foreign_key="dailyset.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    order: int = Field(default=0)


# ---------------------------------------------------------------------------
# Review session
# ---------------------------------------------------------------------------

class ReviewSession(SQLModel, table=True):
    __tablename__ = "reviewsession"

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    is_completed: bool = Field(default=False)
    correct_count: int = Field(default=0)
    total_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class ReviewSessionItem(SQLModel, table=True):
    __tablename__ = "reviewsessionitem"

    id: str = Field(default_factory=_id, primary_key=True)
    session_id: str = Field(foreign_key="reviewsession.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    order: int = Field(default=0)


# ---------------------------------------------------------------------------
# User activity
# ---------------------------------------------------------------------------

class UserAnswer(SQLModel, table=True):
    __tablename__ = "useranswer"

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    daily_set_id: Optional[str] = Field(default=None, foreign_key="dailyset.id")
    review_session_id: Optional[str] = Field(default=None, foreign_key="reviewsession.id")
    answer: str      # option id for MC, "true"/"false" for T/F
    is_correct: bool
    xp_earned: int = Field(default=0)
    answered_at: datetime = Field(default_factory=datetime.utcnow)


class UserProgress(SQLModel, table=True):
    __tablename__ = "userprogress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_userprogress"),)

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    lesson_id: str = Field(foreign_key="lesson.id")
    total_quizzes: int = Field(default=0)
    correct_answers: int = Field(default=0)
    completed_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# SRS (Spaced Repetition System) state per user+quiz
# ---------------------------------------------------------------------------

class QuizSRSState(SQLModel, table=True):
    __tablename__ = "quizsrsstate"
    __table_args__ = (UniqueConstraint("user_id", "quiz_id", name="uq_quizsrsstate"),)

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    ease_factor: float = Field(default=2.5)
    interval: int = Field(default=1)        # days until next review
    repetitions: int = Field(default=0)
    next_review: str = Field(default_factory=_today)   # "YYYY-MM-DD"
    last_reviewed: Optional[str] = None


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

class Achievement(SQLModel, table=True):
    __tablename__ = "achievement"

    id: str = Field(default_factory=_id, primary_key=True)
    key: str = Field(unique=True)
    name: str
    description: str
    icon: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserAchievement(SQLModel, table=True):
    __tablename__ = "userachievement"
    __table_args__ = (UniqueConstraint("user_id", "achievement_id", name="uq_userachievement"),)

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    achievement_id: str = Field(foreign_key="achievement.id")
    earned_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Bookmarks
# ---------------------------------------------------------------------------

class UserBookmark(SQLModel, table=True):
    __tablename__ = "userbookmark"
    __table_args__ = (UniqueConstraint("user_id", "quiz_id", name="uq_userbookmark"),)

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Learning Paths
# ---------------------------------------------------------------------------

class LearningPath(SQLModel, table=True):
    __tablename__ = "learningpath"

    id: str = Field(default_factory=_id, primary_key=True)
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order: int = Field(default=0)
    is_published: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LearningPathItem(SQLModel, table=True):
    __tablename__ = "learningpathitem"
    __table_args__ = (UniqueConstraint("path_id", "lesson_id", name="uq_pathitem"),)

    id: str = Field(default_factory=_id, primary_key=True)
    path_id: str = Field(foreign_key="learningpath.id")
    lesson_id: str = Field(foreign_key="lesson.id")
    order: int = Field(default=0)
