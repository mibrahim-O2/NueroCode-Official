from pydantic import BaseModel


class StartAssessmentRequest(BaseModel):
    cluster_name: str


class SubmitAssessmentRequest(BaseModel):
    language: str
    source_code: str
    integrity_score: float = 100


class ProctoringLogRequest(BaseModel):
    event_type: str
    severity: str = "medium"
    metadata: dict | None = None