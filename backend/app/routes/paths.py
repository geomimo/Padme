from flask import Blueprint, request, jsonify
from ..content.paths import PATHS, PATHS_BY_ID
from ..content.lessons import LESSONS
from ..models import db, User, UserProgress, UserPath

bp = Blueprint("paths", __name__, url_prefix="/api/paths")


def _path_with_status(path, enrolled_path, completed_lesson_ids):
    lesson_ids = path["lesson_ids"]
    completed = sum(1 for lid in lesson_ids if lid in completed_lesson_ids)
    return {
        "id": path["id"],
        "title": path["title"],
        "description": path["description"],
        "estimated_minutes": path["estimated_minutes"],
        "certification_tier": path["certification_tier"],
        "lesson_count": len(lesson_ids),
        "completed_count": completed,
        "enrolled": enrolled_path is not None,
        "enrolled_at": enrolled_path.enrolled_at.isoformat() if enrolled_path else None,
        "completed": enrolled_path is not None and enrolled_path.completed_at is not None,
        "completed_at": enrolled_path.completed_at.isoformat() if (enrolled_path and enrolled_path.completed_at) else None,
    }


@bp.route("/", methods=["GET"])
def get_paths():
    user_id = request.args.get("user_id")
    user = User.query.get(user_id) if user_id else None

    enrolled_map = {}
    completed_lesson_ids = set()
    if user:
        enrolled_map = {up.path_id: up for up in UserPath.query.filter_by(user_id=user_id).all()}
        completed_lesson_ids = {p.lesson_id for p in UserProgress.query.filter_by(user_id=user_id).all()}

    return jsonify([
        _path_with_status(path, enrolled_map.get(path["id"]), completed_lesson_ids)
        for path in PATHS
    ])


@bp.route("/<path_id>", methods=["GET"])
def get_path(path_id):
    path = PATHS_BY_ID.get(path_id)
    if not path:
        return jsonify({"error": "Path not found"}), 404

    user_id = request.args.get("user_id")
    user = User.query.get(user_id) if user_id else None

    enrolled_path = None
    completed_lesson_ids = set()
    if user:
        enrolled_path = UserPath.query.filter_by(user_id=user_id, path_id=path_id).first()
        completed_lesson_ids = {p.lesson_id for p in UserProgress.query.filter_by(user_id=user_id).all()}

    result = _path_with_status(path, enrolled_path, completed_lesson_ids)
    result["lessons"] = [
        {
            "id": lid,
            "title": LESSONS[lid]["title"],
            "description": LESSONS[lid]["description"],
            "xp_reward": LESSONS[lid]["xp_reward"],
            "completed": lid in completed_lesson_ids,
        }
        for lid in path["lesson_ids"]
        if lid in LESSONS
    ]
    return jsonify(result)


@bp.route("/<path_id>/enroll", methods=["POST"])
def enroll(path_id):
    path = PATHS_BY_ID.get(path_id)
    if not path:
        return jsonify({"error": "Path not found"}), 404

    data = request.json or {}
    user_id = data.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    existing = UserPath.query.filter_by(user_id=user_id, path_id=path_id).first()
    if existing:
        return jsonify({"ok": True, "already_enrolled": True})

    db.session.add(UserPath(user_id=user_id, path_id=path_id))
    db.session.commit()
    return jsonify({"ok": True, "already_enrolled": False}), 201


@bp.route("/<path_id>/unenroll", methods=["POST"])
def unenroll(path_id):
    data = request.json or {}
    user_id = data.get("user_id")
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    up = UserPath.query.filter_by(user_id=user_id, path_id=path_id).first()
    if up:
        db.session.delete(up)
        db.session.commit()
    return jsonify({"ok": True})
