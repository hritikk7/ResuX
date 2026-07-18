# Resume Analyzer — PRD

## Amendments

- **2026-07-17 — Embedding provider migration.** Replaced local `sentence-transformers`
  (`all-MiniLM-L6-v2`) with the **Voyage AI Embeddings API** (managed, long-context) for both
  the Similarity Service and the Skill Service's semantic-match step. Reason: MiniLM's short
  context window risks silent truncation on full-length resumes/JDs; a managed long-context
  provider avoids that without adding chunking logic, and keeps the deployed app lightweight
  (no multi-GB model bundled/served locally). Embedding generation is now delegated to an
  `EmbeddingProvider` abstraction, mirroring the existing `LLMProvider` pattern (one `Protocol`,
  thin implementation — not a new class of abstraction). Embedding *scope* is unchanged: whole
  resume, whole JD, no per-sentence/per-bullet embedding.

## Overview

Resume Analyzer compares a resume against a job description and produces a concrete gap
analysis: a match score, missing skills, and rewritten versions of weak resume bullets —
streamed to the screen as it's generated.

This is a portfolio project. The goal is to demonstrate solid engineering and AI application
design — clean service boundaries, structured LLM output, streaming UX, provider abstraction —
not to build the most sophisticated resume analyzer possible. Every decision below is made to
keep scope tight. If you're ever unsure whether to add something, check it against the Out of
Scope list before building it.

## Problem

Tailoring a resume to a specific job is tedious and mostly guesswork. Resume Analyzer turns
that into a fast, structured feedback loop: what matches, what's missing, and how to fix it.

## Users

- Job seekers tailoring a resume for a specific role before applying
- Anyone who wants a quick, explainable "how well do I match this JD" signal

## Tech Stack

| Component | Choice |
|---|---|
| Frontend | Next.js |
| Backend | FastAPI |
| Embeddings | Voyage AI Embeddings API (managed, long-context) |
| Similarity | Cosine similarity |
| Skill extraction | Regex + spaCy + a static skill dictionary |
| LLM | Gemini, Groq, OpenRouter — behind one common interface |
| Validation | Pydantic |
| Streaming | Server-Sent Events (SSE), status-event based |
| PDF parsing | `pypdf` |
| Storage | None — in-memory only |

No further comparison shopping on any of these. They're fixed.

## Architecture

Small, single-responsibility services, not one large endpoint:

```
Resume Parser
    ↓
Embedding Service
    ↓
Similarity Service
    ↓
Skill Extractor
    ↓
Prompt Builder
    ↓
LLM Provider
    ↓
Validator
    ↓
SSE Stream
```

## Core Features & Design Decisions

### 1. Resume Parsing
Extract plain text only, normalize whitespace. Support text-based PDFs and plain text only —
no layout preservation, no tables/images/columns. If extraction fails or yields near-empty
text, return an error asking for a text-based PDF. Max file size 5 MB.

### 2. Skill Extraction
Fixed pipeline — no ontology-building, no multi-call LLM extraction:

```
JD → Regex / spaCy → Normalize → Match against static skill dictionary
```

Embeddings are used only afterward, for semantic (not exact-string) matching between extracted
skills and resume content — generated via the Voyage AI `EmbeddingProvider` (see section 8a).

### 3. Match Score
Fixed, explainable formula:

```
40% Keyword Match
40% Semantic Similarity (cosine, whole resume vs. whole JD)
20% Experience Match (years/seniority signal extracted via simple heuristics)
```

Labeled in the UI as **"Semantic Match Score"** — never "Hiring Probability" or ATS simulation.
This tool does not claim to replicate Workday, Greenhouse, or any real ATS logic.

### 4. Weak Bullet Selection
Selected via heuristics, not an LLM call:

- No numbers/metrics
- No action verb
- No technology/tool mentioned
- Too short (below a word-count threshold)

Rewrite only the worst 2–3 bullets identified this way.

