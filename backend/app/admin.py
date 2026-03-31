import os

from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse

from .auth import verify_password
from .database import engine
from .models import (
    Achievement,
    Category,
    DailySet,
    Lesson,
    LearningPath,
    LearningPathItem,
    Quiz,
    QuizOption,
    QuizSRSState,
    ReviewSession,
    TestPlan,
    TestPlanItem,
    TestSession,
    TestSessionAnswer,
    User,
    UserAchievement,
    UserAnswer,
    UserBookmark,
    UserProgress,
)


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = str(form.get("username", ""))
        password = str(form.get("password", ""))

        from sqlmodel import Session, select
        with Session(engine) as session:
            user = session.exec(select(User).where(User.email == email)).first()
            if user and user.role == "admin" and verify_password(password, user.hashed_password):
                request.session.update({"admin_user_id": user.id})
                return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return bool(request.session.get("admin_user_id"))


# ---------------------------------------------------------------------------
# Model views
# ---------------------------------------------------------------------------

class UserAdmin(ModelView, model=User):
    column_list = [User.email, User.name, User.role, User.xp, User.streak, User.streak_freezes, User.is_active]
    column_searchable_list = [User.email, User.name]
    column_sortable_list = [User.xp, User.streak, User.created_at]
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-users"


class CategoryAdmin(ModelView, model=Category):
    column_list = [Category.name, Category.icon, Category.color, Category.order]
    column_sortable_list = [Category.order, Category.name]
    name = "Category"
    name_plural = "Categories"
    icon = "fa-solid fa-folder"


class LessonAdmin(ModelView, model=Lesson):
    column_list = [Lesson.title, Lesson.category_id, Lesson.order, Lesson.is_published]
    column_searchable_list = [Lesson.title]
    column_sortable_list = [Lesson.order, Lesson.created_at]
    name = "Lesson"
    name_plural = "Lessons"
    icon = "fa-solid fa-book"


class QuizAdmin(ModelView, model=Quiz):
    column_list = [Quiz.question, Quiz.type, Quiz.difficulty, Quiz.lesson_id, Quiz.xp_reward]
    column_searchable_list = [Quiz.question]
    name = "Quiz"
    name_plural = "Quizzes"
    icon = "fa-solid fa-question-circle"


class QuizOptionAdmin(ModelView, model=QuizOption):
    column_list = [QuizOption.text, QuizOption.is_correct, QuizOption.quiz_id, QuizOption.order]
    name = "Quiz Option"
    name_plural = "Quiz Options"
    icon = "fa-solid fa-list"


class DailySetAdmin(ModelView, model=DailySet):
    column_list = [DailySet.user_id, DailySet.date, DailySet.is_completed, DailySet.xp_earned]
    column_sortable_list = [DailySet.date]
    name = "Daily Set"
    name_plural = "Daily Sets"
    icon = "fa-solid fa-calendar"


class UserAnswerAdmin(ModelView, model=UserAnswer):
    column_list = [UserAnswer.user_id, UserAnswer.quiz_id, UserAnswer.is_correct, UserAnswer.xp_earned, UserAnswer.answered_at]
    column_sortable_list = [UserAnswer.answered_at]
    name = "User Answer"
    name_plural = "User Answers"
    icon = "fa-solid fa-check"


class UserProgressAdmin(ModelView, model=UserProgress):
    column_list = [UserProgress.user_id, UserProgress.lesson_id, UserProgress.total_quizzes, UserProgress.correct_answers]
    name = "User Progress"
    name_plural = "User Progress"
    icon = "fa-solid fa-chart-bar"


class TestPlanAdmin(ModelView, model=TestPlan):
    column_list = [TestPlan.title, TestPlan.user_id, TestPlan.admin_id, TestPlan.status, TestPlan.created_at]
    column_searchable_list = [TestPlan.title]
    column_sortable_list = [TestPlan.created_at, TestPlan.status]
    name = "Test Plan"
    name_plural = "Test Plans"
    icon = "fa-solid fa-clipboard-list"


class TestPlanItemAdmin(ModelView, model=TestPlanItem):
    column_list = [TestPlanItem.test_plan_id, TestPlanItem.quiz_id, TestPlanItem.order]
    name = "Test Plan Item"
    name_plural = "Test Plan Items"
    icon = "fa-solid fa-list-check"


