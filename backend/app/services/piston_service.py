import httpx

from app.config.settings import settings

# Versions must match the runtimes installed in Piston.
LANGUAGE_VERSIONS = {
    "python": "3.12.0",
    "javascript": "20.11.1",
    "cpp": "10.2.0",
}


def execute_code(language: str, source_code: str, stdin: str = "") -> dict:
    """
    Execute source code through the local Piston API.

    Phase 7 uses this only to validate AI-generated canonical solutions.
    The full Monaco editor execution workflow is implemented in Phase 8.
    """

    version = LANGUAGE_VERSIONS.get(language)

    if version is None:
        raise ValueError(f"Unsupported language: {language}")

    payload = {
        "language": language,
        "version": version,
        "files": [
            {
                "content": source_code
            }
        ],
        "stdin": stdin,
    }

    endpoint = settings.PISTON_API.rstrip("/") + "/execute"

    with httpx.Client(timeout=30.0) as client:
        response = client.post(endpoint, json=payload)
        response.raise_for_status()
        return response.json()