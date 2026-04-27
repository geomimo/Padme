from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from uuid import uuid4

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    xp = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    daily_goal_xp = db.Column(db.Integer, default=30)
    streak_shields = db.Column(db.Integer, default=0)
    daily_xp_today = db.Column(db.Integer, default=0)
    daily_xp_date = db.Column(db.Date, nullable=True)
    shield_granted_week = db.Column(db.Integer, nullable=True)

    progress = db.relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    answers = db.relationship("UserAnswer", back_populates="user", cascade="all, delete-orphan")
    badges = db.relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    paths = db.relationship("UserPath", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "xp": self.xp,
            "streak": self.streak,
            "last_active_date": self.last_active_date.isoformat() if self.last_active_date else None,
            "created_at": self.created_at.isoformat(),
        }

class UserProgress(db.Model):
    __tablename__ = "user_progress"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    lesson_id = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, default=0)
    xp_earned = db.Column(db.Integer, default=0)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="progress")

    __table_args__ = (db.UniqueConstraint("user_id", "lesson_id", name="unique_user_lesson"),)

    def to_dict(self):
        return {
            "lesson_id": self.lesson_id,
            "score": self.score,
            "total": self.total,
            "xp_earned": self.xp_earned,
            "completed_at": self.completed_at.isoformat(),
        }

class UserAnswer(db.Model):
    __tablename__ = "user_answers"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    lesson_id = db.Column(db.String(100), nullable=False)
    exercise_id = db.Column(db.String(100), nullable=False)
    answer = db.Column(db.String(500), nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    answered_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="answers")


class UserBadge(db.Model):
    __tablename__ = "user_badges"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    badge_id = db.Column(db.String(50), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="badges")

    __table_args__ = (db.UniqueConstraint("user_id", "badge_id", name="unique_user_badge"),)


class UserPath(db.Model):
    __tablename__ = "user_paths"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    path_id = db.Column(db.String(100), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship("User", back_populates="paths")

    __table_args__ = (db.UniqueConstraint("user_id", "path_id", name="unique_user_path"),)
