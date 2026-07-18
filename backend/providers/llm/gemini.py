import os
from typing import Iterator
from google import genai

from providers.llm.base import LLMProvider

DEFAULT_MODEL = "gemini-2.0-flash"


class GeminiProvider(LLMProvider):
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)

    def generate(self, prompt: str) -> str:
        response = self.client.models.generate_content(
            model=self.model, contents=prompt
        )
        return response.text or ""

    def stream(self, prompt: str) -> Iterator[str]:
        response = self.client.models.generate_content_stream(
            model=self.model, contents=prompt
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
