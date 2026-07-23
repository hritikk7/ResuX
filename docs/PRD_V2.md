# Resume Analyzer — V2 PRD

## Relationship to V1

V1 shipped with: SSE-streamed analysis, fixed 40/40/20 match score, embedding-based
(Voyage AI) skill matching, heuristic weak-bullet selection, LLM-based bullet rewriting
behind a Gemini/Groq/OpenRouter provider abstraction, no auth, no persistence.

V2 changes one V1 mechanism (skill matching) and adds scope that was explicitly
Out of Scope in V1: authentication, persistence, and a cover letter generator.
Both categories are called out separately below so the V1 discipline stays visible —
this is a deliberate expansion, not creep. LinkedIn Optimizer is deferred, not
built this round.

## V2 Amendments Log

- **2026-07-20 — Skill Service: embedding matching → zero-shot LLM matching.**
  Replaces the regex/spaCy extraction + Voyage embedding-similarity pipeline with a
  single structured LLM call: given resume + JD, return all JD-requested skills,
  which are matched, which are missing. Reason: better cross-domain synonym
  recognition ("managing client relations" ≈ "customer success") without hand-built
  dictionary/threshold tuning. **Trade-off accepted:** Keyword Match (40% of the score)
  now depends on LLM judgment rather than a deterministic formula, and is no longer
  provider-invariant — different providers may extract slightly different skill sets
  for the same input. See "Skill Service v2" below for how this is handled.
- **2026-07-20 — New scope: Authentication (Google via Supabase), Persistence,
  Cover Letter Generator.** Moved out of V1's Out of Scope list into V2 scope,
  described in full below. LinkedIn Optimizer remains deferred — not part of this
  iteration.
- **2026-07-20 — Refactor: shared LLM-task runner, auth dependency, repository
  layer.** Adding a third LLM-consuming feature (cover letters, alongside skill
  matching and bullet rewriting) makes it worth extracting the shared
  prompt → call → validate → retry-once pattern into one reusable function instead
  of three copies of it. See "Refactoring" below.

## Updated Tech Stack

| Component | Choice |
|---|---|
| Frontend | Next.js |
| Backend | FastAPI |
| Embeddings | Voyage AI Embeddings API (Similarity Service only — see below) |
| Similarity | Cosine similarity |
| Skill matching | Zero-shot LLM call (see Skill Service v2) — **no longer uses embeddings** |
| LLM | Gemini, Groq, OpenRouter — behind one common interface |
| Validation | Pydantic |
| Streaming | Server-Sent Events (SSE), status-event based |
| PDF parsing | `pypdf` |
| **Auth** | **Supabase Auth, Google OAuth provider, `@supabase/ssr` (cookie sessions)** |
| **Database** | **Supabase Postgres** |
| Storage (files) | None — resumes are not persisted, only analysis results |

No further comparison shopping on any of these. They're fixed, same as V1's rule.

## Architecture (V2)

Skill Service moves from the "fast, no-LLM" branch to the LLM branch. It now runs
as its own parallel LLM call, separate from bullet rewriting — not merged into one
call — so a failure in one doesn't invalidate the other.

```
Resume Parser → Analysis Orchestrator
                      │
        ┌─────────────┼──────────────────┬───────────────────┐
        │              │                  │                   │
  Similarity      Experience        Skill Service        Weak Bullet
  Service         Service           (LLM, zero-shot)     Service
  (Voyage,        (heuristic,             │                   │
   no LLM)         no LLM)          Skill Prompt          Bullet Prompt
        │              │            Builder → LLM         Builder → LLM
        │              │            Provider → Skill      Provider → Bullet
        │              │            Validator             Validator
        │              │                  │                   │
        └──────────────┴──────────────────┴───────────────────┘
                                    │
                            Result Aggregator
                                    │
                          (auth'd) SSE Stream → Postgres write
```

Only Experience Service is now guaranteed local/synchronous. Similarity (Voyage),
Skill (LLM), and Bullet Rewrite (LLM) all carry network/provider risk — all three
need the same timeout/retry/error handling treatment section 10 (V1) already defined.

## Feature Specs

### Skill Service v2 — Zero-Shot LLM Matching

