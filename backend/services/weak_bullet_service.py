import re
from data.action_verbs import ACTION_VERBS
from models.analysis import WeakBullet

MIN_WORD_COUNT = 6
DEFAULT_MAX_WEAK_BULLETS = 3

METRIC_PATTERN = re.compile(r"\d")
WORD_PATTERN = re.compile(r"[a-zA-Z']+")


def _has_metric(bullet: str) -> bool:
    return bool(METRIC_PATTERN.search(bullet))


def _has_action_verb(bullet: str) -> bool:
    words = WORD_PATTERN.findall(bullet)
    if not words:
        return False
    return words[0].lower() in ACTION_VERBS


def _is_too_short(bullet: str) -> bool:
    return len(WORD_PATTERN.findall(bullet)) < MIN_WORD_COUNT


def _weakness_reasons(bullet: str) -> list[str]:
    """Check a bullet against the four PRD weak-bullet signals, in order."""
    reasons = []
    if not _has_metric(bullet):
        reasons.append("no_metrics")
    if not _has_action_verb(bullet):
        reasons.append("no_action_verb")
    if _is_too_short(bullet):
        reasons.append("too_short")
    return reasons


def select_weak_bullets(
    bullets: list[str], max_bullets: int = DEFAULT_MAX_WEAK_BULLETS
) -> list[WeakBullet]:
    """Select the weakest 2-3 bullets by heuristic signal count (PRD section 4). No LLM call."""
    scored = []
    for bullet in bullets:
        reasons = _weakness_reasons(bullet)
        if reasons:
            scored.append((bullet, reasons))

    # Most failed signals first; shorter bullets first as a tiebreak.
    scored.sort(key=lambda item: (-len(item[1]), len(item[0])))

    return [
        WeakBullet(text=bullet, reasons=reasons)
        for bullet, reasons in scored[:max_bullets]
    ]
