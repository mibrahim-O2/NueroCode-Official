import logging
from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter, Depends

from app.database.repositories import update_user_preferences, update_user_profile
from app.middleware.auth_middleware import get_current_user
from app.schemas.profile_schemas import UpdatePreferencesRequest, UpdateProfileRequest
from app.services.supabase_service import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.patch("/me")
async def update_profile(payload: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("uid")
    return update_user_profile(user_id, payload.dict(exclude_unset=True))


@router.patch("/me/preferences")
async def update_preferences(payload: UpdatePreferencesRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("uid")
    return update_user_preferences(user_id, payload.preferences)


def _empty_charts_response(total_xp: int = 0, level: int = 1) -> Dict[str, Any]:
    return {
        "heatmap": [],
        "practice": [],
        "progression": [],
        "current_xp": total_xp,
        "level": level,
    }


@router.get("/analytics/user-charts")
async def get_user_charts(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    # Resolve user ID across auth providers
    user_id = current_user.get("id") or current_user.get("uid")

    # 1. Fetch official profile metrics directly from the users table
    try:
        user_row = (
            supabase.table("users")
            .select("xp, level, streak, created_at")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        user_data = user_row.data or {}
    except Exception as e:
        logger.error(f"Failed to fetch user row for charts: {str(e)}", exc_info=True)
        return _empty_charts_response()

    total_xp = int(user_data.get("xp") or 0)
    current_level = int(user_data.get("level") or max(1, total_xp // 100 + 1))
    account_created_at = user_data.get("created_at")

    # 2. Activity heatmap + per-topic solved counts come from submissions.
    # Every attempt counts toward the activity heatmap (that's just "were
    # they working"); only genuinely passing attempts count toward the
    # per-topic solved total. Pass/fail truth lives in execution_result
    # (the same field has_passing_submission() in repositories.py trusts),
    # NOT in verdict/status/xp_awarded/is_passed columns, which submissions
    # are never actually written with by create_submission().
    activity_map: Dict[str, int] = {}
    topic_map: Dict[str, int] = {}

    try:
        sub_res = (
            supabase.table("submissions")
            .select("created_at, topic, execution_result")
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .execute()
        )
        submissions = sub_res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch submissions for charts: {str(e)}", exc_info=True)
        submissions = []

    for sub in submissions:
        raw_dt = sub.get("created_at")
        if not raw_dt:
            continue
        date_str = str(raw_dt).split("T")[0].split(" ")[0]

        activity_map[date_str] = activity_map.get(date_str, 0) + 1

        passed = bool((sub.get("execution_result") or {}).get("all_passed"))
        if passed:
            topic = sub.get("topic") or "General"
            topic_map[topic] = topic_map.get(topic, 0) + 1

    heatmap_data = [{"date": k, "count": v} for k, v in sorted(activity_map.items())]
    practice_data = [
        {"topic": k, "solved": v}
        for k, v in sorted(topic_map.items(), key=lambda x: x[1], reverse=True)
    ]

    # 3. XP progression timeline. XP is only ever granted when a roadmap
    # node is completed (see complete_roadmap_node -> update_user_progress
    # in repositories.py) — there is no per-submission XP award anywhere
    # in this codebase. So the real chronological XP timeline comes from
    # roadmap_nodes.completed_at + xp_earned, grouped and summed by day,
    # not from submissions.
    progression = []
    today_dt = datetime.now(timezone.utc)

    try:
        nodes_res = (
            supabase.table("roadmap_nodes")
            .select("completed_at, xp_earned")
            .eq("user_id", user_id)
            .eq("status", "completed")
            .order("completed_at")
            .execute()
        )
        completed_nodes = [n for n in (nodes_res.data or []) if n.get("completed_at")]
    except Exception as e:
        logger.error(f"Failed to fetch completed roadmap nodes for charts: {str(e)}", exc_info=True)
        completed_nodes = []

    if completed_nodes:
        # Group same-day completions together so two topics finished on
        # the same day produce one point, not two overlapping ones.
        daily_xp_gain: Dict[str, int] = {}
        for node in completed_nodes:
            date_str = str(node["completed_at"]).split("T")[0].split(" ")[0]
            daily_xp_gain[date_str] = daily_xp_gain.get(date_str, 0) + int(node.get("xp_earned") or 0)

        running_xp = 0
        for d_str in sorted(daily_xp_gain.keys()):
            running_xp += daily_xp_gain[d_str]
            dt = datetime.strptime(d_str, "%Y-%m-%d")
            progression.append({
                "date": dt.strftime("%b %d, %Y"),
                "shortDay": dt.strftime("%b %d"),
                "xp": running_xp,
                "level": max(1, running_xp // 100 + 1),
            })

        # Covers XP granted outside node completion (admin adjustments,
        # test-mode stat sets) so the line still reaches the user's real
        # current total instead of silently under-reporting it.
        if running_xp < total_xp:
            progression.append({
                "date": f"Today ({today_dt.strftime('%b %d')})",
                "shortDay": "Today",
                "xp": total_xp,
                "level": current_level,
            })
    else:
        start_date_label = "Joined"
        if account_created_at:
            try:
                acc_dt = datetime.fromisoformat(str(account_created_at).replace("Z", "+00:00"))
                start_date_label = acc_dt.strftime("%b %d")
            except Exception:
                pass

        progression = [
            {
                "date": f"Start ({start_date_label})",
                "shortDay": start_date_label,
                "xp": 0,
                "level": 1,
            },
            {
                "date": f"Today ({today_dt.strftime('%b %d')})",
                "shortDay": "Today",
                "xp": total_xp,
                "level": current_level,
            },
        ]

    return {
        "heatmap": heatmap_data,
        "practice": practice_data,
        "progression": progression,
        "current_xp": total_xp,
        "level": current_level,
    }
