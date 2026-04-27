from flask import Blueprint, request, jsonify
from ..content.lessons import LESSONS, TOPICS
from ..models import db, User, UserProgress, UserAnswer
from datetime import date, datetime

bp = Blueprint("lessons", __name__, url_prefix="/api/lessons")

def strip_answers(exercise):
    ex = dict(exercise)
    ex.pop("correct_answer", None)
    return ex

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

    correct_answer = exercise["correct_answer"]
    if exercise["type"] == "multiple_choice":
        is_correct = user_answer == str(correct_answer)
    elif exercise["type"] == "fill_blank":
        is_correct = user_answer.lower() == str(correct_answer).lower()
    else:
        is_correct = False

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
        correct_answer = exercise["correct_answer"]
        user_answer = answers.get(ex_id, "").strip()

        is_correct = False
        if exercise["type"] == "multiple_choice":
            is_correct = user_answer == str(correct_answer)
        elif exercise["type"] == "fill_blank":
            is_correct = user_answer.lower() == str(correct_answer).lower()

        if is_correct:
            score += 1

        results[ex_id] = {
            "correct": is_correct,
            "user_answer": user_answer,
            "correct_answer": str(correct_answer),
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

    db.session.commit()

    return jsonify({
        "score": score,
        "total": total,
        "xp_earned": xp_earned,
        "streak": user.streak,
        "total_xp": user.xp,
        "streak_shields": user.streak_shields,
        "daily_xp_today": user.daily_xp_today,
        "daily_goal_xp": user.daily_goal_xp,
        "results": results,
    })
