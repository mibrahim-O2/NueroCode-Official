from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.schemas.roadmap_schemas import RoadmapNodeOut, CompleteNodeResponse
from app.database.repositories import (
    get_roadmap_for_user,
    seed_default_roadmap,
    mark_node_in_progress,
    complete_roadmap_node,
)

router = APIRouter(prefix="/roadmap", tags=["roadmap"])


@router.get("/", response_model=list[RoadmapNodeOut])
async def get_roadmap(current_user: dict = Depends(get_current_user)):
    nodes = get_roadmap_for_user(current_user["id"])
    if not nodes:
        nodes = seed_default_roadmap(current_user["id"])
    return nodes


@router.post("/{node_id}/start", response_model=RoadmapNodeOut)
async def start_node(node_id: str, current_user: dict = Depends(get_current_user)):
    node = mark_node_in_progress(node_id, current_user["id"])
    if not node:
        raise HTTPException(status_code=404, detail="Node not found or not eligible to start")
    return node


@router.post("/{node_id}/complete", response_model=CompleteNodeResponse)
async def complete_node(node_id: str, current_user: dict = Depends(get_current_user)):
    result = complete_roadmap_node(node_id, current_user["id"])
    if not result:
        raise HTTPException(status_code=404, detail="Node not found or already completed")
    return result