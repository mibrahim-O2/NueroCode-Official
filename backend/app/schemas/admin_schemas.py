from pydantic import BaseModel


class UpdateRoleRequest(BaseModel):
    role: str
    reason: str | None = None


class ResetActionRequest(BaseModel):
    reason: str | None = None