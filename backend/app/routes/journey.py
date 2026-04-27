from flask import Blueprint, request, jsonify
from ..content.lessons import CHAPTERS, LESSONS
from ..models import User, UserProgress

bp = Blueprint("journey", __name__, url_prefix="/api/journey")

@bp.route("/", methods=["GET"])
def get_journey():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    completed_lesson_ids = {
        p.lesson_id
        for p in UserProgress.query.filter_by(user_id=user_id).all()
    }

    result = []
    prev_boss_completed = True  # Chapter 1 always unlocked

    for chapter in CHAPTERS:
        unlocked = prev_boss_completed

        chapter_lessons = []
        for lid in chapter["lesson_ids"]:
            lesson = LESSONS[lid]
            chapter_lessons.append({
                "id": lesson["id"],
                "title": lesson["title"],
                "xp_reward": lesson["xp_reward"],
                "boss": False,
                "order": lesson["order"],
                "completed": lid in completed_lesson_ids,
            })

        boss_id = chapter["boss_lesson_id"]
        boss = LESSONS[boss_id]
        boss_completed = boss_id in completed_lesson_ids
        chapter_lessons.append({
            "id": boss["id"],
            "title": boss["title"],
            "xp_reward": boss["xp_reward"],
            "boss": True,
            "order": boss["order"],
            "completed": boss_completed,
        })

        result.append({
            "id": chapter["id"],
            "title": chapter["title"],
            "description": chapter["description"],
            "icon": chapter["icon"],
            "order": chapter["order"],
            "unlocked": unlocked,
            "lessons": chapter_lessons,
        })

        prev_boss_completed = boss_completed

    return jsonify(result)
