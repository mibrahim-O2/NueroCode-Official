from pydantic import BaseModel


class StartAssessmentRequest(BaseModel):
    cluster_name: str
    provider: str | None = None


class SubmitAssessmentRequest(BaseModel):
    language: str
    source_code: str
    # Accepted for backward compatibility with the existing frontend
    # payload shape, but IGNORED by the backend — the real integrity score
    # is recomputed server-side from proctoring_logs in
    # assessment_service.compute_integrity_score(). It has no effect on
    # pass/fail or credential issuance.
    integrity_score: float = 100


class ProctoringLogRequest(BaseModel):
    event_type: str
    severity: str = "medium"
    metadata: dict | None = None