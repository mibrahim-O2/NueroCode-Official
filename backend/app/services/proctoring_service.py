"""Behavioral integrity signal analysis: OpenCV-based camera presence
checks and a keystroke rhythm check for machine-like typing.

Keystroke detection combines two signals and requires BOTH to agree
before flagging anything:
  1. An IsolationForest anomaly ratio against a synthetic baseline of
     plausible human typing variance (quick within-word bursts +
     natural short pauses) — there's no real labeled dataset, so this
     is a heuristic proxy, not a claim of forensic accuracy.
  2. A deterministic check for genuinely uniform, fast timing (low
     coefficient of variation + a quick mean interval) — the actual
     signature of scripted/simulated input, which the ML signal alone
     was too noisy to gate on reliably.
Ordinary human typing has substantial natural variance even when fast,
so it fails signal #2 and is never flagged regardless of what the
isolation forest alone thinks.
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


def _generate_baseline_intervals(n: int = 800, seed: int = 42) -> np.ndarray:
    """Synthetic baseline covering realistic human typing variance — quick
    within-burst keystrokes mixed with natural short pauses (punctuation,
    indentation, brief thinking). This gives the isolation forest a
    reasonable general sense of typical spread, but the hard decision is
    made by the deterministic uniformity/speed gate in
    check_keystroke_rhythm, not by this model in isolation.
    """
    rng = np.random.default_rng(seed)
    fast_bursts = rng.lognormal(mean=4.6, sigma=0.5, size=n // 2)  # roughly 60-220ms
    short_pauses = rng.lognormal(mean=5.6, sigma=0.5, size=n // 2)  # roughly 150-600ms
    return np.concatenate([fast_bursts, short_pauses]).reshape(-1, 1)


_keystroke_model = IsolationForest(contamination=0.05, random_state=42)
_keystroke_model.fit(_generate_baseline_intervals())

# Long pauses (thinking, reading the problem, checking something) aren't
# informative of typing rhythm and shouldn't skew the batch.
_MAX_RELEVANT_INTERVAL_MS = 2000

# Both must hold for a batch to be flagged: the ML model must disagree
# strongly with the human-variance baseline, AND the timing itself must
# actually look uniform and fast — the concrete signature of scripted or
# simulated input, not just "typed quickly" (real fast typists exist).
_ANOMALY_RATIO_THRESHOLD = 0.75
_MAX_COEFFICIENT_OF_VARIATION = 0.35
_MAX_MEAN_INTERVAL_MS = 80


def check_keystroke_rhythm(intervals_ms: list[float]) -> dict:
    if len(intervals_ms) < 8:
        return {"anomalous": False, "anomaly_ratio": 0.0}

    filtered = [i for i in intervals_ms if i <= _MAX_RELEVANT_INTERVAL_MS]
    if len(filtered) < 8:
        return {"anomalous": False, "anomaly_ratio": 0.0}

    samples = np.array(filtered).reshape(-1, 1)
    predictions = _keystroke_model.predict(samples)  # -1 = anomaly, 1 = normal
    anomaly_ratio = float(np.mean(predictions == -1))

    mean_interval = float(np.mean(filtered))
    std_interval = float(np.std(filtered))
    coefficient_of_variation = std_interval / mean_interval if mean_interval > 0 else 1.0

    is_uniform_and_fast = (
        coefficient_of_variation < _MAX_COEFFICIENT_OF_VARIATION and mean_interval < _MAX_MEAN_INTERVAL_MS
    )
    anomalous = anomaly_ratio > _ANOMALY_RATIO_THRESHOLD and is_uniform_and_fast

    return {"anomalous": anomalous, "anomaly_ratio": round(anomaly_ratio, 3)}