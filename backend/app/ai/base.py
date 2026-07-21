from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Provider-agnostic interface for text generation.

    Any concrete provider (OpenAI, Anthropic/Claude, etc.) implements this.
    Swapping providers should require no changes outside app/ai/ and a
    single settings.AI_PROVIDER value.
    """

    @abstractmethod
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 1500) -> str:
        """Returns the raw text completion for the given prompts."""
        raise NotImplementedError