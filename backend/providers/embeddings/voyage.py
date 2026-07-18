import os
import voyageai

from providers.embeddings.base import EmbeddingProvider


class VoyageEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        self.client = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))

    def embed(self, text: str) -> list[float]:
        result = self.client.embed(
            texts=[text], model="voyage-4-lite", input_type="document"
        )
        return result.embeddings[0]

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        result = self.client.embed(
            texts=texts, model="voyage-4-lite", input_type="document"
        )
        return result.embeddings
