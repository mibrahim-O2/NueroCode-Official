from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import get_current_user
from app.schemas.roadmap_schemas import LeaderboardEntry
from app.database.repositories import get_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("/", response_model=list[LeaderboardEntry])
async def leaderboard(current_user: dict = Depends(get_current_user)):
    return get_leaderboard(limit=20)