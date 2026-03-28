import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, UniqueConstraint


def _id() -> str:
    return str(uuid.uuid4())


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
# User activity
# ---------------------------------------------------------------------------

class UserAnswer(SQLModel, table=True):
    __tablename__ = "useranswer"

    id: str = Field(default_factory=_id, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    daily_set_id: Optional[str] = Field(default=None, foreign_key="dailyset.id")
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
# Admin test plans
# ---------------------------------------------------------------------------

class TestPlan(SQLModel, table=True):
    __tablename__ = "testplan"

    id: str = Field(default_factory=_id, primary_key=True)
    admin_id: str = Field(foreign_key="user.id")   # who created it
    user_id: str = Field(foreign_key="user.id")    # assigned to
    title: str
    description: Optional[str] = None
    status: str = Field(default="active")          # "draft" | "active" | "archived"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TestPlanItem(SQLModel, table=True):
    __tablename__ = "testplanitem"
    __table_args__ = (UniqueConstraint("test_plan_id", "quiz_id", name="uq_testplanitem"),)

    id: str = Field(default_factory=_id, primary_key=True)
    test_plan_id: str = Field(foreign_key="testplan.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    order: int = Field(default=0)


class TestSession(SQLModel, table=True):
    """One attempt/sitting by a user on a TestPlan (enables history & revisit)."""
    __tablename__ = "testsession"

    id: str = Field(default_factory=_id, primary_key=True)
    test_plan_id: str = Field(foreign_key="testplan.id")
    user_id: str = Field(foreign_key="user.id")
    status: str = Field(default="in_progress")     # "in_progress" | "completed"
    xp_earned: int = Field(default=0)
    correct_count: int = Field(default=0)
    total_count: int = Field(default=0)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class TestSessionAnswer(SQLModel, table=True):
    __tablename__ = "testsessionanswer"

    id: str = Field(default_factory=_id, primary_key=True)
    test_session_id: str = Field(foreign_key="testsession.id")
    quiz_id: str = Field(foreign_key="quiz.id")
    answer: str        # option id for MC, "true"/"false" for T/F
    is_correct: bool
    xp_earned: int = Field(default=0)
    answered_at: datetime = Field(default_factory=datetime.utcnow)
