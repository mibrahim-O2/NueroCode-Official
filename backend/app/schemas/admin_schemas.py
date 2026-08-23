from pydantic import BaseModel


class UpdateRoleRequest(BaseModel):
    role: str
    reason: str | None = None


class VerifyPasscodeRequest(BaseModel):
    passcode: str


class ResetActionRequest(BaseModel):
    reason: str | None = None