"""Request bodies for /demo/* routes.

These are separate from the real request schemas because the demo endpoints
identify fixed content by stable string keys (problem_key, node_key,
assessment_key, interview topic) rather than by database UUIDs of generated
content. Values that end up in CHECK-constrained demo columns (severity,
badge_level) are validated here, so a bad value is a clean 422 instead of a
database error.
"""

from typing import Literal

from pydantic import BaseModel, Field

# Same language set the real execution_service.SUPPORTED_LANGUAGES grades.
SupportedLanguage = Literal["python", "javascript", "cpp"]

# The four real integrity detectors; keys match
# assessment_service.INTEGRITY_EVENT_PENALTIES.
IntegrityEventType = Literal["tab_switch", "paste", "camera_alert", "keystroke_alert"]


class DemoPasscodeRequest(BaseModel):
    # Same shape as admin_schemas.VerifyPasscodeRequest, mirroring the
    # existing provider-passcode flow.
    passcode: str


class DemoToggleRequest(BaseModel):
    enabled: bool


class DemoPracticeSubmitRequest(BaseModel):
    problem_key: str
    language: SupportedLanguage
    source_code: str


class DemoChallengeSubmitRequest(BaseModel):
    node_key: str
    question_index: int
    code: str
    language: SupportedLanguage = "python"


class DemoInterviewStartRequest(BaseModel):
    topic: str


class DemoInterviewSubmitRequest(BaseModel):
    language: SupportedLanguage = "python"
    source_code: str


class DemoAssessmentSubmitRequest(BaseModel):
    language: SupportedLanguage = "python"
    # One source string per assessment question, in question order. Like the
    # real submit request, there is deliberately no integrity_score field —
    # the server always recomputes it from demo_proctoring_logs.
    solutions: list[str]


class DemoProctoringLogRequest(BaseModel):
    event_type: IntegrityEventType
    severity: Literal["low", "medium", "high", "critical"] = "low"


class DemoCredentialIssueRequest(BaseModel):
    # Presenter-triggered issuing: any tier may be chosen for demo purposes.
    badge_level: Literal["bronze", "silver", "gold", "platinum"]
    # Which demo assessment the credential represents (topics and, when an
    # attempt exists, its scores come from here).
    assessment_key: str = "assessment_1"


class DemoCommentRequest(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)
