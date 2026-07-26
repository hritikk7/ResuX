import logging
import os
from typing import Any, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

from models.analysis import AnalysisResult

load_dotenv()

logger = logging.getLogger(__name__)

TABLE = "analyses"

_client: Optional[Client] = None


def _get_client() -> Client:
    """Lazily build the Supabase client, so a missing key fails at call time.

    Building it at import time would take the whole API down on a config
    mistake, when only persistence is actually broken.
    """
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_PROJECT_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_PROJECT_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
                "to persist analyses."
            )
        _client = create_client(url, key)
    return _client


def save_analysis(
    user_id: str,
    job_description: str,
    resume_filename: Optional[str],
    result: AnalysisResult,
) -> str:
    """Insert one completed analysis and return its row id.

    Takes the domain object and does the column mapping here, so callers never
    build a dict of column names. Raises on failure — the caller decides whether
    that is fatal (for the orchestrator, it is not).
    """
    row = {
        "user_id": user_id,
        "job_description": job_description,
        "resume_filename": resume_filename,
        "score": result.score.model_dump(),
        "missing_skills": result.missing_skills,
        "matched_skills": result.matched_skills,
        "bullet_rewrites": [b.model_dump() for b in result.bullet_rewrites],
    }
    response = _get_client().table(TABLE).insert(row).execute()
    return response.data[0]["id"]


def get_analysis_by_id(user_id: str, analysis_id: str) -> Optional[dict[str, Any]]:
    """Return one analysis owned by this user, or None.

    Filters on user_id as well as id — deliberately, not defensively. RLS is off
    and this module holds the service role key, so that second `.eq` is the only
    thing stopping one user from reading another's analysis by id. The caller
    turns None into a 404 (never a 403, which would confirm the row exists).
    """
    response = (
        _get_client()
        .table(TABLE)
        .select(
            "id, resume_filename, job_description, score, "
            "matched_skills, missing_skills, bullet_rewrites, created_at"
        )
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def get_analyses_for_user(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    """Return a user's past analyses, newest first.

    `job_description` is excluded — a history list only needs enough to render a
    row, and JDs are long enough to dominate the payload.
    """
    response = (
        _get_client()
        .table(TABLE)
        .select("id, resume_filename, score, matched_skills, missing_skills, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data
