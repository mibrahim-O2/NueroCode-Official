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
        # max_output_tokens budget as the final answer. A first attempt at
        # a higher ceiling (4096) still wasn't enough for more conceptually
        # involved problems — real testing showed generation truncated
        # mid-answer, or consumed the entire budget on reasoning with no
        # JSON ever written. Raised further here, Gemini-specific only
        # (not touching the shared AIProvider contract or OpenAI's
        # behavior), to give harder problems enough room for both the
        # reasoning AND the full JSON answer to fit.
        effective_max_tokens = max(max_tokens * 8, 8192)

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