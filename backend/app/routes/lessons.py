from flask import Blueprint, request, jsonify
from ..content.lessons import LESSONS, TOPICS
from ..content.badges import BADGES_BY_ID
from ..content.paths import PATHS
from ..models import db, User, UserProgress, UserAnswer, UserBadge, UserPath, UserWeeklyXP
from ..utils.badges import evaluate_badges
from datetime import date, datetime
import json

bp = Blueprint("lessons", __name__, url_prefix="/api/lessons")

def strip_answers(exercise):
    ex = dict(exercise)
    ex.pop("correct_answer", None)
    return ex

def _check_exercise(exercise, user_answer):
    """Return True if user_answer is correct for the given exercise."""
    correct = exercise["correct_answer"]
    etype = exercise["type"]
    if etype in ("multiple_choice", "code_reading"):
        return user_answer == str(correct)
    if etype == "fill_blank":
        return user_answer.lower() == str(correct).lower()
    if etype == "match_pairs":
        try:
            submitted = json.loads(user_answer) if isinstance(user_answer, str) else user_answer
            return submitted == correct
        except (json.JSONDecodeError, TypeError):
            return False
    if etype == "order_steps":
        try:
            submitted = json.loads(user_answer) if isinstance(user_answer, str) else user_answer
            return submitted == correct
        except (json.JSONDecodeError, TypeError):
            return False
    return False

@bp.route("/", methods=["GET"])
def get_lessons():
    topic_id = request.args.get("topic_id")
    if not topic_id:
        return jsonify({"error": "topic_id required"}), 400

    topic = next((t for t in TOPICS if t["id"] == topic_id), None)
    if not topic:
        return jsonify({"error": "Topic not found"}), 404

    lessons = [
        {
            "id": lid,
            "title": LESSONS[lid]["title"],
            "description": LESSONS[lid]["description"],
            "xp_reward": LESSONS[lid]["xp_reward"],
        }
        for lid in topic["lesson_ids"]
    ]
    return jsonify(lessons)