Single LLM call per analysis, structured output, Pydantic-validated:

```python
class SkillMatchLLMOutput(BaseModel):
    jd_skills: list[str]
    matched_skills: list[str]
    missing_skills: list[str]
```

Prompt instructs the model to extract every skill/technology/competency implied by
the JD (not just exact nouns), then classify each as present or absent in the resume
based on semantic content, not exact string match. Same validation policy as bullet
rewrites: retry once on malformed JSON, then error — never surface unvalidated output.

**Explicitly not doing:** combining skill-matching and bullet-rewriting into one LLM
call. Keeping them separate preserves partial-result delivery (skills can complete
and stream even if bullet rewriting fails) and keeps the failure surface of each call
independent and easy to reason about.

### Authentication — Google OAuth via Supabase, real refresh-token handling

Not the "stick a token in localStorage" tutorial pattern — cookie-based sessions
with proper background refresh, the way a real Next.js product does it.

**Provider setup:** Google OAuth 2.0 Client ID/Secret from Google Cloud Console,
registered as an OAuth provider in the Supabase Auth dashboard.

**Frontend (Next.js) — owns the entire session lifecycle:**
- Use `@supabase/ssr` (not the older `auth-helpers` package). Session lives in
  httpOnly cookies — readable by middleware and server components, not exposed to
  client-side JS.
- Flow: "Sign in with Google" → `supabase.auth.signInWithOAuth({ provider: 'google' })`
  → Google consent screen → Google redirects to Supabase's callback → Supabase
  creates/updates the `auth.users` row and issues a session (short-lived access
  token + a separate long-lived refresh token) → redirect to the app's
  `/auth/callback` route → that route calls `exchangeCodeForSession()`, which sets
  the cookies.
- Next.js middleware runs on every request and calls `supabase.auth.getUser()`.
  If the access token has expired, this transparently uses the refresh token to
  get a new one before the request completes — this is the actual refresh-token
  handling; it's provided by `@supabase/ssr`, not hand-written.

**Backend (FastAPI) — deliberately stateless with respect to auth:**
- Never sees the refresh token, never performs a refresh. Only verifies the
  short-lived access token sent as `Authorization: Bearer <token>` on every
  request, against the Supabase project's JWT secret/JWKS, and extracts `user_id`.
- One dependency, reused everywhere: `get_current_user(authorization: str) -> str`.
  No session store, no server-side login endpoint, no custom refresh logic.
- If a request arrives with an expired token (edge case, right at expiry), FastAPI
  returns 401. The frontend's Supabase client refreshes and retries — the backend
  doesn't attempt recovery itself.

Anonymous use of `/analyze` is removed in V2 — every analysis is tied to a
`user_id` so it can be persisted (see below). **Decided: no guest/anonymous
access in this version** — login is required before any analysis can run.

### Persistence (Supabase Postgres)

Single new table, minimal schema — stores results, not raw files:

```sql
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  job_description text not null,
  resume_filename text,
  score jsonb not null,           -- MatchScoreBreakdown
  missing_skills text[] not null,
  matched_skills text[] not null,
  bullet_rewrites jsonb not null, -- list[ValidatedBulletRewrite]
  created_at timestamptz default now()
);
```

- The orchestrator writes one row after `result_final` is assembled — not
  incrementally per SSE event.
- Raw resume text/file is **not** stored (keeps V1's "no file storage" principle
  intact even though results now persist) — only the filename, for display in history.
- Frontend adds a history view: list of past analyses per logged-in user, newest first.

### Cover Letter Generator

New LLM-backed service, reusing the existing `LLMProvider` abstraction and the same
Prompt Builder → LLM → Validator pattern already proven for bullet rewrites.

- Input: resume text + JD text (+ optionally the V1 analysis output, so the letter
  can reference identified strengths/matched skills).
- Same hallucination guardrail as bullet rewrites: the prompt instructs the model
  never to introduce experience, tools, or achievements absent from the source
  resume; output is validated against resume text before display.
- Output: a single structured field (`cover_letter_text: str`), length-bounded
  (e.g. 250–400 words), not a multi-template system.

## Refactoring

