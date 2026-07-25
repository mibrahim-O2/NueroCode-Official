from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth_middleware import get_current_user
from app.schemas.chatbot_schemas import ChatRequest, ChatResponse
from app.services.chatbot_service import ask_chatbot

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/", response_model=ChatResponse)
async def chatbot(payload: ChatRequest, current_user: dict = Depends(get_current_user)):
    if payload.mode == "assessment":
        raise HTTPException(status_code=403, detail="Chatbot is disabled during assessments")
    return ask_chatbot(current_user["id"], payload.message, payload.topic)