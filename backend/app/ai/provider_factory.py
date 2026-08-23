from functools import lru_cache

from app.config.settings import settings
from .base import AIProvider
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider


@lru_cache
def _get_provider_instance(provider_name: str) -> AIProvider:
    if provider_name == "openai":
        return OpenAIProvider()
    if provider_name == "gemini":
        return GeminiProvider()
    raise ValueError(f"Unsupported AI provider: '{provider_name}'")


def get_ai_provider(provider_override: str | None = None) -> AIProvider:
    """Returns the configured AI provider instance.

    provider_override lets a single call request a SPECIFIC provider
    (e.g. an admin's real OpenAI comparison request) without changing the
    platform-wide default for anyone else. Omitted or None falls back to
    settings.AI_PROVIDER (now "gemini"). Each concrete provider is still
    only ever instantiated once and reused (lru_cache), regardless of how
    many requests ask for it.
    """
    provider_name = (provider_override or settings.AI_PROVIDER).lower()
    return _get_provider_instance(provider_name)