from flask import Blueprint, request, jsonify
from ..content.lessons import TOPICS, LESSONS
from ..models import User, UserProgress

bp = Blueprint("topics", __name__, url_prefix="/api/topics")

@bp.route("/", methods=["GET"])
def get_topics():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify(TOPICS)

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    completed_lessons = {p.lesson_id for p in user.progress}

    result = []
    for topic in TOPICS:
        topic_copy = dict(topic)
        total = len(topic["lesson_ids"])
        completed = sum(1 for lid in topic["lesson_ids"] if lid in completed_lessons)
        topic_copy["completion_percent"] = (completed / total * 100) if total > 0 else 0
        result.append(topic_copy)

    return jsonify(result)
