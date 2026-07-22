"""Client for the self-hosted Piston code execution API.

This module is the ONLY place that knows about Piston's actual language
identifiers and pinned runtime versions. Callers (execution_service.py)
work exclusively in NeuroCode's internal language names ("python",
"javascript", "cpp") and never see Piston-specific naming — that mapping
is intentionally not exposed outside this file.
"""

import httpx

from app.config.settings import settings


class PistonExecutionError(Exception):
    """Raised when Piston can't be reached or rejects a request outright.

    This is distinct from the submitted code failing to compile or run —
    that's a normal graded outcome, not an exception. This is reserved for
    infrastructure-level failures: unsupported language, network failure,
    or Piston returning a top-level error instead of a run result.
    """


# Internal language name -> Piston's canonical `language` value + pinned
# runtime version. Piston's /api/v2/runtimes lists "aliases" (e.g. "cpp" is
# an alias of "c++"), but aliases are only guaranteed to resolve for
# informational lookups — /execute requires the canonical name. If your
# Piston instance has different runtime versions installed, check
# GET /api/v2/runtimes and update the versions below to match.
LANGUAGE_CONFIG = {
    "python": {
        "piston_language": "python",
        "version": "3.12.0",
    },
    "javascript": {
        "piston_language": "javascript",
        "version": "20.11.1",
    },
    "cpp": {
        "piston_language": "c++",
        "version": "10.2.0",
    },
}


def execute_code(language: str, source_code: str, stdin: str = "") -> dict:
    """Executes source code via Piston and returns its raw JSON response.

    `language` is NeuroCode's internal name (e.g. "cpp") — this function
    translates it to Piston's canonical name before sending the request.
    Raises PistonExecutionError for unsupported languages, unreachable
    Piston instances, or a top-level error response from Piston itself.
    """
    config = LANGUAGE_CONFIG.get(language)
    if config is None:
        raise PistonExecutionError(f"Unsupported language: '{language}'")

    payload = {
        "language": config["piston_language"],
        "version": config["version"],
        "files": [{"content": source_code}],
        "stdin": stdin,
    }

    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(f"{settings.PISTON_API}/execute", json=payload)
            response.raise_for_status()
            result = response.json()
    except httpx.TimeoutException as exc:
        raise PistonExecutionError("Piston execution timed out") from exc
    except httpx.ConnectError as exc:
        raise PistonExecutionError(
            "Could not reach the Piston execution service — is it running?"
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise PistonExecutionError(f"Piston returned an error: {exc.response.text}") from exc

    if "message" in result and "run" not in result:
        # Piston's own top-level error shape (e.g. unknown language/version),
        # as opposed to a normal compile/run result.
        raise PistonExecutionError(f"Piston rejected the request: {result['message']}")

    return result