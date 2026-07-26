import asyncio
import json
import uuid
from typing import AsyncIterator, Optional

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

from services.resume_service import parse_resume
from models.resume import ResumeParseError
from models.analysis import AnalysisResult, ScoreBreakdown, ValidatedBulletRewrite
from providers.embeddings.voyage import VoyageEmbeddingProvider
from providers.llm import get_llm_provider
from services.similarity_service import cosine_similarity
from services.skills_service import match_skills_with_llm
from api.deps import get_current_user
from db.analyses_repository import (
    get_analyses_for_user,
    get_analysis_by_id,
    save_analysis,
)
from services.experience_service import (
    extract_required_years,
    extract_candidate_years,
    compute_experience_score,
)
from services.weak_bullet_service import select_weak_bullets
from services.prompt_builder import build_rewrite_prompt
from services.validator import validate_rewrite
import logging

load_dotenv()

app = FastAPI(title="Resume Analysis")

# Configure the global logging settings
logging.basicConfig(
    level=logging.INFO,  # Use logging.DEBUG to see detailed debug logs
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()],  # Output to the console/stdout
)

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


async def _match_skills(
    result, job_description: str
) -> tuple[list[str], list[str], list[str], str]:
    """Run skill matching via the LLM. Returns (skills, matched, missing, status).

    `status` is "ok" or "failed" — the caller (analyze_stream) uses it to yield its
    own status/error events and to decide how the score degrades (Option B): a
    failure must be distinguishable from "the JD genuinely has zero skills", so this
    never yields SSE events itself and never fakes an empty-but-successful result.
    """
    try:
        llm_provider = get_llm_provider()
    except Exception:
        return [], [], [], "failed"

    skill_match = await match_skills_with_llm(
        result.raw_text, job_description, llm_provider
    )
    if skill_match is None:
        return [], [], [], "failed"

    return (
        skill_match.job_skills,
        skill_match.match_skills,
        skill_match.missing_skills,
        "ok",
    )


async def _rewrite_bullet(
    weak_bullet, job_description: str, resume_text: str, llm_provider
) -> Optional[ValidatedBulletRewrite]:
    """Generate + validate one bullet rewrite, retrying once on a malformed JSON response.

    A guardrail failure (is_valid=False) is returned as-is, not retried. Returns None
    only if generation itself keeps failing (provider error) after all attempts.
    """
    # prompt = build_rewrite_prompt(weak_bullet, job_description)
    # validated = None
    # for _ in range(MAX_GENERATE_ATTEMPTS):
    #     try:
    #         raw = await asyncio.to_thread(llm_provider.generate, prompt)
    #     except Exception:
    #         continue
    #     validated = validate_rewrite(weak_bullet.text, raw, resume_text)
    #     if validated is not None:
    #         break
    # return validated
    return ValidatedBulletRewrite(
        original=weak_bullet.text,
        rewritten=f"[MOCK REWRITE] Improved: {weak_bullet.text} with simulated metrics.",
        is_valid=True,
        invalid_terms=[],
    )


async def analyze_stream(
    resume: UploadFile, job_description: str, user_id: Optional[str] = None
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
    try:
        embeddings = await asyncio.to_thread(
            embedding_provider.embed_batch, [result.raw_text, job_description]
        )
    except Exception as e:
        yield sse("error", {"error": "embedding_provider_error", "message": str(e)})
        return

    resume_embedding = embeddings[0]
    jd_embedding = embeddings[1]

    similarity_score = cosine_similarity(resume_embedding, jd_embedding)

    yield sse("status", "Matching Skills...")
    skills, matched_skills, missing_skills, skill_status = await _match_skills(
        result, job_description
    )
    if skill_status == "failed":
        yield sse("status", "Skill matching unavailable, continuing without it...")

    # Interim stopgap: a failed match falls back to 0.0 rather than the old `1.0`
    # (empty `skills` list read as "nothing required, perfect score") — rewarding
    # a failure was wrong. This is still not the real fix (task #6): keyword_score
    # and match_score should become nullable so a failed match is visibly flagged
    # in result_partial instead of silently folded into a fabricated number.
    keyword_score = (
        len(matched_skills) / len(skills)
        if skills
        else (1.0 if skill_status == "ok" else 0.0)
    )
    required_years = extract_required_years(job_description)
    candidate_years = extract_candidate_years(result.raw_text)
    experience_score = compute_experience_score(required_years, candidate_years)

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

    # Persist BEFORE yielding result_final, not after. Code following a `yield`
    # in an async generator only runs if the ASGI server pulls the next item —
    # if the client has disconnected it closes the generator instead, and the
    # write silently never happens. Which is exactly the case we most want saved:
    # a long analysis the user navigated away from. The cost is the round trip's
    # latency on the final event, which is noise next to the LLM calls above.
    persisted = False
    if user_id is not None:
        try:
            await asyncio.to_thread(
                save_analysis,
                user_id,
                job_description,
                resume.filename,
                analysis_result,
            )
            persisted = True
        except Exception:
            # Never fatal (PRD V2 success criteria): the result is complete and
            # already paid for, so a DB failure must not throw it away.
            logging.exception("Failed to persist analysis for user %s", user_id)

    final_payload = analysis_result.model_dump()
    final_payload["persisted"] = persisted
    yield sse("result_final", final_payload)
    yield sse("status", "Done")


@app.post("/analyze")
async def analyze_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    user_id: str = Depends(get_current_user),
):
    return StreamingResponse(
        analyze_stream(resume, job_description, user_id=user_id),
        media_type="text/event-stream",
    )


@app.get("/analyses")
async def list_analyses(user_id: str = Depends(get_current_user)):
    """History: the authenticated user's past analyses, newest first."""
    try:
        return await asyncio.to_thread(get_analyses_for_user, user_id)
    except Exception:
        logging.exception("Failed to list analyses for user %s", user_id)
        raise HTTPException(status_code=503, detail="Could not load analysis history")


@app.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str, user_id: str = Depends(get_current_user)):
    """One saved analysis, if it belongs to the caller.

    A row that exists but belongs to someone else is reported as 404, not 403 —
    a 403 would confirm the id is real, which is exactly what an attacker probing
    ids wants to learn.
    """
    try:
        # Postgres raises on malformed uuid input, which would surface as a 503
        # for what is really "no such analysis" — and would make a genuine DB
        # outage indistinguishable from a bad URL. Reject the shape first.
        uuid.UUID(analysis_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Analysis not found")

    try:
        row = await asyncio.to_thread(get_analysis_by_id, user_id, analysis_id)
    except Exception:
        logging.exception("Failed to load analysis %s for user %s", analysis_id, user_id)
        raise HTTPException(status_code=503, detail="Could not load analysis")

    if row is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return row


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
