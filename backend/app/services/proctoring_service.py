"""Behavioral integrity signal analysis: OpenCV-based camera presence
checks and a scikit-learn IsolationForest anomaly detector for keystroke
rhythm. Both are heuristic, unsupervised approaches — there is no
labeled "cheating" dataset to train against, so the keystroke model is
fit once at import time against a synthetic baseline of plausible
natural human typing intervals. This is a reasonable proxy signal, not
a claim of forensic accuracy.
"""

import base64

import cv2
import numpy as np
from sklearn.ensemble import IsolationForest

_face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def check_camera_frame(base64_jpeg: str) -> dict:
    """Decodes a base64 JPEG frame and checks for zero or multiple faces."""
    try:
        header_stripped = base64_jpeg.split(",")[-1]
        image_bytes = base64.b64decode(header_stripped)
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if frame is None:
            return {"faces_detected": 0, "alert": True, "reason": "invalid_frame"}

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
        count = len(faces)

        if count == 0:
            return {"faces_detected": 0, "alert": True, "reason": "no_face"}
        if count > 1:
            return {"faces_detected": count, "alert": True, "reason": "multiple_faces"}
        return {"faces_detected": 1, "alert": False, "reason": None}
    except Exception:
        return {"faces_detected": 0, "alert": True, "reason": "processing_error"}


def _generate_baseline_intervals(n: int = 500, seed: int = 42) -> np.ndarray:
    """Synthetic baseline of plausible natural human inter-keystroke
    intervals (ms) — used only because no real labeled dataset exists."""
    rng = np.random.default_rng(seed)
    return rng.lognormal(mean=4.8, sigma=0.4, size=n).reshape(-1, 1)


_keystroke_model = IsolationForest(contamination=0.1, random_state=42)
_keystroke_model.fit(_generate_baseline_intervals())


def check_keystroke_rhythm(intervals_ms: list[float]) -> dict:
    """Flags a batch of inter-keystroke intervals as anomalous if a large
    fraction look statistically unlike natural typing — e.g. an
    unnaturally uniform, very fast burst consistent with pasted or
    scripted input rather than live typing."""
    if len(intervals_ms) < 5:
        return {"anomalous": False, "anomaly_ratio": 0.0}

    samples = np.array(intervals_ms).reshape(-1, 1)
    predictions = _keystroke_model.predict(samples)  # -1 = anomaly, 1 = normal
    anomaly_ratio = float(np.mean(predictions == -1))

    return {"anomalous": anomaly_ratio > 0.4, "anomaly_ratio": round(anomaly_ratio, 3)}