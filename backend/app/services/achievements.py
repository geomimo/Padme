"""Achievement definitions and award logic."""
from sqlmodel import Session, select, func

from ..models import Achievement, DailySet, User, UserAchievement, UserAnswer, UserBookmark

ACHIEVEMENT_DEFINITIONS = [
    {"key": "first_correct",     "name": "First Steps",         "description": "Answer your first question correctly",    "icon": "🎯"},
    {"key": "first_perfect_set", "name": "Flawless",            "description": "Complete a perfect daily set (5/5)",      "icon": "🏆"},
    {"key": "streak_3",          "name": "Hat Trick",           "description": "Reach a 3-day streak",                    "icon": "🔥"},
    {"key": "streak_7",          "name": "Week Warrior",        "description": "Reach a 7-day streak",                    "icon": "⚡"},
    {"key": "streak_30",         "name": "Unstoppable",         "description": "Reach a 30-day streak",                   "icon": "💎"},
    {"key": "xp_100",            "name": "Century",             "description": "Earn 100 XP total",                       "icon": "⭐"},
    {"key": "xp_500",            "name": "XP Machine",          "description": "Earn 500 XP total",                       "icon": "🌟"},
    {"key": "xp_1000",           "name": "Legend",              "description": "Earn 1000 XP total",                      "icon": "👑"},
    {"key": "correct_10",        "name": "Learner",             "description": "Answer 10 questions correctly",           "icon": "📚"},
    {"key": "correct_50",        "name": "Scholar",             "description": "Answer 50 questions correctly",           "icon": "🎓"},
    {"key": "correct_100",       "name": "Expert",              "description": "Answer 100 questions correctly",          "icon": "🏅"},
    {"key": "sets_5",            "name": "Regular",             "description": "Complete 5 daily sets",                   "icon": "📅"},
    {"key": "sets_30",           "name": "Dedicated",           "description": "Complete 30 daily sets",                  "icon": "📆"},
    {"key": "bookmarked_first",  "name": "Bookmark Collector",  "description": "Bookmark your first question",            "icon": "🔖"},
]


def ensure_achievements_exist(session: Session) -> dict:
    """Ensure all achievement definitions exist in DB. Returns key -> Achievement dict."""
    existing = {a.key: a for a in session.exec(select(Achievement)).all()}
    created = False
    for ach_data in ACHIEVEMENT_DEFINITIONS:
        if ach_data["key"] not in existing:
            ach = Achievement(**ach_data)
            session.add(ach)
            existing[ach_data["key"]] = ach
            created = True
    if created:
        session.commit()
        for a in list(existing.values()):
            try:
                session.refresh(a)
            except Exception:
                pass
    return existing


def check_and_award(user: User, session: Session, perfect_set: bool = False) -> list:
    """Check all achievement conditions and award new ones.

    Returns a list of newly earned Achievement objects.
    """
    achievements = ensure_achievements_exist(session)

    already_earned_ids = {
        ua.achievement_id
        for ua in session.exec(
            select(UserAchievement).where(UserAchievement.user_id == user.id)
        ).all()
    }

    newly_earned: list[Achievement] = []

    def award(key: str) -> None:
        ach = achievements.get(key)
        if ach and ach.id not in already_earned_ids:
            ua = UserAchievement(user_id=user.id, achievement_id=ach.id)
            session.add(ua)
            already_earned_ids.add(ach.id)
            newly_earned.append(ach)

    # Correct answer counts
    total_correct = session.exec(
        select(func.count(UserAnswer.id)).where(
            UserAnswer.user_id == user.id,
            UserAnswer.is_correct == True,  # noqa: E712
        )
    ).one() or 0

    if total_correct >= 1:
        award("first_correct")
    if total_correct >= 10:
        award("correct_10")
    if total_correct >= 50:
        award("correct_50")
    if total_correct >= 100:
        award("correct_100")

    # XP milestones
    if user.xp >= 100:
        award("xp_100")
    if user.xp >= 500:
        award("xp_500")
    if user.xp >= 1000:
        award("xp_1000")

    # Streak milestones
    if user.streak >= 3:
        award("streak_3")
    if user.streak >= 7:
        award("streak_7")
    if user.streak >= 30:
        award("streak_30")

    # Perfect set
    if perfect_set:
        award("first_perfect_set")

    # Completed sets count
    sets_done = session.exec(
        select(func.count(DailySet.id)).where(
            DailySet.user_id == user.id,
            DailySet.is_completed == True,  # noqa: E712
        )
    ).one() or 0

    if sets_done >= 5:
        award("sets_5")
    if sets_done >= 30:
        award("sets_30")

    # Bookmarks
    bookmarks_count = session.exec(
        select(func.count(UserBookmark.id)).where(UserBookmark.user_id == user.id)
    ).one() or 0

    if bookmarks_count >= 1:
        award("bookmarked_first")

    if newly_earned:
        session.commit()

    return newly_earned
