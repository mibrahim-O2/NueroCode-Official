from pydantic import BaseModel


class CameraCheckRequest(BaseModel):
    frame: str  # base64 JPEG, may include a data: URL prefix


class CameraCheckResponse(BaseModel):
    faces_detected: int
    alert: bool
    reason: str | None = None


class KeystrokeCheckRequest(BaseModel):
    intervals_ms: list[float]


class KeystrokeCheckResponse(BaseModel):
    anomalous: bool
    anomaly_ratio: float