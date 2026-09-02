from datetime import datetime
from typing import Any, Dict
from fastapi import APIRouter, Depends

from app.database.repositories import update_user_preferences, update_user_profile
from app.middleware.auth_middleware import get_current_user
from app.schemas.profile_schemas import UpdatePreferencesRequest, UpdateProfileRequest
from app.services.supabase_service import supabase

router = APIRouter(prefix="/profile", tags=["profile"])


@router.patch("/me")
async def update_profile(payload: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    return update_user_profile(current_user["id"], payload.dict(exclude_unset=True))


@router.patch("/me/preferences")
async def update_preferences(payload: UpdatePreferencesRequest, current_user: dict = Depends(get_current_user)):
    return update_user_preferences(current_user["id"], payload.preferences)


@router.get("/analytics/user-charts")
async def get_user_charts(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    user_id = current_user.get("id") or current_user.get("uid")

    # 1. Fetch current profile XP
    user_row = supabase.table("users").select("xp, level").eq("id", user_id).maybe_single().execute()
    user_data = user_row.data or {}
    current_total_xp = user_data.get("xp") or 0

    # 2. Fetch all user submissions chronologically
    sub_res = (
        supabase.table("submissions")
        .select("created_at, verdict, status, topic, xp_awarded")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    submissions = sub_res.data or []

    activity_map: Dict[str, int] = {}
    topic_map: Dict[str, int] = {}
    daily_xp_gain: Dict[str, int] = {}

    for sub in submissions:
        raw_dt = sub.get("created_at")
        if not raw_dt:
            continue
        date_str = raw_dt.split("T")[0]

        # Daily activity tally for GitHub-like matrix
        activity_map[date_str] = activity_map.get(date_str, 0) + 1

        # Practice solved tally and XP mapping
        topic = sub.get("topic") or "General"
        is_accepted = (
            str(sub.get("verdict")).lower() == "accepted"
            or str(sub.get("status")).lower() == "accepted"
        )

        if is_accepted:
            topic_map[topic] = topic_map.get(topic, 0) + 1
            awarded = sub.get("xp_awarded") or 20
            daily_xp_gain[date_str] = daily_xp_gain.get(date_str, 0) + awarded

    heatmap_data = [{"date": k, "count": v} for k, v in activity_map.items()]
    practice_data = [{"topic": k, "solved": v} for k, v in topic_map.items()]

    # 3. Calculate real cumulative XP progression
    progression = []
    if daily_xp_gain:
        sorted_dates = sorted(daily_xp_gain.keys())
        running_xp = 0
        for d_str in sorted_dates:
            running_xp += daily_xp_gain[d_str]
            dt = datetime.strptime(d_str, "%Y-%m-%d")
            progression.append({
                "date": dt.strftime("%a, %b %d"),
                "shortDay": dt.strftime("%b %d"),
                "xp": running_xp,
                "level": max(1, running_xp // 100 + 1)
            })

        # Anchor progression to current total XP if additional XP came from challenges/nodes
        if progression and progression[-1]["xp"] != current_total_xp:
            today_dt = datetime.utcnow()
            progression.append({
                "date": today_dt.strftime("%a, %b %d"),
                "shortDay": "Today",
                "xp": current_total_xp,
                "level": max(1, current_total_xp // 100 + 1)
            })
    else:
        today_dt = datetime.utcnow()
        progression = [
            {
                "date": today_dt.strftime("%a, %b %d"),
                "shortDay": "Today",
                "xp": current_total_xp,
                "level": max(1, current_total_xp // 100 + 1)
            }
        ]

    return {
        "heatmap": heatmap_data,
        "practice": practice_data,
        "progression": progression,
        "current_xp": current_total_xp
    }
