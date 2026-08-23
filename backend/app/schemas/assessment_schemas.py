from pydantic import BaseModel


class StartAssessmentRequest(BaseModel):
    cluster_name: str
    provider: str | None = None


class SubmitAssessmentRequest(BaseModel):
    language: str
    source_code: str
    integrity_score: float = 100


class ProctoringLogRequest(BaseModel):
    event_type: str
    severity: str = "medium"
    metadata: dict | None = None