class TestSessionAdmin(ModelView, model=TestSession):
    column_list = [TestSession.test_plan_id, TestSession.user_id, TestSession.status, TestSession.correct_count, TestSession.total_count, TestSession.xp_earned, TestSession.started_at]
    column_sortable_list = [TestSession.started_at]
    name = "Test Session"
    name_plural = "Test Sessions"
    icon = "fa-solid fa-stopwatch"


class TestSessionAnswerAdmin(ModelView, model=TestSessionAnswer):
    column_list = [TestSessionAnswer.test_session_id, TestSessionAnswer.quiz_id, TestSessionAnswer.is_correct, TestSessionAnswer.xp_earned, TestSessionAnswer.answered_at]
    column_sortable_list = [TestSessionAnswer.answered_at]
    name = "Test Session Answer"
    name_plural = "Test Session Answers"
    icon = "fa-solid fa-pen-to-square"


class AchievementAdmin(ModelView, model=Achievement):
    column_list = [Achievement.key, Achievement.name, Achievement.icon]
    name = "Achievement"
    name_plural = "Achievements"
    icon = "fa-solid fa-trophy"


class UserAchievementAdmin(ModelView, model=UserAchievement):
    column_list = [UserAchievement.user_id, UserAchievement.achievement_id, UserAchievement.earned_at]
    name = "User Achievement"
    name_plural = "User Achievements"
    icon = "fa-solid fa-medal"


class UserBookmarkAdmin(ModelView, model=UserBookmark):
    column_list = [UserBookmark.user_id, UserBookmark.quiz_id, UserBookmark.created_at]
    name = "Bookmark"
    name_plural = "Bookmarks"
    icon = "fa-solid fa-bookmark"


class LearningPathAdmin(ModelView, model=LearningPath):
    column_list = [LearningPath.title, LearningPath.order, LearningPath.is_published]
    name = "Learning Path"
    name_plural = "Learning Paths"
    icon = "fa-solid fa-road"


class LearningPathItemAdmin(ModelView, model=LearningPathItem):
    column_list = [LearningPathItem.path_id, LearningPathItem.lesson_id, LearningPathItem.order]
    name = "Path Item"
    name_plural = "Path Items"
    icon = "fa-solid fa-list-ol"


class ReviewSessionAdmin(ModelView, model=ReviewSession):
    column_list = [ReviewSession.user_id, ReviewSession.is_completed, ReviewSession.correct_count, ReviewSession.total_count]
    name = "Review Session"
    name_plural = "Review Sessions"
    icon = "fa-solid fa-rotate"


class QuizSRSStateAdmin(ModelView, model=QuizSRSState):
    column_list = [QuizSRSState.user_id, QuizSRSState.quiz_id, QuizSRSState.interval, QuizSRSState.next_review, QuizSRSState.ease_factor]
    name = "SRS State"
    name_plural = "SRS States"
    icon = "fa-solid fa-brain"


def create_admin(app) -> Admin:
    secret = os.getenv("ADMIN_SECRET", "change-me")
    authentication_backend = AdminAuth(secret_key=secret)
    admin = Admin(app, engine, authentication_backend=authentication_backend)

    admin.add_view(UserAdmin)
    admin.add_view(CategoryAdmin)
    admin.add_view(LessonAdmin)
    admin.add_view(QuizAdmin)
    admin.add_view(QuizOptionAdmin)
    admin.add_view(DailySetAdmin)
    admin.add_view(UserAnswerAdmin)
    admin.add_view(UserProgressAdmin)
    admin.add_view(TestPlanAdmin)
    admin.add_view(TestPlanItemAdmin)
    admin.add_view(TestSessionAdmin)
    admin.add_view(TestSessionAnswerAdmin)
    admin.add_view(AchievementAdmin)
    admin.add_view(UserAchievementAdmin)
    admin.add_view(UserBookmarkAdmin)
    admin.add_view(LearningPathAdmin)
    admin.add_view(LearningPathItemAdmin)
    admin.add_view(ReviewSessionAdmin)
    admin.add_view(QuizSRSStateAdmin)

    return admin
