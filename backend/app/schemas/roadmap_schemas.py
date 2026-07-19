from pydantic import BaseModel

from app.schemas.auth_schemas import UserOut


class RoadmapNodeOut(BaseModel):
    id: str
    user_id: str
    topic: str
    difficulty: str
    status: str
    position: int
    xp_earned: int
    unlocked_at: str | None = None
    completed_at: str | None = None


class CompleteNodeResponse(BaseModel):
    node: RoadmapNodeOut
    user: UserOut
    xp_awarded: int
    leveled_up: bool


class LeaderboardEntry(BaseModel):
    id: str
    name: str
    avatar_url: str | None = None
    xp: int
    level: int
    role: str