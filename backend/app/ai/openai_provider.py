from openai import OpenAI

from app.config.settings import settings
from .base import AIProvider


class OpenAIProvider(AIProvider):
    def __init__(self):
        self._client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self._model = settings.OPENAI_MODEL

    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=0.9,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content