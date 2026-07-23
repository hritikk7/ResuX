from pydantic import BaseModel


class BulletRewrite(BaseModel):
    """Raw, schema-validated shape of the LLM's JSON response for one bullet rewrite."""

    rewritten: str


class SkillMatchLLMOutput(BaseModel):
    job_skills: list[str]
    missing_skills: list[str]
    match_skills: list[str]
