import re
from fastapi import UploadFile
from pypdf import PdfReader
from models.resume import ParsedResume, ResumeParseError
from io import BytesIO
from typing import Union

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB, per PRD
MIN_TEXT_LENGTH = 500


def normalize_whitespace(text: str) -> str:
    # 1. Normalize line endings (\r\n, \r) to \n
    text = re.sub(r"\r\n?", "\n", text)
    # 2. Collapse repeated spaces/tabs within a line to a single space
    text = re.sub(r"[ \t]+", " ", text)
    # 3. Collapse 3+ consecutive blank lines down to a single blank line (\n\n)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # 4. Strip leading and trailing whitespace
    return text.strip()


BULLET_PATTERN = re.compile(r"^\s*[-•*●▪○]\s*(.+)")


def extract_bullets(text: str) -> list[str]:
    bullets = []
    for line in text.split("\n"):
        match = BULLET_PATTERN.match(line)
        if match:
            bullets.append(match.group(1).strip())
    return bullets


async def parse_resume(
    file: UploadFile, chunk_size: int = 8192
) -> Union[ParsedResume, ResumeParseError]:
    """Parse a PDF, extracting text and candidate bullets."""
    content = b""
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        content += chunk
        if len(content) > MAX_FILE_SIZE:
            return ResumeParseError(
                error="file_too_large", message="File size exceeds 5 MB limit"
            )
    # check file type :
    file_name = (file.filename or "").lower()

    is_pdf = (file_name.lower() or "").endswith(".pdf")
    is_text = file_name.lower().endswith(".txt")
    if not is_pdf and not is_text:
        return ResumeParseError(
            error="unsupported_file_type",
            message="Unsupported file type. Please upload a PDF or TXT file.",
        )

    if is_pdf:
        try:
            reader = PdfReader(BytesIO(content))
            raw_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            return ResumeParseError(
                error="unparseable_pdf", message="Failed to parse PDF."
            )
    else:  # txt file
        try:
            raw_text = content.decode("utf-8")
        except Exception:
            return ResumeParseError(
                error="unparseable_txt",
                message="Could not decode file as UTF-8 text.",
            )
    raw_text = normalize_whitespace(raw_text)

    if len(raw_text) < MIN_TEXT_LENGTH:
        return ResumeParseError(
            error="empty_or_minimal_text",
            message=f"Extracted text is too short ({len(raw_text)} chars). Ensure the PDF contains text and is not scanned/image-based.",
        )
    bullets = extract_bullets(raw_text)
    # Return the successfully parsed resume
    return ParsedResume(raw_text=raw_text, bullets=bullets, char_count=len(raw_text))
