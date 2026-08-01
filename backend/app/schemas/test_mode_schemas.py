from pydantic import BaseModel


class SetNodeStatusRequest(BaseModel):
    node_id: str
    status: str  # locked | unlocked | in_progress | completed


class CompleteThroughRequest(BaseModel):
    position: int


class AdjustStatsRequest(BaseModel):
    xp: int | None = None
    level: int | None = None
    streak: int | None = None


class SimulateSubmissionRequest(BaseModel):
    topic: str
    difficulty: str  # easy | medium | hard
    language: str = "python"
    outcome: str  # pass | fail
    persist: bool = False


class SimulateCredentialRequest(BaseModel):
    badge_level: str  # bronze | silver | gold | platinum