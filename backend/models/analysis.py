from typing import Optional
from pydantic import BaseModel


class WeakBullet(BaseModel):
    """A resume bullet flagged by heuristics as weak, plus why."""

    text: str
    reasons: list[str]


class ValidatedBulletRewrite(BaseModel):
    """An LLM-rewritten bullet after JSON validation and the hallucination guardrail."""

    original: str
    rewritten: str
    is_valid: bool
    invalid_terms: list[str] = []


class ScoreBreakdown(BaseModel):
    """The 40/40/20 match score and its inputs (PRD section 3)."""

    keyword_score: float
    similarity_score: float
    experience_score: float
    match_score: float
    required_years: Optional[float] = None
    candidate_years: float


class AnalysisResult(BaseModel):
    """Final aggregated result of a resume analysis."""

    raw_text: str
    bullets: list[str]
    char_count: int
    skills: list[str]
    matched_skills: list[str]
    missing_skills: list[str]
    score: ScoreBreakdown
    bullet_rewrites: list[ValidatedBulletRewrite]
