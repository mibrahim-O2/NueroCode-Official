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
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.9,
            ),
        )
        return response.text