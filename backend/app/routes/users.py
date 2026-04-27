from flask import Blueprint, request, jsonify
from ..models import db, User, UserProgress
from datetime import date

bp = Blueprint("users", __name__, url_prefix="/api/users")

LEVELS = [
    {"min": 0,    "name": "Spark Rookie",          "icon": "🔥"},
    {"min": 200,  "name": "Bronze Committer",       "icon": "🥉"},
    {"min": 500,  "name": "Delta Writer",           "icon": "📝"},
    {"min": 1000, "name": "Streaming Practitioner", "icon": "🌊"},
    {"min": 2000, "name": "Lakehouse Architect",    "icon": "🏛️"},
    {"min": 4000, "name": "Databricks Master",      "icon": "⚡"},
]

def _get_level(xp):
    level = LEVELS[0]
    for l in LEVELS:
        if xp >= l["min"]:
            level = l
    return level

def _xp_to_next_level(xp):
    for l in LEVELS:
        if xp < l["min"]:
            return l["min"] - xp
    return 0

@bp.route("/", methods=["POST"])
def create_user():
    user = User()
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    result = user.to_dict()
    result["completed_lessons"] = [p.lesson_id for p in user.progress]
    level = _get_level(user.xp)
    result["level_name"] = level["name"]
    result["level_icon"] = level["icon"]
    result["xp_to_next_level"] = _xp_to_next_level(user.xp)
    result["daily_goal_xp"] = user.daily_goal_xp
    result["daily_xp_today"] = user.daily_xp_today if user.daily_xp_date == date.today() else 0
    result["streak_shields"] = user.streak_shields
    return jsonify(result)


@bp.route("/<user_id>/settings", methods=["PATCH"])
def update_settings(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json or {}
    if "daily_goal_xp" in data:
        goal = int(data["daily_goal_xp"])
        if goal < 1:
            return jsonify({"error": "daily_goal_xp must be positive"}), 400
        user.daily_goal_xp = goal

    db.session.commit()
    return jsonify({"ok": True, "daily_goal_xp": user.daily_goal_xp})