### 5. Bullet Rewrites & Hallucination Guardrail
The LLM rewrites the selected bullets only. Prompt explicitly instructs: never introduce a
technology, tool, or achievement not already present in the original resume. Validate rewritten
bullets against the source resume text before displaying them (e.g. flag/reject a rewrite that
introduces a term absent from the original).

### 6. LLM Output & Validation
LLM output is structured JSON, validated with Pydantic. If validation fails, retry once. If it
still fails, return a clear error — never show unvalidated output to the user.

Prompt design work should go into the **output schema**, not into elaborate persona prompts.
Skip "You are a senior FAANG recruiter..." style iteration.

### 7. Streaming
Stream discrete status events, not partial/incomplete JSON tokens:

```
Parsing Resume...
Generating Embeddings...
Finding Missing Skills...
Rewriting Bullet 1...
Rewriting Bullet 2...
Done
```

### 8. Provider Abstraction
One interface, three implementations. Nothing more layered than this:

```python
class LLMProvider(Protocol):
    def generate(self, prompt: str) -> str: ...
    def stream(self, prompt: str) -> Iterator[str]: ...
```

`GeminiProvider`, `GroqProvider`, `OpenRouterProvider` implement it. No base/streaming/retry/
metrics provider hierarchy.

### 8a. Embedding Provider Abstraction
Same pattern as section 8, applied to embeddings instead of generation:

```python
class EmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]: ...
```

`VoyageEmbeddingProvider` is the only implementation. No fallback/multi-provider embedding
logic — that's LLM-provider territory (section 8), not this.

### 9. Embedding Scope
Embed only the full resume and full JD (and optionally resume sections if needed for the
experience-match heuristic). Do not embed every sentence, bullet, or extracted skill
individually. Embeddings are generated via the `EmbeddingProvider` (Voyage AI), not computed
locally.

### 10. Error Handling
Handle gracefully, without crashing:

- Invalid/unparseable PDF
- Empty resume or JD
- Provider timeout
- Provider rate limit
- Invalid/malformed LLM JSON
- Network failure

## Requirements

### Frontend
- Upload flow for resume + JD input
- Trigger for analysis generation
- Loading and error states
- Streaming status view (per section 7 above)
- Results view: match score (with the 40/40/20 breakdown), missing skills, rewritten bullets
- Clean, responsive UI — no animation/glassmorphism polish. Backend design is what matters here.

### Backend
- Endpoint accepting resume upload + JD text
- Services matching the architecture diagram above, each with one responsibility
- Pydantic schemas for all requests, responses, and LLM output
- SSE endpoint streaming status events + final results

## Out of Scope

Explicitly not building — these are scope creep, not V1:

- Authentication
- Persistence / database / history
- Cover letter generator
- LinkedIn optimizer
- Interview preparation features
- Full resume builder
- Analytics
- Payments (Stripe, etc.)
- Browser/Chrome extension
- File types beyond PDF and plain text (no DOCX, images, scanned PDFs, ZIPs)
- Redis, background queues, caching, async workers — add only if the app is working and
  genuinely needs it, not preemptively
- Enterprise-style provider abstraction (retry/metrics/streaming provider layers)
- Per-sentence/per-bullet embedding

## Stretch Goals (only after everything above ships)

- Highlight matched vs. missing keywords in the rendered resume text
- Regenerate a single bullet rewrite without re-running the full analysis
- Automatic fallback to a second provider on rate limit/error

## Success Criteria

Ship when the app can:

- Parse a resume and a job description
- Compute the semantic match score (40/40/20)
- Identify missing skills
- Rewrite 2–3 weak bullets without hallucinating new technologies
- Stream status + results to the UI via SSE
- Validate all LLM responses with Pydantic (retry once, then error)
- Route through all three providers (Gemini/Groq/OpenRouter) via the common interface
- Handle the error cases listed above without crashing

Everything past this list is a bonus, not a requirement. Stop and ship.