import asyncio
import json
from typing import Optional

from pydantic import ValidationError

from models.llm import SkillMatchLLMOutput
from services.prompt_builder import build_skill_matching_prompt

MAX_GENERATE_ATTEMPTS = 2  # initial attempt + one retry, per PRD section 6


async def match_skills_with_llm(
    resume_text: str, job_description: str, llm_provider
) -> Optional[SkillMatchLLMOutput]:
    """Generate + validate the skill match, retrying once on a malformed response.

    Mirrors main.py's _rewrite_bullet: returns None if generation/parsing keeps
    failing after all attempts, rather than a fake empty-but-successful result —
    the caller needs to be able to tell "genuinely zero skills" apart from
    "matching failed" (Option B degraded-result handling).
    """
    prompt = build_skill_matching_prompt(resume_text, job_description)
    for _ in range(MAX_GENERATE_ATTEMPTS):
        try:
            raw = await asyncio.to_thread(llm_provider.generate, prompt)
        except Exception:
            continue
        try:
            data = json.loads(raw.strip())
            return SkillMatchLLMOutput(**data)
        except (json.JSONDecodeError, ValidationError, TypeError):
            continue
    return None
