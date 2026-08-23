import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

from app.config.settings import settings
from .base import AIProvider


class GeminiQuotaExceededError(Exception):
    """Raised when Gemini's free-tier daily/per-minute request quota is
    hit. Retrying immediately never helps here (the quota is exhausted,
    not a transient glitch), so this is deliberately NOT retried like a
    normal generation failure — it fails fast and reports clearly instead
    of wasting the retry attempts against a limit that's already used up.
    """


class GeminiConfigurationError(Exception):
    """Raised when GEMINI_API_KEY is missing/empty, so the failure is
    immediate and clearly diagnosed — rather than letting Google's SDK
    silently fall through to Application Default Credentials discovery
    (a completely different, Cloud-SDK-based auth path) and fail with a
    confusing, unrelated-looking stack trace.
    """


class GeminiProvider(AIProvider):
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise GeminiConfigurationError(
                "GEMINI_API_KEY is not set (or failed to load from .env). "
                "Check backend/.env for a GEMINI_API_KEY=... line with no "
                "quotes, no spaces around '=', and no '#' characters in the value."
            )
        genai.configure(api_key=settings.GEMINI_API_KEY)

    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> str:
        # Gemini's SDK attaches a system instruction at model-construction
        # time rather than as a per-call message role (unlike OpenAI's chat
        # format), so a lightweight model handle is built fresh per call —
        # this does not make a network request on its own.
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=system_prompt,
        )

        # Gemini 3 models have mandatory internal "thinking" that cannot be
        # disabled (confirmed via Google's own docs — unlike Gemini 2.5,
        # there is no reasoning_effort="none" / thinking_budget=0 escape
        # hatch for Gemini 3). Thinking tokens are drawn from the SAME
        # max_output_tokens budget as the final answer. Testing on harder,
        # more reasoning-heavy problems showed even 4096 wasn't always
        # enough — raised further here, Gemini-specific only (not touching
        # the shared AIProvider contract or OpenAI's behavior).
        effective_max_tokens = max(max_tokens * 8, 8192)

        try:
            response = model.generate_content(
                user_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=effective_max_tokens,
                    temperature=0.9,
                    # Constrains the model's FINAL output format at the API
                    # level (Google's "controlled generation" feature),
                    # rather than relying on prompt instructions alone to
                    # produce clean JSON with no reasoning text mixed in.
                    response_mime_type="application/json",
                ),
            )
        except ResourceExhausted as exc:
            raise GeminiQuotaExceededError(
                "Gemini's free daily request limit has been reached for this model. "
                "Try again in a few minutes, or switch to another provider."
            ) from exc

        return response.text