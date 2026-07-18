from pydantic import BaseModel


class BulletRewrite(BaseModel):
    """Raw, schema-validated shape of the LLM's JSON response for one bullet rewrite."""

    rewritten: str