@bp.route("/<lesson_id>", methods=["GET"])
def get_lesson(lesson_id):
    lesson = LESSONS.get(lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404

    result = dict(lesson)
    result["exercises"] = [strip_answers(ex) for ex in lesson["exercises"]]
    return jsonify(result)

@bp.route("/<lesson_id>/check", methods=["POST"])
def check_answer(lesson_id):
    data = request.json
    user_id = data.get("user_id")
    exercise_id = data.get("exercise_id")
    user_answer = (data.get("answer") or "").strip()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    lesson = LESSONS.get(lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404

    exercise = next((ex for ex in lesson["exercises"] if ex["id"] == exercise_id), None)
    if not exercise:
        return jsonify({"error": "Exercise not found"}), 404

    is_correct = _check_exercise(exercise, user_answer)

    explanation = exercise["explanation_correct"] if is_correct else exercise["explanation_wrong"]

    db.session.add(UserAnswer(
        user_id=user_id,
        lesson_id=lesson_id,
        exercise_id=exercise_id,
        answer=user_answer,
        is_correct=is_correct,
    ))
    db.session.commit()

    return jsonify({"correct": is_correct, "explanation": explanation})

@bp.route("/<lesson_id>/complete", methods=["POST"])
def complete_lesson(lesson_id):
    data = request.json
    user_id = data.get("user_id")
    answers = data.get("answers", {})

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    lesson = LESSONS.get(lesson_id)
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404

    score = 0
    total = len(lesson["exercises"])
    results = {}

    for exercise in lesson["exercises"]:
        ex_id = exercise["id"]
        user_answer = answers.get(ex_id, "")
        if isinstance(user_answer, str):
            user_answer = user_answer.strip()

        is_correct = _check_exercise(exercise, user_answer)

        if is_correct:
            score += 1

        results[ex_id] = {
            "correct": is_correct,
            "user_answer": user_answer,
            "correct_answer": json.dumps(exercise["correct_answer"]) if isinstance(exercise["correct_answer"], (dict, list)) else str(exercise["correct_answer"]),
            "explanation": exercise["explanation_correct"],
        }

    xp_earned = lesson["xp_reward"] + (5 * score)

    progress = UserProgress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if progress:
        xp_delta = max(0, xp_earned - progress.xp_earned)
        progress.score = score
        progress.total = total
        progress.xp_earned = xp_earned
    else:
        xp_delta = xp_earned
        progress = UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            score=score,
            total=total,
            xp_earned=xp_earned,
        )
        db.session.add(progress)

    user.xp += xp_delta

    today = date.today()

    # Daily XP tracking — reset counter on a new day
    if user.daily_xp_date != today:
        user.daily_xp_today = 0
        user.daily_xp_date = today
    prev_daily = user.daily_xp_today
    user.daily_xp_today += xp_delta

    # Grant a streak shield when daily goal is hit for the first time today
    if prev_daily < user.daily_goal_xp <= user.daily_xp_today:
        today_iso = today.isocalendar()
        current_week = today_iso[0] * 100 + today_iso[1]
        if user.shield_granted_week != current_week:
            user.streak_shields += 1
            user.shield_granted_week = current_week

    # Capture gap before updating last_active_date (needed for comeback badge)
    gap_days = None
    if user.last_active_date is not None and user.last_active_date != today:
        gap_days = (today - user.last_active_date).days

    # Streak — a shield absorbs exactly one missed day (gap of 2)
    if user.last_active_date is None:
        user.streak = 1
    elif user.last_active_date != today:
        days_gap = (today - user.last_active_date).days
        if days_gap == 1:
            user.streak += 1
        elif days_gap == 2 and user.streak_shields > 0:
            user.streak_shields -= 1
            user.streak += 1
        else:
            user.streak = 1
    user.last_active_date = today

    # Weekly leaderboard XP accumulation
    if user.leaderboard_opt_in and xp_delta > 0:
        iso = today.isocalendar()
        iso_week = f"{iso[0]}-W{iso[1]:02d}"
        weekly = UserWeeklyXP.query.filter_by(user_id=user_id, iso_week=iso_week).first()
        if weekly:
            weekly.weekly_xp += xp_delta
        else:
            weekly = UserWeeklyXP(user_id=user_id, iso_week=iso_week, weekly_xp=xp_delta, league_tier=user.league_tier)
            db.session.add(weekly)

    db.session.flush()  # write user changes so evaluate_badges sees updated streak

    # Badge evaluation
    all_progress = UserProgress.query.filter_by(user_id=user_id).all()
    earned_ids = {ub.badge_id for ub in UserBadge.query.filter_by(user_id=user_id).all()}
    newly_earned = evaluate_badges(
        user, all_progress, earned_ids,
        lesson_perfect=(score == total),
        gap_days=gap_days,
    )
    for badge_id in newly_earned:
        db.session.add(UserBadge(user_id=user_id, badge_id=badge_id))

    db.session.commit()

    # Path completion check
    completed_lesson_ids = {p.lesson_id for p in all_progress}
    enrolled_paths = UserPath.query.filter_by(user_id=user_id, completed_at=None).all()
    for up in enrolled_paths:
        path_def = next((p for p in PATHS if p["id"] == up.path_id), None)
        if path_def and all(lid in completed_lesson_ids for lid in path_def["lesson_ids"]):
            up.completed_at = datetime.utcnow()
            # Award path_complete badge if not already earned
            if "path_complete" not in earned_ids and "path_complete" in BADGES_BY_ID:
                db.session.add(UserBadge(user_id=user_id, badge_id="path_complete"))
                newly_earned.append("path_complete")
                earned_ids.add("path_complete")

    db.session.commit()

    new_badges = [
        {"id": bid, **{k: v for k, v in BADGES_BY_ID[bid].items() if k != "id"}}
        for bid in newly_earned
    ]

    return jsonify({
        "score": score,
        "total": total,
        "xp_earned": xp_earned,
        "streak": user.streak,
        "total_xp": user.xp,
        "streak_shields": user.streak_shields,
        "daily_xp_today": user.daily_xp_today,
        "daily_goal_xp": user.daily_goal_xp,
        "new_badges": new_badges,
        "results": results,
    })
