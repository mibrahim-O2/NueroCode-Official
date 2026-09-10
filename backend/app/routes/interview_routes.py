from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.schemas.interview_schemas import StartInterviewRequest, SubmitInterviewRequest
from app.services.interview_service import start_interview, submit_interview
from app.database.repositories import get_interview_history
from app.ai.gemini_provider import GeminiQuotaExceededError

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.post("/start")
async def start(payload: StartInterviewRequest, current_user: dict = Depends(get_current_user)):
    try:
        return start_interview(current_user["id"], payload.topic, payload.difficulty)
    except GeminiQuotaExceededError as exc:
        raise HTTPException(status_code=429, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/{session_id}/submit")
async def submit(session_id: str, payload: SubmitInterviewRequest, current_user: dict = Depends(get_current_user)):
    try:
        return submit_interview(current_user["id"], session_id, payload.language, payload.source_code)
    except TimeoutError as exc:
        raise HTTPException(status_code=408, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/mine")
async def mine(current_user: dict = Depends(get_current_user)):
    return get_interview_history(current_user["id"])