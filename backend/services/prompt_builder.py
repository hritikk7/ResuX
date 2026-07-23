from models.analysis import WeakBullet

WEAKNESS_LABELS = {
    "no_metrics": "has no numbers or metrics",
    "no_action_verb": "does not open with a strong action verb",
    "no_tech_mentioned": "does not name a specific technology or tool",
    "too_short": "is too short / lacks detail",
}


def build_rewrite_prompt(weak_bullet: WeakBullet, job_description: str) -> str:
    """Build the LLM prompt for rewriting one weak resume bullet (PRD section 6).

    Effort goes into the output schema, not persona framing.
    """
    reasons = ", ".join(
        WEAKNESS_LABELS.get(reason, reason) for reason in weak_bullet.reasons
    )

    return f"""Rewrite the following resume bullet so it is stronger for the job \
description below. The bullet currently {reasons}.

Job description:
\"\"\"
{job_description}
\"\"\"

Original bullet:
\"\"\"
{weak_bullet.text}
\"\"\"

Rules:
- Do not invent or imply any technology, tool, metric, or achievement that is not \
already present in the original bullet.
- You may rephrase, add a stronger action verb, and tighten the wording.
- Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{{"rewritten": "<the rewritten bullet text>"}}
"""


def build_skill_matching_prompt(resume_text: str, job_description: str):
    return f"""
    Job Description:
    \"\"\"
    {job_description}
    \"\"\"
    Resume:
    \"\"\"
    {resume_text}
    \"\"\"
    Instructions:
    1. Identify all key technical skills, tools, frameworks, concepts, and soft skills required in the Job Description.
    2. Determine which of those identified job skills are present or demonstrated in the Resume.
    3. Determine which of those identified job skills are missing from the Resume.
    Rules:
    - Ensure every skill in `match_skills` and `missing_skills` is present in `job_skills`.
    - Do not make assumptions; if a skill is not clearly mentioned or demonstrated in the resume, classify it as missing.
    - Respond with ONLY valid JSON. Do not include markdown formatting (like ```json), code blocks, or any introductory/concluding text.
    Output Schema:
    {{
      "job_skills": ["list", "of", "all", "extracted", "job", "skills"],
      "match_skills": ["list", "of", "skills", "found", "in", "resume"],
      "missing_skills": ["list", "of", "skills", "not", "found", "in", "resume"]
    }}
    """
