from pydantic import BaseModel


class ParsedResume(BaseModel):
    raw_text: str
    bullets: list[str]
    char_count: int


class ResumeParseError(BaseModel):
    error: str  # e.g. "unparseable_pdf" | "empty_content" | "file_too_large"
    message: str
