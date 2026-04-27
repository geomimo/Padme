import os
import functools
from datetime import date, timedelta

from flask import Blueprint, request, jsonify

from ..models import db, User, UserProgress, UserAnswer, UserBadge, UserPath, UserWeeklyXP
from ..content import store
from ..content import writer

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

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
    for lv in LEVELS:
        if xp >= lv["min"]:
            level = lv
    return level


def _get_secret():
    return os.environ.get("ADMIN_SECRET", "admin-secret").strip()


def require_admin(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("X-Admin-Token", "").strip()
        if not token or token != _get_secret():
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    if (data.get("token") or "").strip() == _get_secret():
        return jsonify({"ok": True})
    return jsonify({"error": "Unauthorized"}), 401


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@bp.route("/stats")
@require_admin
def stats():
    today = date.today()
    total_users = User.query.count()
    active_7d = User.query.filter(
        User.last_active_date >= today - timedelta(days=7)
    ).count()
    active_30d = User.query.filter(
        User.last_active_date >= today - timedelta(days=30)
    ).count()

    total_exercises = sum(
        len(lesson.get("exercises", []))
        for lesson in store.LESSONS.values()
    )

    return jsonify({
        "total_users": total_users,
        "active_7d": active_7d,
        "active_30d": active_30d,
        "total_topics": len(store.TOPICS),
        "total_chapters": len(store.CHAPTERS),
        "total_lessons": len(store.LESSONS),
        "total_paths": len(store.PATHS),
        "total_exercises": total_exercises,
    })


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@bp.route("/users")
@require_admin
def list_users():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 50))
    sort = request.args.get("sort", "xp")
    order = request.args.get("order", "desc")
    search = request.args.get("search", "").strip()

    q = User.query
    if search:
        q = q.filter(User.id.ilike(f"%{search}%"))

    sort_col = getattr(User, sort, User.xp)
    if order == "desc":
        q = q.order_by(sort_col.desc())
    else:
        q = q.order_by(sort_col.asc())

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    users = pagination.items

    result = []
    for u in users:
        lessons_completed = UserProgress.query.filter_by(user_id=u.id).count()
        lv = _get_level(u.xp)
        result.append({
            "id": u.id,
            "xp": u.xp,
            "streak": u.streak,
            "created_at": u.created_at.isoformat(),
            "last_active_date": u.last_active_date.isoformat() if u.last_active_date else None,
            "lessons_completed": lessons_completed,
            "league_tier": u.league_tier,
            "level_name": lv["name"],
            "level_icon": lv["icon"],
        })

    return jsonify({
        "users": result,
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    })


@bp.route("/users/<user_id>")
@require_admin
def get_user(user_id):
    u = User.query.get_or_404(user_id)
    lv = _get_level(u.xp)
    progress = [p.to_dict() for p in u.progress]
    badges = [
        {"badge_id": b.badge_id, "earned_at": b.earned_at.isoformat()}
        for b in u.badges
    ]
    paths_enrolled = [
        {
            "path_id": p.path_id,
            "enrolled_at": p.enrolled_at.isoformat(),
            "completed_at": p.completed_at.isoformat() if p.completed_at else None,
        }
        for p in u.paths
    ]
    return jsonify({
        "id": u.id,
        "xp": u.xp,
        "streak": u.streak,
        "streak_shields": u.streak_shields,
        "daily_goal_xp": u.daily_goal_xp,
        "daily_xp_today": u.daily_xp_today,
        "leaderboard_opt_in": u.leaderboard_opt_in,
        "league_tier": u.league_tier,
        "created_at": u.created_at.isoformat(),
        "last_active_date": u.last_active_date.isoformat() if u.last_active_date else None,
        "level_name": lv["name"],
        "level_icon": lv["icon"],
        "progress": progress,
        "badges": badges,
        "paths": paths_enrolled,
    })


