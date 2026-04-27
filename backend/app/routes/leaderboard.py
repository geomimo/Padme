from flask import Blueprint, request, jsonify
from ..models import db, User, UserWeeklyXP
from datetime import date

bp = Blueprint("leaderboard", __name__, url_prefix="/api/leaderboard")

TIER_NAMES = {1: "Bronze", 2: "Silver", 3: "Gold", 4: "Diamond"}
TIER_ICONS = {1: "🥉", 2: "🥈", 3: "🥇", 4: "💎"}


def _current_iso_week():
    iso = date.today().isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}", iso[0] * 100 + iso[1]


def _prev_iso_week():
    from datetime import timedelta
    prev = date.today() - timedelta(weeks=1)
    iso = prev.isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


def _run_promotion(tier):
    """Lazy end-of-week promotion: top 25% up, bottom 25% down within a tier."""
    prev_week = _prev_iso_week()
    entries = (
        UserWeeklyXP.query
        .filter_by(iso_week=prev_week, league_tier=tier)
        .order_by(UserWeeklyXP.weekly_xp.desc())
        .all()
    )
    n = len(entries)
    if n < 4:
        return
    promote_count = max(1, n // 4)
    demote_count = max(1, n // 4)
    for i, entry in enumerate(entries):
        user = User.query.get(entry.user_id)
        if not user:
            continue
        if i < promote_count and tier < 4:
            user.league_tier = tier + 1
        elif i >= n - demote_count and tier > 1:
            user.league_tier = tier - 1
    db.session.commit()


def _maybe_run_promotions(current_week_str):
    """Run promotion for all tiers if we haven't yet this week."""
    prev_week = _prev_iso_week()
    # Check if any promotions already happened this week by seeing if any
    # current-week entries exist that differ from the previous week tier
    already_run = UserWeeklyXP.query.filter_by(iso_week=current_week_str).count() > 0
    if not already_run:
        for tier in range(1, 5):
            _run_promotion(tier)


@bp.route("/", methods=["GET"])
def get_leaderboard():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.leaderboard_opt_in:
        return jsonify({"opted_in": False})

    current_week, _ = _current_iso_week()
    _maybe_run_promotions(current_week)

    tier = user.league_tier
    entries = (
        UserWeeklyXP.query
        .filter_by(iso_week=current_week, league_tier=tier)
        .order_by(UserWeeklyXP.weekly_xp.desc())
        .all()
    )

    # Also include users opted in but with no entry yet this week (0 XP)
    opted_in_users = User.query.filter_by(leaderboard_opt_in=True, league_tier=tier).all()
    entry_user_ids = {e.user_id for e in entries}
    rows = []
    for entry in entries:
        u = User.query.get(entry.user_id)
        rows.append({
            "user_id": entry.user_id,
            "weekly_xp": entry.weekly_xp,
            "level_name": u.level_name if hasattr(u, "level_name") else None,
            "is_self": entry.user_id == user_id,
        })
    for u in opted_in_users:
        if u.id not in entry_user_ids:
            rows.append({
                "user_id": u.id,
                "weekly_xp": 0,
                "is_self": u.id == user_id,
            })
    rows.sort(key=lambda r: r["weekly_xp"], reverse=True)

    # Attach rank and level info
    from ..routes.users import LEVELS, _get_level
    for i, row in enumerate(rows):
        row["rank"] = i + 1
        u = User.query.get(row["user_id"])
        if u:
            lvl = _get_level(u.xp)
            row["level_name"] = lvl["name"]
            row["level_icon"] = lvl["icon"]
            row["total_xp"] = u.xp

    return jsonify({
        "opted_in": True,
        "tier": tier,
        "tier_name": TIER_NAMES.get(tier, "Bronze"),
        "tier_icon": TIER_ICONS.get(tier, "🥉"),
        "week": current_week,
        "entries": rows,
    })
