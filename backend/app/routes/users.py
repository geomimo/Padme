from flask import Blueprint, request, jsonify
from ..models import db, User, UserProgress, UserBadge
from ..content.badges import BADGES, BADGES_BY_ID
from ..content.lessons import TOPICS, LESSONS
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
    result["leaderboard_opt_in"] = user.leaderboard_opt_in
    result["league_tier"] = user.league_tier
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
    if "leaderboard_opt_in" in data:
        user.leaderboard_opt_in = bool(data["leaderboard_opt_in"])

    db.session.commit()
    return jsonify({"ok": True, "daily_goal_xp": user.daily_goal_xp, "leaderboard_opt_in": user.leaderboard_opt_in})


@bp.route("/<user_id>/public", methods=["GET"])
def get_public_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    level = _get_level(user.xp)
    earned_badges = {ub.badge_id: ub.earned_at for ub in UserBadge.query.filter_by(user_id=user_id).all()}
    badges_earned = [
        {**{k: v for k, v in b.items()}, "earned_at": earned_badges[b["id"]].isoformat()}
        for b in BADGES if b["id"] in earned_badges
    ]

    # Per-topic mastery: avg score/total across completed lessons in topic
    all_progress = {p.lesson_id: p for p in UserProgress.query.filter_by(user_id=user_id).all()}
    topic_mastery = []
    for topic in TOPICS:
        lesson_scores = []
        for lid in topic["lesson_ids"]:
            if lid in all_progress:
                p = all_progress[lid]
                if p.total > 0:
                    lesson_scores.append(p.score / p.total)
        mastery_pct = round(sum(lesson_scores) / len(topic["lesson_ids"]) * 100) if topic["lesson_ids"] else 0
        topic_mastery.append({
            "topic_id": topic["id"],
            "title": topic["title"],
            "icon": topic["icon"],
            "mastery_pct": mastery_pct,
        })

    completed_paths = [up.path_id for up in user.paths if up.completed_at is not None]

    return jsonify({
        "user_id": user_id,
        "xp": user.xp,
        "streak": user.streak,
        "level_name": level["name"],
        "level_icon": level["icon"],
        "xp_to_next_level": _xp_to_next_level(user.xp),
        "badges_earned": badges_earned,
        "topic_mastery": topic_mastery,
        "paths_completed": completed_paths,
        "lessons_completed": len(all_progress),
    })


@bp.route("/<user_id>/badges", methods=["GET"])
def get_badges(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    earned = {ub.badge_id: ub.earned_at for ub in UserBadge.query.filter_by(user_id=user_id).all()}
    result = []
    for badge in BADGES:
        entry = dict(badge)
        entry["earned"] = badge["id"] in earned
        entry["earned_at"] = earned[badge["id"]].isoformat() if badge["id"] in earned else None
        result.append(entry)
    return jsonify(result)