@bp.route("/users/<user_id>", methods=["PATCH"])
@require_admin
def update_user(user_id):
    u = User.query.get_or_404(user_id)
    data = request.get_json(force=True)
    if "xp" in data:
        u.xp = int(data["xp"])
    if "streak" in data:
        u.streak = int(data["streak"])
    if "daily_goal_xp" in data:
        u.daily_goal_xp = int(data["daily_goal_xp"])
    if "streak_shields" in data:
        u.streak_shields = int(data["streak_shields"])
    db.session.commit()
    lv = _get_level(u.xp)
    return jsonify({"id": u.id, "xp": u.xp, "streak": u.streak,
                    "daily_goal_xp": u.daily_goal_xp, "level_name": lv["name"]})


@bp.route("/users/<user_id>", methods=["DELETE"])
@require_admin
def delete_user(user_id):
    u = User.query.get_or_404(user_id)
    db.session.delete(u)
    db.session.commit()
    return jsonify({"ok": True})


@bp.route("/users/<user_id>/reset-xp", methods=["POST"])
@require_admin
def reset_user_xp(user_id):
    u = User.query.get_or_404(user_id)
    u.xp = 0
    u.streak = 0
    u.streak_shields = 0
    u.daily_xp_today = 0
    UserProgress.query.filter_by(user_id=user_id).delete()
    UserAnswer.query.filter_by(user_id=user_id).delete()
    UserBadge.query.filter_by(user_id=user_id).delete()
    UserWeeklyXP.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"ok": True, "xp": 0})


# ---------------------------------------------------------------------------
# Topics
# ---------------------------------------------------------------------------

@bp.route("/topics")
@require_admin
def list_topics():
    return jsonify(store.TOPICS)


@bp.route("/topics", methods=["POST"])
@require_admin
def create_topic():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("title"):
        return jsonify({"error": "id and title are required"}), 400
    if any(t["id"] == data["id"] for t in store.TOPICS):
        return jsonify({"error": "Topic id already exists"}), 409
    topic = {
        "id": data["id"],
        "title": data["title"],
        "description": data.get("description", ""),
        "icon": data.get("icon", "📚"),
        "lesson_ids": data.get("lesson_ids", []),
    }
    updated = store.TOPICS + [topic]
    writer.save_topics(updated)
    return jsonify(topic), 201


@bp.route("/topics/<topic_id>", methods=["PUT"])
@require_admin
def update_topic(topic_id):
    data = request.get_json(force=True)
    topics = list(store.TOPICS)
    idx = next((i for i, t in enumerate(topics) if t["id"] == topic_id), None)
    if idx is None:
        return jsonify({"error": "Not found"}), 404
    topics[idx] = {
        "id": topic_id,
        "title": data.get("title", topics[idx]["title"]),
        "description": data.get("description", topics[idx]["description"]),
        "icon": data.get("icon", topics[idx]["icon"]),
        "lesson_ids": data.get("lesson_ids", topics[idx]["lesson_ids"]),
    }
    writer.save_topics(topics)
    return jsonify(topics[idx])


@bp.route("/topics/<topic_id>", methods=["DELETE"])
@require_admin
def delete_topic(topic_id):
    topics = [t for t in store.TOPICS if t["id"] != topic_id]
    if len(topics) == len(store.TOPICS):
        return jsonify({"error": "Not found"}), 404
    writer.save_topics(topics)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Chapters
# ---------------------------------------------------------------------------

@bp.route("/chapters")
@require_admin
def list_chapters():
    return jsonify(store.CHAPTERS)


@bp.route("/chapters", methods=["POST"])
@require_admin
def create_chapter():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("title"):
        return jsonify({"error": "id and title are required"}), 400
    if any(c["id"] == data["id"] for c in store.CHAPTERS):
        return jsonify({"error": "Chapter id already exists"}), 409
    chapter = {
        "id": data["id"],
        "title": data["title"],
        "description": data.get("description", ""),
        "icon": data.get("icon", "📖"),
        "order": data.get("order", len(store.CHAPTERS) + 1),
        "lesson_ids": data.get("lesson_ids", []),
        "boss_lesson_id": data.get("boss_lesson_id", ""),
    }
    updated = store.CHAPTERS + [chapter]
    writer.save_chapters(updated)
    return jsonify(chapter), 201


