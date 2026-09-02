import logging
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.middleware.auth_middleware import get_current_user
from app.schemas.roadmap_schemas import RoadmapNodeOut, CompleteNodeResponse
from app.services.supabase_service import supabase
from app.database.repositories import (
    get_roadmap_for_user,
    seed_default_roadmap,
    mark_node_in_progress,
    complete_roadmap_node,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.get("/", response_model=List[RoadmapNodeOut])
async def get_roadmap(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("uid")
    nodes = get_roadmap_for_user(user_id)
    if not nodes:
        nodes = seed_default_roadmap(user_id)
    return nodes


@router.get("/topic-progress")
async def get_topic_progress(current_user: dict = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Returns submission counts per topic without failing on missing status columns.
    """
    user_id = current_user.get("id") or current_user.get("uid")
    topic_counts: Dict[str, int] = {}

    try:
        # Fetch user's submissions
        res = (
            supabase.table("submissions")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        rows = res.data or []
        problem_ids_to_fetch = []

        for row in rows:
            # Filter for accepted if a verdict/status column exists; otherwise count the submission
            verdict = str(
                row.get("status")
                or row.get("verdict")
                or row.get("result")
                or "Accepted"
            ).lower()

            is_accepted = verdict in ["accepted", "passed", "true", "1", "correct"]
            if not is_accepted and ("status" in row or "verdict" in row or "passed" in row):
                continue

            topic = row.get("topic")
            if topic:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1
            elif row.get("problem_id"):
                problem_ids_to_fetch.append(row["problem_id"])

        # Resolve topics from problems table if submissions only stores problem_id
        if problem_ids_to_fetch:
            unique_ids = list(set(problem_ids_to_fetch))
            prob_res = (
                supabase.table("problems")
                .select("id, topic")
                .in_("id", unique_ids)
                .execute()
            )
            prob_map = {p["id"]: (p.get("topic") or "General") for p in (prob_res.data or [])}
            for pid in problem_ids_to_fetch:
                t = prob_map.get(pid, "General")
                topic_counts[t] = topic_counts.get(t, 0) + 1

        return {"topic_progress": topic_counts}

    except Exception as e:
        logger.error(f"Error resolving topic progress: {str(e)}", exc_info=True)
        return {"topic_progress": {}}


@router.post("/{node_id}/start", response_model=RoadmapNodeOut)
async def start_node(node_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("uid")
    node = mark_node_in_progress(node_id, user_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found or not eligible to start"
        )
    return node


@router.post("/{node_id}/complete", response_model=CompleteNodeResponse)
async def complete_node(node_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("uid")
    result = complete_roadmap_node(node_id, user_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found or already completed"
        )
    return result
