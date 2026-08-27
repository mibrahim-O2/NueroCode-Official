from fastapi import APIRouter, Depends

from app.middleware.auth_middleware import get_current_user
from app.services.review_service import get_due_reviews

router = APIRouter(prefix="/roadmap", tags=["review"])


@router.get("/review-due")
async def review_due(current_user: dict = Depends(get_current_user)):
    return get_due_reviews(current_user["id"])