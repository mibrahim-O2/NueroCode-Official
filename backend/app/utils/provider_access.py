from fastapi import HTTPException

VALID_PROVIDERS = {"gemini", "openai", "claude"}


def validate_provider_request(current_user: dict, provider: str | None) -> None:
    """Shared authorization check for AI provider overrides on generation
    endpoints (problems and assessments both call this).

    This is the REAL security boundary — independent of the frontend's
    passcode-entry UI ceremony. No request, however it was constructed,
    can get real OpenAI generation without the requesting user's own JWT
    already carrying role='admin'. The passcode prompt in the UI is a
    deliberate friction/demo step for the admin's own workflow, not a
    substitute for this check.
    """
    if not provider or provider == "gemini":
        return
    if provider == "claude":
        raise HTTPException(status_code=501, detail="Claude support is not yet available.")
    if provider == "openai":
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only administrators may switch AI providers.")
        return
    raise HTTPException(status_code=400, detail=f"Unknown provider: '{provider}'")