import google.generativeai as genai

from app.config.settings import settings
from .base import AIProvider


class GeminiProvider(AIProvider):
    def __init__(self):
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
        # max_output_tokens budget as the final answer, so a caller-supplied
        # budget sized only for the answer (e.g. 1500, sized for OpenAI)
        # gets entirely consumed by reasoning before any JSON is written —
        # this is what was producing truncated mid-thought fragments
        # instead of a JSON response. Boosting the effective ceiling here
        # (Gemini-specific, not touching the shared AIProvider contract or
        # OpenAI's behavior at all) gives reasoning room to complete before
        # the final answer still needs to fit.
        effective_max_tokens = max(max_tokens * 4, 4096)

        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=effective_max_tokens,
                temperature=0.9,
                # Constrains the model's FINAL output format at the API
                # level (Google's "controlled generation" feature), rather
                # than relying on prompt instructions alone to produce
                # clean JSON with no reasoning text mixed in.
                response_mime_type="application/json",
            ),
        )
        return response.text