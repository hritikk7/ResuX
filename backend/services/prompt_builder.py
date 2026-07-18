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
