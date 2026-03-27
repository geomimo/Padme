import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./padme.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
