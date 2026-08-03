import asyncio
import json
from typing import Optional
import logging

from pydantic import ValidationError

from models.llm import CoverLetterLLMOutput
from services.prompt_builder import build_cover_letter_prompt

logger = logging.getLogger(__name__)

MAX_GENERATE_ATTEMPTS = 2  # initial attempt + one retry, per PRD section 6


async def generate_cover_letter(
    resume_text: str, job_description: str, llm_provider
) -> Optional[CoverLetterLLMOutput]:
    prompt = build_cover_letter_prompt(resume_text, job_description)
    for _ in range(MAX_GENERATE_ATTEMPTS):
        try:
            raw = await asyncio.to_thread(llm_provider.generate, prompt)
        except Exception:
            continue
        try:
            data = json.loads(raw.strip())
            logger.info("cover letter data: %s", data)
            return CoverLetterLLMOutput(**data)
        except (json.JSONDecodeError, ValidationError, TypeError):
            continue
    return None
