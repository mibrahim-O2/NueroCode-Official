from pydantic import BaseModel


class LoginRequest(BaseModel):
    id_token: str


class UserOut(BaseModel):
    id: str
    firebase_uid: str
    name: str
    email: str
    avatar_url: str | None = None
    role: str
    xp: int = 0
    level: int = 1
    streak: int = 0


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut