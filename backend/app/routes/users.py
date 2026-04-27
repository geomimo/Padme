from flask import Blueprint, request, jsonify
from ..models import db, User, UserProgress
from datetime import date

bp = Blueprint("users", __name__, url_prefix="/api/users")

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
    return jsonify(result)