Three separate features now call an LLM with the same shape: build a prompt,
call the provider, validate the JSON against a Pydantic schema, retry once on
failure, else error. Duplicating that in `skill_service.py`, `weak_bullet_service.py`,
and `cover_letter_service.py` is a real code smell at three copies — refactor it
into one shared function before writing the third copy, not after.

```python
async def run_llm_task(
    provider: LLMProvider,
    prompt: str,
    output_schema: type[BaseModel],
) -> BaseModel:
    raw = await provider.generate(prompt)
    try:
        return output_schema.model_validate_json(raw)
    except ValidationError:
        raw_retry = await provider.generate(prompt)
        try:
            return output_schema.model_validate_json(raw_retry)
        except ValidationError as e:
            raise LLMValidationError(
                f"LLM output failed validation twice for schema {output_schema.__name__}"
            ) from e
```

Each service keeps its own prompt-building logic and its own output schema —
only the call/validate/retry mechanics get shared. Skill Service calls this with
`SkillMatchLLMOutput`, Weak Bullet Service calls it per-bullet with a rewrite
schema, Cover Letter Generator calls it with a cover-letter schema.

**Other structural changes this version requires:**

- **`app/api/deps.py`** — new module for the `get_current_user` FastAPI dependency,
  applied to `/analyze`, `/cover-letter`, and the new history-listing endpoint.
- **`app/db/analyses_repository.py`** — new module isolating Supabase Postgres
  reads/writes (`save_analysis`, `get_analyses_for_user`) behind plain functions,
  so no service or the orchestrator talks to the database directly — same
  single-responsibility principle already used throughout the architecture.
- **Orchestrator signature change** — `run_analysis()` now takes `user_id`, so the
  result can be persisted via the repository once `result_final` is assembled.
- **Cover Letter Generator is a separate endpoint** (`POST /cover-letter`,
  auth'd, not streamed via SSE by default), triggered on demand rather than
  bundled into every `/analyze` call — not every analysis needs a cover letter,
  and bundling it would mean paying for an LLM call nobody asked for.

## Open Decisions (Deferred)

Not yet decided — call these out explicitly rather than let a default get baked in
silently while building:

- **SSE granularity for the score-computation phase.** Does the fast synchronous
  part (Similarity, Experience) get one collapsed status event
  ("Analyzing Resume...") or a separate status line per sub-step? Leaning toward
  collapsed, since the whole phase takes under a second and granular events would
  flash by unread — but not locked in.
- **Provider-failure behavior mid-analysis.** If Voyage (Similarity) or the LLM
  (Skill Service, now zero-shot) times out or errors, does the whole `/analyze`
  request fail, or does the orchestrator still deliver whatever *did* succeed —
  e.g. Experience score computed, Similarity/Skills marked as failed instead of
  silently missing? Matters more now than in V1, since two of three score
  components depend on external providers. Needs a decision before the orchestrator's
  error-handling path is written.

## Out of Scope (V2)

Carried over from V1 plus new items specific to what V2 adds:

- LinkedIn Optimizer entirely — deferred to a later iteration, not built this round
- Resume file storage (only analysis *results* persist, not the uploaded file)
- Team/organization accounts, shared workspaces
- Role-based access control beyond "is this user logged in"
- Payments / subscription tiers
- Admin dashboard or usage analytics
- Rate limiting per user tier (a single sane global rate limit is enough for V2)
- Automatic fallback to a second LLM/embedding provider on failure (still a stretch
  goal, not required)

## Success Criteria (V2)

Ship when the app can, in addition to all V1 success criteria:

- Match skills via the zero-shot LLM call, validated and retried per policy
- Require Google sign-in (Supabase Auth) before running `/analyze`, with session
  refresh handled entirely by `@supabase/ssr` — no custom refresh-token code
- Persist each completed analysis to Postgres, tied to the authenticated user
- Show a history list of past analyses for the logged-in user
- Generate a cover letter on demand (separate endpoint) without hallucinating
  experience, using the shared `run_llm_task` runner
- Handle auth/DB failures gracefully (expired token, DB write failure) without
  losing or corrupting an otherwise-successful analysis result

Everything past this list is a bonus, not a requirement — same rule as V1.
