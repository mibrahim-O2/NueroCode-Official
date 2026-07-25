from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    topic: str | None = None
    mode: str = "practice"


class ChatResponse(BaseModel):
    reply: str
    grounded: bool
    refused: bool