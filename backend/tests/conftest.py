"""Shared test fixtures for Padme backend tests."""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import get_session
from app.auth import hash_password
from app.models import Category, Lesson, Quiz, QuizOption, User


# ---------------------------------------------------------------------------
# In-memory SQLite engine shared across tests in a session
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def engine():
    _engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(_engine)
    yield _engine
    SQLModel.metadata.drop_all(_engine)


@pytest.fixture()
def session(engine):
    """Provide a transactional session that rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    _session = Session(bind=connection)
    yield _session
    _session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(session):
    """FastAPI TestClient with the DB session overridden to the test session."""
    def _get_test_session():
        yield session

    app.dependency_overrides[get_session] = _get_test_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Reusable data fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def regular_user(session) -> User:
    user = User(
        email="user@test.com",
        hashed_password=hash_password("password123"),
        name="Test User",
        role="user",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture()
def admin_user(session) -> User:
    user = User(
        email="admin@test.com",
        hashed_password=hash_password("adminpass"),
        name="Admin User",
        role="admin",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture()
def user_token(client, regular_user) -> str:
    res = client.post("/auth/login", json={"email": "user@test.com", "password": "password123"})
    return res.json()["access_token"]


@pytest.fixture()
def admin_token(client, admin_user) -> str:
    res = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpass"})
    return res.json()["access_token"]


@pytest.fixture()
def auth_headers(user_token) -> dict:
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture()
def admin_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def category(session) -> Category:
    cat = Category(name="Delta Lake", description="Delta Lake basics", icon="🏔️", color="#FF6B6B", order=1)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return cat


@pytest.fixture()
def published_lesson(session, category) -> Lesson:
    lesson = Lesson(
        title="Introduction to Delta Lake",
        description="Learn the basics",
        category_id=category.id,
        order=1,
        is_published=True,
    )
    session.add(lesson)
    session.commit()
    session.refresh(lesson)
    return lesson


@pytest.fixture()
def mc_quiz(session, published_lesson) -> tuple[Quiz, list[QuizOption]]:
    """A multiple-choice quiz with one correct option."""
    quiz = Quiz(
        lesson_id=published_lesson.id,
        type="MULTIPLE_CHOICE",
        question="What does ACID stand for?",
        explanation="ACID = Atomicity, Consistency, Isolation, Durability",
        xp_reward=10,
        order=0,
    )
    session.add(quiz)
    session.flush()

    options = [
        QuizOption(quiz_id=quiz.id, text="Atomicity, Consistency, Isolation, Durability", is_correct=True, order=0),
        QuizOption(quiz_id=quiz.id, text="Atomicity, Concurrency, Integrity, Durability", is_correct=False, order=1),
        QuizOption(quiz_id=quiz.id, text="Aggregation, Consistency, Isolation, Data", is_correct=False, order=2),
        QuizOption(quiz_id=quiz.id, text="Atomicity, Consistency, Integration, Deployment", is_correct=False, order=3),
    ]
    for opt in options:
        session.add(opt)
    session.commit()
    session.refresh(quiz)
    for opt in options:
        session.refresh(opt)
    return quiz, options


@pytest.fixture()
def tf_quiz(session, published_lesson) -> tuple[Quiz, list[QuizOption]]:
    """A true/false quiz where the correct answer is 'True'."""
    quiz = Quiz(
        lesson_id=published_lesson.id,
        type="TRUE_FALSE",
        question="Delta Lake supports ACID transactions.",
        explanation="Yes, Delta Lake provides ACID guarantees.",
        xp_reward=10,
        order=1,
    )
    session.add(quiz)
    session.flush()

    options = [
        QuizOption(quiz_id=quiz.id, text="True", is_correct=True, order=0),
        QuizOption(quiz_id=quiz.id, text="False", is_correct=False, order=1),
    ]
    for opt in options:
        session.add(opt)
    session.commit()
    session.refresh(quiz)
    for opt in options:
        session.refresh(opt)
    return quiz, options
