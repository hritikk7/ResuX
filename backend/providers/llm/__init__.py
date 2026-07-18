import os

from providers.llm.base import LLMProvider

_PROVIDERS = {
    "groq": "providers.llm.groq.GroqProvider",
    "gemini": "providers.llm.gemini.GeminiProvider",
    "openrouter": "providers.llm.openrouter.OpenRouterProvider",
}


def get_llm_provider(name: str = None) -> LLMProvider:
    """Factory: build the LLMProvider configured via LLM_PROVIDER (or the given name)."""
    name = (name or os.getenv("LLM_PROVIDER", "groq")).lower()
    if name not in _PROVIDERS:
        raise ValueError(
            f"Unknown LLM_PROVIDER '{name}'. Expected one of: {', '.join(_PROVIDERS)}"
        )

    module_path, class_name = _PROVIDERS[name].rsplit(".", 1)
    module = __import__(module_path, fromlist=[class_name])
    provider_class = getattr(module, class_name)
    return provider_class()
