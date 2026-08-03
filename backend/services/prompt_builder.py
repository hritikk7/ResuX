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

    Instructions — follow in order:

    1. Read ONLY the Job Description above. List every distinct skill, tool,
       technology, or competency it requires, ignoring the Resume for now.

       Rule for compound requirements: if the JD lists multiple technologies
       joined by "or" as alternatives for one capability (e.g. "Kafka,
       Kinesis, or Pub/Sub"), treat this as ONE entry with a short
       canonical name (e.g. "Event-driven streaming systems"), not one
       per technology.

       CRITICAL: every entry must come from the Job Description text only.
       Never include something because it appears in the Resume.

       Format each skill as a short tag, 1-4 words, not a copied sentence
       fragment. Example — JD says "Experience with observability platforms
       such as Datadog, Splunk, Prometheus, Grafana, or ELK" → correct entry
       is "Observability platforms", not the full clause.

    2. Now read the Resume below and, using ONLY the fixed list from step 1
       (do not add, split, or reword any item), decide which are
       demonstrated and which are not.

    Resume:
    \"\"\"
    {resume_text}
    \"\"\"

    Output ONLY JSON matching the schema. No markdown, no commentary.
    {{
      "job_skills": ["short canonical tags extracted in step 1"],
      "match_skills": ["subset of job_skills found in the resume"],
      "missing_skills": ["subset of job_skills not found in the resume"]
    }}
    """


def build_cover_letter_prompt(resume_text: str, job_description: str) -> str:
    return f"""
    You are an expert career coach and professional writer. Write a tailored, persuasive, and professional cover letter for a candidate applying to a job. Use the candidate's Resume and the Job Description provided below.

    Job Description:
    \"\"\"
    {job_description}
    \"\"\"

    Candidate Resume:
    \"\"\"
    {resume_text}
    \"\"\"

    Instructions and Guidelines:
    1. Tone & Style: Write in a professional, confident, and engaging tone. Avoid generic clichés, overly formal filler (e.g., "I am writing to express my interest in..."), or robotic phrasing.
    2. Hook: Start with a strong, custom opening hook that immediately highlights the candidate's alignment with the role or company.
    3. Body Paragraphs:
       - Match the candidate's top 2-3 relevant accomplishments or skills from their resume to the core requirements of the job description.
       - Highlight concrete achievements and impact (using metrics or outcomes if available in the resume).
    4. Call to Action: End with a professional concluding statement expressing enthusiasm for the role and offering to discuss how their background fits the company's goals.
    5. Formatting: Use placeholders like [Date], [Hiring Manager's Name], [Company Name], and [Your Name] for any missing contact details or specific names. Keep the letter concise and structured (around 250-350 words).

    Output ONLY a valid JSON object matching this schema. Do not wrap in markdown fences (such as ```json), and do not include any commentary.
    {{
      "cover_letter": "The full text of the generated cover letter, using appropriate newline characters (\\n) for paragraph breaks."
    }}
    """
