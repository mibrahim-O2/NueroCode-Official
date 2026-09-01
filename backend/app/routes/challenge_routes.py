from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from app.services.challenge_service import ChallengeService
from app.routes.auth_routes import get_current_user

router = APIRouter(tags=["Challenges"])

class SubmitQuestionPayload(BaseModel):
    question_index: int
    code: str
    language: str = "python"

@router.get("/challenges/{node_id}")
async def get_node_challenge(
    node_id: str,
    provider: str = Query("gemini"),
    current_user: dict = Depends(get_current_user)
):
    if not node_id or node_id == "undefined":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid node_id is required")
    user_id = current_user.get("id") or current_user.get("uid")
    return await ChallengeService.get_or_generate_challenge(user_id=user_id, node_id=node_id, provider_name=provider)

@router.post("/challenges/{node_id}/submit-question")
async def submit_challenge_question(
    node_id: str,
    payload: SubmitQuestionPayload,
    current_user: dict = Depends(get_current_user)
):
    if not node_id or node_id == "undefined":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid node_id is required")
    user_id = current_user.get("id") or current_user.get("uid")
    return await ChallengeService.submit_challenge_question(user_id=user_id, node_id=node_id, question_index=payload.question_index, code=payload.code, language=payload.language)

@router.get("/challenges/{node_id}/history")
async def get_node_challenge_history(
    node_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("id") or current_user.get("uid")
    return await ChallengeService.get_challenge_history(user_id=user_id, node_id=node_id)
