from pydantic import BaseModel


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    avatar_url: str | None = None


class UpdatePreferencesRequest(BaseModel):
    preferences: dict