@bp.route("/chapters/<chapter_id>", methods=["PUT"])
@require_admin
def update_chapter(chapter_id):
    data = request.get_json(force=True)
    chapters = list(store.CHAPTERS)
    idx = next((i for i, c in enumerate(chapters) if c["id"] == chapter_id), None)
    if idx is None:
        return jsonify({"error": "Not found"}), 404
    chapters[idx] = {
        "id": chapter_id,
        "title": data.get("title", chapters[idx]["title"]),
        "description": data.get("description", chapters[idx]["description"]),
        "icon": data.get("icon", chapters[idx]["icon"]),
        "order": data.get("order", chapters[idx]["order"]),
        "lesson_ids": data.get("lesson_ids", chapters[idx]["lesson_ids"]),
        "boss_lesson_id": data.get("boss_lesson_id", chapters[idx]["boss_lesson_id"]),
    }
    writer.save_chapters(chapters)
    return jsonify(chapters[idx])


@bp.route("/chapters/<chapter_id>", methods=["DELETE"])
@require_admin
def delete_chapter(chapter_id):
    chapters = [c for c in store.CHAPTERS if c["id"] != chapter_id]
    if len(chapters) == len(store.CHAPTERS):
        return jsonify({"error": "Not found"}), 404
    writer.save_chapters(chapters)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Lessons
# ---------------------------------------------------------------------------

@bp.route("/lessons")
@require_admin
def list_lessons():
    topic_filter = request.args.get("topic_id")
    chapter_filter = request.args.get("chapter_id")
    lessons = list(store.LESSONS.values())
    if topic_filter:
        lessons = [l for l in lessons if l.get("topic_id") == topic_filter]
    if chapter_filter:
        lessons = [l for l in lessons if l.get("chapter_id") == chapter_filter]
    lessons.sort(key=lambda l: (l.get("chapter_id", ""), l.get("order", 0)))
    summary = [
        {
            "id": l["id"],
            "title": l["title"],
            "topic_id": l.get("topic_id"),
            "chapter_id": l.get("chapter_id"),
            "order": l.get("order", 0),
            "boss": l.get("boss", False),
            "xp_reward": l.get("xp_reward", 0),
            "exercise_count": len(l.get("exercises", [])),
        }
        for l in lessons
    ]
    return jsonify(summary)


@bp.route("/lessons/<lesson_id>")
@require_admin
def get_lesson(lesson_id):
    lesson = store.LESSONS.get(lesson_id)
    if lesson is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(lesson)


@bp.route("/lessons", methods=["POST"])
@require_admin
def create_lesson():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("title"):
        return jsonify({"error": "id and title are required"}), 400
    if data["id"] in store.LESSONS:
        return jsonify({"error": "Lesson id already exists"}), 409
    lesson = {
        "id": data["id"],
        "title": data["title"],
        "description": data.get("description", ""),
        "xp_reward": data.get("xp_reward", 100),
        "topic_id": data.get("topic_id", ""),
        "chapter_id": data.get("chapter_id", ""),
        "order": data.get("order", 1),
        "boss": data.get("boss", False),
        "exercises": data.get("exercises", []),
    }
    updated = dict(store.LESSONS)
    updated[lesson["id"]] = lesson
    writer.save_lessons(updated)
    return jsonify(lesson), 201


@bp.route("/lessons/<lesson_id>", methods=["PUT"])
@require_admin
def update_lesson(lesson_id):
    if lesson_id not in store.LESSONS:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(force=True)
    existing = store.LESSONS[lesson_id]
    lesson = {
        "id": lesson_id,
        "title": data.get("title", existing["title"]),
        "description": data.get("description", existing.get("description", "")),
        "xp_reward": data.get("xp_reward", existing.get("xp_reward", 100)),
        "topic_id": data.get("topic_id", existing.get("topic_id", "")),
        "chapter_id": data.get("chapter_id", existing.get("chapter_id", "")),
        "order": data.get("order", existing.get("order", 1)),
        "boss": data.get("boss", existing.get("boss", False)),
        "exercises": data.get("exercises", existing.get("exercises", [])),
    }
    updated = dict(store.LESSONS)
    updated[lesson_id] = lesson
    writer.save_lessons(updated)
    return jsonify(lesson)


