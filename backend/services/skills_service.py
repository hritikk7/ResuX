import re
from data.skills import SKILL_DICTIONARY
from services.similarity_service import cosine_similarity


def _alias_in_text(aliases: list[str], text: str) -> bool:
    """Helper to check if any of the aliases exist in text as a whole word/phrase."""
    for alias in aliases:
        prefix = r"(?<!\w)" if re.match(r"^\w", alias) else ""
        suffix = r"(?!\w)"
        pattern = prefix + re.escape(alias) + suffix
        if re.search(pattern, text):
            return True
    return False


def extract_skills(text: str) -> list[str]:
    """Extract canonical skill names from text based on aliases in SKILL_DICTIONARY."""
    text = text.lower()
    found = []
    for canonical, aliases in SKILL_DICTIONARY.items():
        if _alias_in_text(aliases, text):
            found.append(canonical)
    return found


def has_exact_match(skill: str, text: str) -> bool:
    """Check if a canonical skill has an exact match in the text."""
    aliases = SKILL_DICTIONARY.get(skill, [])
    return _alias_in_text(aliases, text.lower())


def match_skills(
    skills: list[str],
    skill_embeddings: list[list[float]],
    resume_embedding: list[float],
    threshold: float = 0.4,
) -> tuple[list[str], list[str]]:
    """Determine matched and missing skills by comparing pre-computed embeddings."""
    matched_skills, missing_skills = [], []
    for skill, skill_embedding in zip(skills, skill_embeddings):
        similarity = cosine_similarity(resume_embedding, skill_embedding)
        (matched_skills if similarity >= threshold else missing_skills).append(skill)
    return matched_skills, missing_skills
