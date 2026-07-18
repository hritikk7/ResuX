import json
from typing import Optional
import spacy

from pydantic import ValidationError
from data.action_verbs import ACTION_VERBS
from models.llm import BulletRewrite
from models.analysis import ValidatedBulletRewrite

_nlp = None
_action_verb_lemmas = None


def _get_nlp():
    """Lazy-loaded, cached spaCy pipeline (loaded once, mirrors the embedding-provider singleton)."""
    global _nlp
    if _nlp is None:
        _nlp = spacy.load("en_core_web_sm")
    return _nlp


def content_lemmas(text: str) -> set[str]:
    """Lowercased lemmas of the alphabetic, non-stopword tokens in text."""
    doc = _get_nlp()(text)
    return {tok.lemma_.lower() for tok in doc if tok.is_alpha and not tok.is_stop}


def _get_action_verb_lemmas() -> set[str]:
    """Lemmas of the known-safe action verb list (data/action_verbs.py), cached.

    The LLM is allowed to swap in a stronger verb from this list even if it doesn't
    appear verbatim in the original bullet — that's the whole point of a rewrite.
    Anything outside this list (a noun, tech term, or invented detail) still counts
    as new content for the guardrail.
    """
    global _action_verb_lemmas
    if _action_verb_lemmas is None:
        # Lemmatize each verb on its own, not joined into one string — a shared
        # sentence context lets spaCy's statistical tagger mistag some entries
        # (e.g. as an adjective instead of a verb), which silently changes their
        # lemma and makes the whitelist depend on set iteration order.
        lemmas = set()
        for doc in _get_nlp().pipe(ACTION_VERBS):
            lemmas.update(tok.lemma_.lower() for tok in doc if tok.is_alpha)
        _action_verb_lemmas = lemmas
    return _action_verb_lemmas


def parse_bullet_rewrite(raw: str) -> Optional[BulletRewrite]:
    """Parse + schema-validate the LLM's raw JSON response. Returns None on any failure."""
    try:
        data = json.loads(raw)
        return BulletRewrite.model_validate(data)
    except (json.JSONDecodeError, ValidationError, TypeError):
        return None


def check_guardrail(rewritten: str, resume_text: str) -> list[str]:
    """Return the content words in `rewritten` absent from `resume_text` (PRD section 5).

    An empty list means the rewrite introduced nothing new — it passes the guardrail.
    A swapped-in action verb from the known-safe list (data/action_verbs.py) doesn't count.
    """
    introduced = (
        content_lemmas(rewritten) - content_lemmas(resume_text) - _get_action_verb_lemmas()
    )
    return sorted(introduced)


def validate_rewrite(
    original: str, raw_llm_response: str, resume_text: str
) -> Optional[ValidatedBulletRewrite]:
    """Validate one LLM rewrite: JSON/schema check, then the hallucination guardrail.

    Returns None if the raw response isn't valid JSON matching BulletRewrite (the
    orchestrator should retry once on None). A guardrail failure is NOT retried — it
    comes back as a ValidatedBulletRewrite with is_valid=False.
    """
    parsed = parse_bullet_rewrite(raw_llm_response)
    if parsed is None:
        return None

    invalid_terms = check_guardrail(parsed.rewritten, resume_text)
    return ValidatedBulletRewrite(
        original=original,
        rewritten=parsed.rewritten,
        is_valid=len(invalid_terms) == 0,
        invalid_terms=invalid_terms,
    )
