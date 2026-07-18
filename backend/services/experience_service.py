import re
from datetime import datetime
from typing import Optional

REQUIRED_YEARS_PATTERNS = [
    re.compile(r"(\d+)\s*-\s*\d+\s*years?", re.IGNORECASE),
    re.compile(r"(\d+)\s*\+\s*years?", re.IGNORECASE),
    re.compile(r"(?:at least|minimum(?:\s*of)?)\s*(\d+)\s*years?", re.IGNORECASE),
    re.compile(r"(\d+)\s*years?(?:\s*of)?\s*experience", re.IGNORECASE),
]

EXPLICIT_CANDIDATE_YEARS_PATTERN = re.compile(
    r"(\d+)\+?\s*years?\s*(?:of\s*)?experience", re.IGNORECASE
)
YEAR_PATTERN = re.compile(r"\b(19\d{2}|20\d{2})\b")
PRESENT_PATTERN = re.compile(r"\b(present|current)\b", re.IGNORECASE)


def extract_required_years(job_description: str) -> Optional[float]:
    """Extract the minimum years of experience required by a JD, via simple regex heuristics."""
    for pattern in REQUIRED_YEARS_PATTERNS:
        match = pattern.search(job_description)
        if match:
            return float(match.group(1))
    return None


def extract_candidate_years(resume_text: str) -> float:
    """Estimate a candidate's years of experience: an explicit mention, else the span of dates found."""
    match = EXPLICIT_CANDIDATE_YEARS_PATTERN.search(resume_text)
    if match:
        return float(match.group(1))

    years = [int(y) for y in YEAR_PATTERN.findall(resume_text)]
    if PRESENT_PATTERN.search(resume_text):
        years.append(datetime.now().year)

    if len(years) < 2:
        return 0.0
    return float(max(years) - min(years))


def compute_experience_score(
    required_years: Optional[float], candidate_years: float
) -> float:
    """Score how well candidate experience meets the JD requirement, in [0, 1]."""
    if required_years is None:
        return 1.0
    if candidate_years >= required_years:
        return 1.0
    if required_years <= 0:
        return 1.0
    return max(0.0, candidate_years / required_years)