@bp.route("/lessons/<lesson_id>", methods=["DELETE"])
@require_admin
def delete_lesson(lesson_id):
    if lesson_id not in store.LESSONS:
        return jsonify({"error": "Not found"}), 404
    updated = {k: v for k, v in store.LESSONS.items() if k != lesson_id}
    writer.save_lessons(updated)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

@bp.route("/paths")
@require_admin
def list_paths():
    return jsonify(store.PATHS)


@bp.route("/paths", methods=["POST"])
@require_admin
def create_path():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("title"):
        return jsonify({"error": "id and title are required"}), 400
    if any(p["id"] == data["id"] for p in store.PATHS):
        return jsonify({"error": "Path id already exists"}), 409
    path = {
        "id": data["id"],
        "title": data["title"],
        "description": data.get("description", ""),
        "lesson_ids": data.get("lesson_ids", []),
        "estimated_minutes": data.get("estimated_minutes", 30),
        "certification_tier": data.get("certification_tier", None),
        "badge_id": data.get("badge_id", "path_complete"),
    }
    writer.save_paths(store.PATHS + [path])
    return jsonify(path), 201


@bp.route("/paths/<path_id>", methods=["PUT"])
@require_admin
def update_path(path_id):
    data = request.get_json(force=True)
    paths = list(store.PATHS)
    idx = next((i for i, p in enumerate(paths) if p["id"] == path_id), None)
    if idx is None:
        return jsonify({"error": "Not found"}), 404
    paths[idx] = {
        "id": path_id,
        "title": data.get("title", paths[idx]["title"]),
        "description": data.get("description", paths[idx]["description"]),
        "lesson_ids": data.get("lesson_ids", paths[idx]["lesson_ids"]),
        "estimated_minutes": data.get("estimated_minutes", paths[idx]["estimated_minutes"]),
        "certification_tier": data.get("certification_tier", paths[idx]["certification_tier"]),
        "badge_id": data.get("badge_id", paths[idx]["badge_id"]),
    }
    writer.save_paths(paths)
    return jsonify(paths[idx])


@bp.route("/paths/<path_id>", methods=["DELETE"])
@require_admin
def delete_path(path_id):
    paths = [p for p in store.PATHS if p["id"] != path_id]
    if len(paths) == len(store.PATHS):
        return jsonify({"error": "Not found"}), 404
    writer.save_paths(paths)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Badges
# ---------------------------------------------------------------------------

@bp.route("/badges")
@require_admin
def list_badges():
    return jsonify(store.BADGES)


@bp.route("/badges", methods=["POST"])
@require_admin
def create_badge():
    data = request.get_json(force=True)
    if not data.get("id") or not data.get("name"):
        return jsonify({"error": "id and name are required"}), 400
    if any(b["id"] == data["id"] for b in store.BADGES):
        return jsonify({"error": "Badge id already exists"}), 409
    badge = {
        "id": data["id"],
        "name": data["name"],
        "description": data.get("description", ""),
        "icon": data.get("icon", "🏅"),
    }
    writer.save_badges(store.BADGES + [badge])
    return jsonify(badge), 201


@bp.route("/badges/<badge_id>", methods=["PUT"])
@require_admin
def update_badge(badge_id):
    data = request.get_json(force=True)
    badges = list(store.BADGES)
    idx = next((i for i, b in enumerate(badges) if b["id"] == badge_id), None)
    if idx is None:
        return jsonify({"error": "Not found"}), 404
    badges[idx] = {
        "id": badge_id,
        "name": data.get("name", badges[idx]["name"]),
        "description": data.get("description", badges[idx]["description"]),
        "icon": data.get("icon", badges[idx]["icon"]),
    }
    writer.save_badges(badges)
    return jsonify(badges[idx])


@bp.route("/badges/<badge_id>", methods=["DELETE"])
@require_admin
def delete_badge(badge_id):
    badges = [b for b in store.BADGES if b["id"] != badge_id]
    if len(badges) == len(store.BADGES):
        return jsonify({"error": "Not found"}), 404
    writer.save_badges(badges)
    return jsonify({"ok": True})
