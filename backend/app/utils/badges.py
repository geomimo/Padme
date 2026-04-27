from ..content.badges import BADGES_BY_ID
from ..content.lessons import TOPICS

# Map topic badge id → topic lesson_ids
_TOPIC_LESSON_IDS = {
    f"topic_{t['id']}": t["lesson_ids"] for t in TOPICS
}


def evaluate_badges(user, all_progress, earned_ids, *, lesson_perfect=False, gap_days=None):
    """Return list of badge ids newly earned in this session.

    Args:
        user: User model instance (streak already updated).
        all_progress: list of UserProgress for this user.
        earned_ids: set of badge ids the user already holds.
        lesson_perfect: True when the completed lesson had zero wrong answers.
        gap_days: calendar days since last_active_date before this session (None = first session).
    """
    progress_by_lesson = {p.lesson_id: p for p in all_progress}
    newly_earned = []

    def award(badge_id):
        if badge_id in BADGES_BY_ID and badge_id not in earned_ids:
            newly_earned.append(badge_id)
            earned_ids.add(badge_id)

    # Streak badges
    if user.streak >= 100:
        award("streak_100")
    if user.streak >= 30:
        award("streak_30")
    if user.streak >= 7:
        award("streak_7")

    # Perfect lesson
    if lesson_perfect:
        award("perfect_lesson")

    # Comeback — gap of 7+ days before this session
    if gap_days is not None and gap_days >= 7:
        award("comeback")

    # Topic mastery — all lessons in a topic at ≥ 80%
    for badge_id, lesson_ids in _TOPIC_LESSON_IDS.items():
        if badge_id in earned_ids:
            continue
        if not lesson_ids:
            continue
        mastered = all(
            lesson_ids and
            lesson_ids[i] in progress_by_lesson and
            (progress_by_lesson[lesson_ids[i]].total or 0) > 0 and
            progress_by_lesson[lesson_ids[i]].score / progress_by_lesson[lesson_ids[i]].total >= 0.8
            for i in range(len(lesson_ids))
        )
        if mastered:
            award(badge_id)

    return newly_earned
