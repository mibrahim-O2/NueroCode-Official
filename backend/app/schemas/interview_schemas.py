from pydantic import BaseModel


class StartInterviewRequest(BaseModel):
    topic: str
    difficulty: str = "medium"


class SubmitInterviewRequest(BaseModel):
    language: str
    source_code: str