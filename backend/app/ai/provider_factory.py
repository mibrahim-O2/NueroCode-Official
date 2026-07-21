from functools import lru_cache

from app.config.settings import settings
from .base import AIProvider
from .openai_provider import OpenAIProvider


@lru_cache
def get_ai_provider() -> AIProvider:
    """Returns the configured AI provider instance.

    Controlled entirely by settings.AI_PROVIDER. To add Claude later:
    create app/ai/claude_provider.py implementing AIProvider, add one
    branch below, set AI_PROVIDER=anthropic. Nothing else changes.
    """
    provider = settings.AI_PROVIDER.lower()

    if provider == "openai":
        return OpenAIProvider()

    raise ValueError(f"Unsupported AI_PROVIDER: '{settings.AI_PROVIDER}'")