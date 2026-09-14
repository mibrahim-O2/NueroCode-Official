import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends

from app.database.repositories import update_user_preferences, update_user_profile
from app.middleware.auth_middleware import get_current_user
from app.schemas.profile_schemas import UpdatePreferencesRequest, UpdateProfileRequest
from app.services.supabase_service import supabase
# Chart building moved to user_charts_service (no behavior change) so the
# Demo Mode dashboard can reuse the exact same logic over its own separate
# demo tables instead of carrying a second copy of it.
from app.services.user_charts_service import (
    CHARTS_ROW_LIMIT,
    build_user_charts,
    charts_window_start,
    empty_charts_response,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.patch("/me")
async def update_profile(payload: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return update_user_profile(user_id, payload.dict(exclude_unset=True))


@router.patch("/me/preferences")
async def update_preferences(payload: UpdatePreferencesRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    return update_user_preferences(user_id, payload.preferences)


@router.get("/analytics/user-charts")
async def get_user_charts(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    # Resolve user ID across auth providers
    user_id = current_user["id"]

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
        return empty_charts_response()

    # 2. Submissions within the heatmap window, with a hard row cap as a
    # final safety net (see user_charts_service for how they're charted).
    try:
        sub_res = (
            supabase.table("submissions")
            .select("created_at, topic, execution_result")
            .eq("user_id", user_id)
            .gte("created_at", charts_window_start())
            .order("created_at", desc=False)
            .limit(CHARTS_ROW_LIMIT)
            .execute()
        )
        submissions = sub_res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch submissions for charts: {str(e)}", exc_info=True)
        submissions = []

    # 3. Completed roadmap nodes feed the XP progression timeline.
    try:
        nodes_res = (
            supabase.table("roadmap_nodes")
            .select("completed_at, xp_earned")
            .eq("user_id", user_id)
            .eq("status", "completed")
            .order("completed_at")
            .execute()
        )
        completed_nodes = nodes_res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch completed roadmap nodes for charts: {str(e)}", exc_info=True)
        completed_nodes = []

    return build_user_charts(user_data, submissions, completed_nodes)
