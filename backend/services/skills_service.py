import asyncio
import json
from typing import Optional
import logging

from pydantic import ValidationError

from models.llm import SkillMatchLLMOutput
from services.prompt_builder import build_skill_matching_prompt

logger = logging.getLogger(__name__)

MAX_GENERATE_ATTEMPTS = 2  # initial attempt + one retry, per PRD section 6


async def match_skills_with_llm(
    resume_text: str, job_description: str, llm_provider
) -> Optional[SkillMatchLLMOutput]:
    """Generate + validate the skill match, retrying once on a malformed response."""
    prompt = build_skill_matching_prompt(resume_text, job_description)
    for _ in range(MAX_GENERATE_ATTEMPTS):
        try:
            raw = await asyncio.to_thread(llm_provider.generate, prompt)
        except Exception:
            continue
        try:
            data = json.loads(raw.strip())
            logger.info("skill data: %s", data)
            return SkillMatchLLMOutput(**data)
        except (json.JSONDecodeError, ValidationError, TypeError):
            continue
    return None
