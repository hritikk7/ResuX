import asyncio
import json
from typing import AsyncIterator, Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

from services.resume_service import parse_resume
from models.resume import ResumeParseError
from models.analysis import AnalysisResult, ScoreBreakdown, ValidatedBulletRewrite
from providers.embeddings.voyage import VoyageEmbeddingProvider
from providers.llm import get_llm_provider
from services.similarity_service import cosine_similarity
from services.skills_service import extract_skills, match_skills, has_exact_match
from services.experience_service import (
    extract_required_years,
    extract_candidate_years,
    compute_experience_score,
)
from services.weak_bullet_service import select_weak_bullets
from services.prompt_builder import build_rewrite_prompt
from services.validator import validate_rewrite

load_dotenv()

app = FastAPI(title="Resume Analysis")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embedding_provider = VoyageEmbeddingProvider()

MAX_GENERATE_ATTEMPTS = 2  # initial attempt + one retry, per PRD section 6


@app.get("/health")
def health_check():
    return {"status": "healthy"}


def sse(event_type: str, payload) -> str:
    """Format one SSE message: a single JSON line carrying {type, payload}."""
    return f"data: {json.dumps({'type': event_type, 'payload': payload})}\n\n"


async def _rewrite_bullet(
    weak_bullet, job_description: str, resume_text: str, llm_provider
) -> Optional[ValidatedBulletRewrite]:
    """Generate + validate one bullet rewrite, retrying once on a malformed JSON response.

    A guardrail failure (is_valid=False) is returned as-is, not retried. Returns None
    only if generation itself keeps failing (provider error) after all attempts.
    """
    prompt = build_rewrite_prompt(weak_bullet, job_description)
    validated = None
    for _ in range(MAX_GENERATE_ATTEMPTS):
        try:
            raw = await asyncio.to_thread(llm_provider.generate, prompt)
        except Exception:
            continue
        validated = validate_rewrite(weak_bullet.text, raw, resume_text)
        if validated is not None:
            break
    return validated


async def analyze_stream(
    resume: UploadFile, job_description: str
) -> AsyncIterator[str]:
    """Orchestrate the full analysis: score path first, then the LLM bullet-rewrite path.

    All failure modes (bad file, empty JD, provider errors) are emitted as `error`
    events inside the stream rather than raised as HTTP errors, since the response
    has already started streaming a 200 (PRD section 10 — handle gracefully, no crash).
    """
    if not job_description.strip():
        yield sse(
            "error",
            {
                "error": "empty_job_description",
                "message": "Job description cannot be empty.",
            },
        )
        return

    yield sse("status", "Parsing Resume...")
    result = await parse_resume(resume)
    if isinstance(result, ResumeParseError):
        yield sse("error", {"error": result.error, "message": result.message})
        return

    yield sse("status", "Generating Embeddings...")
    skills = extract_skills(job_description)
    exact_matched = [s for s in skills if has_exact_match(s, result.raw_text)]
    needs_semantic_check = [s for s in skills if s not in exact_matched]

    # Batch all embedding calls into a single API request to stay within 3 RPM limits
    texts_to_embed = [result.raw_text, job_description] + needs_semantic_check
    try:
        embeddings = await asyncio.to_thread(
            embedding_provider.embed_batch, texts_to_embed
        )
    except Exception as e:
        yield sse("error", {"error": "embedding_provider_error", "message": str(e)})
        return

    resume_embedding = embeddings[0]
    jd_embedding = embeddings[1]
    skill_embeddings = embeddings[2:]

    similarity_score = cosine_similarity(resume_embedding, jd_embedding)

    yield sse("status", "Finding Missing Skills...")
    semantic_matched, missing_skills = match_skills(
        needs_semantic_check, skill_embeddings, resume_embedding
    )
    matched_skills = exact_matched + semantic_matched

    required_years = extract_required_years(job_description)
    candidate_years = extract_candidate_years(result.raw_text)
    experience_score = compute_experience_score(required_years, candidate_years)

    keyword_score = len(matched_skills) / len(skills) if skills else 1.0
    match_score = 0.4 * keyword_score + 0.4 * similarity_score + 0.2 * experience_score

    score = ScoreBreakdown(
        keyword_score=keyword_score,
        similarity_score=similarity_score,
        experience_score=experience_score,
        match_score=match_score,
        required_years=required_years,
        candidate_years=candidate_years,
    )

    yield sse(
        "result_partial",
        {
            "score": score.model_dump(),
            "skills": skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
        },
    )

    # --- LLM path: weak bullet selection -> rewrite -> validate ---
    weak_bullets = select_weak_bullets(result.bullets)
    bullet_rewrites: list[ValidatedBulletRewrite] = []

    if weak_bullets:
        llm_provider = None
        try:
            llm_provider = get_llm_provider()
        except Exception as e:
            yield sse("error", {"error": "llm_provider_unavailable", "message": str(e)})

        if llm_provider is not None:
            for i, weak_bullet in enumerate(weak_bullets, start=1):
                yield sse("status", f"Rewriting Bullet {i}...")
                validated = await _rewrite_bullet(
                    weak_bullet, job_description, result.raw_text, llm_provider
                )
                if validated is None:
                    yield sse(
                        "bullet_result",
                        {
                            "original": weak_bullet.text,
                            "rewritten": None,
                            "is_valid": False,
                            "error": "generation_failed",
                        },
                    )
                    continue
                bullet_rewrites.append(validated)
                yield sse("bullet_result", validated.model_dump())

    analysis_result = AnalysisResult(
        raw_text=result.raw_text,
        bullets=result.bullets,
        char_count=result.char_count,
        skills=skills,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        score=score,
        bullet_rewrites=bullet_rewrites,
    )
    yield sse("result_final", analysis_result.model_dump())
    yield sse("status", "Done")


@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...), job_description: str = Form(...)
):
    return StreamingResponse(
        analyze_stream(resume, job_description), media_type="text/event-stream"
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
