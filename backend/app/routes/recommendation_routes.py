from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import get_current_user
from app.services.recommendation_service import recommend_next_topic

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/roadmap")
async def get_roadmap_recommendation(current_user: dict = Depends(get_current_user)):
    return recommend_next_topic(current_user["id"])