# Resume Analyzer — Architecture

## Amendments

- **2026-07-17** — Embeddings moved from local `sentence-transformers` to a managed
  `EmbeddingProvider` (Voyage AI), used by both the Similarity Service and the Skill Service's
  semantic-match step. See `docs/PRD.md` Amendments for rationale. Directory layout and service
  table below are updated accordingly.

## Why not a straight pipeline

The PRD's diagram draws one line: Parser → Embedding → Similarity → Skill Extractor →
Prompt Builder → LLM → Validator → SSE. That's not actually how the data depends on
itself, for two reasons:

1. **The match score doesn't need the LLM at all.** It's a fixed formula
   (40% keyword / 40% semantic / 20% experience). Chaining it through
   Prompt Builder → LLM → Validator means the score waits on the slowest,
   most failure-prone part of the system for no reason.
2. **Skill extraction and semantic similarity aren't parallel-independent.**
   Skill Service does two steps internally: regex/spaCy extraction against a
   static dictionary first, *then* an embedding-based semantic match between
   those extracted skills and resume content, to find what's missing. That's
   a different embedding operation from the whole-resume-vs-whole-JD cosine
   similarity used in the score. Both operations call the same
   `EmbeddingProvider` (Voyage AI) — see Amendments above — they just embed
   different text and compare different vectors.

So the real shape is a DAG with two independent paths after parsing, not a chain.

## Architecture

```
Resume + JD
     │
Resume Parser
     │
Analysis Orchestrator
     │
     ├──────────────┬──────────────┬───────────────┐
     │               │              │               │
Similarity      Skill Service   Experience     Weak Bullet
Service         (extract, then  Service        Service
(resume vs JD    embed-match         │          (heuristic,
 cosine)         vs resume)          │           no LLM)
     │               │              │               │
     │          ┌────┘              │               │
     │    Missing skills            │               │
     │    (semantic match)          │               │
     │               │              │               │
     └───────────────┴──────────────┘               │
                     │                               │
             Result Aggregator                Prompt Builder
             (score + skills)                        │
                     │                          LLM Provider
                     │                                │
                     │                          JSON Validator
                     │                                │
                     └───────────────┬────────────────┘
                                      │
                              Result Aggregator
                                      │
                                 SSE Stream
```

Two convergence points into the aggregator, not one:
- **Score path** (Similarity, Skill/missing-skills, Experience) → synchronous,
  no network dependency, can't fail on a provider outage.
- **LLM path** (Weak Bullet → Prompt Builder → LLM → Validator) → async,
  the only part that's slow and retryable.

## Streaming strategy

Stream the score as soon as it's ready, then let bullet rewrites fill in after —
don't gate everything behind the LLM call.

Reasons:
- The score is ready in under a second; bullets depend on a network call to
  Groq/Gemini/OpenRouter, which is the slowest and most failure-prone step.
- If the LLM path fails entirely, the user still gets a complete, useful score
  and missing-skills list instead of nothing.
- It's a better demonstration of understanding your own latency profile than
  a single spinner-until-done UI.

Revised SSE event sequence:

```
status: "Parsing Resume..."
status: "Generating Embeddings..."
status: "Finding Missing Skills..."
result_partial: { score, missing_skills, matched_skills }   ← score renders now
status: "Rewriting Bullet 1..."
bullet_result: { original, rewritten, is_valid }             ← streamed per bullet
status: "Rewriting Bullet 2..."
bullet_result: { ... }
result_final: { full AnalysisResult }
status: "Done"
```

Frontend implication: two render states instead of one — "score populated,
bullets still loading" and "everything done" — rather than a single final blob.

## Service responsibilities (for reference when scaffolding)

| Service | Input | Output | Depends on LLM? |
|---|---|---|---|
| Resume Parser | raw file bytes | parsed text + candidate bullets | No |
| Similarity Service | resume text, JD text | cosine similarity (whole vs whole) | No (calls `EmbeddingProvider`, not LLM) |
| Skill Service | JD text → resume text | extracted JD skills, missing skills, matched skills | No (calls `EmbeddingProvider`, not LLM) |
| Experience Service | resume text, JD text | years/seniority heuristic score | No |
| Weak Bullet Service | parsed bullets | 2–3 weakest bullets + reasons | No (heuristic selection only) |
| Prompt Builder | weak bullets, JD text | prompt string per bullet | No |
| Embedding Provider | text | embedding vector | No (Voyage AI, not an LLM call) |
| LLM Provider | prompt | raw structured JSON | Yes (Groq/Gemini/OpenRouter, switchable) |
| Validator | raw LLM JSON, source resume text | validated rewrite or rejection | No (post-LLM check) |
| Result Aggregator | score inputs + validated rewrites | final `AnalysisResult` | No |

## Provider directory layout

Two provider families, same pattern, kept separate since they serve different purposes:

```
providers/
    embeddings/
        base.py      # EmbeddingProvider Protocol
        voyage.py    # VoyageEmbeddingProvider
    llm/
        base.py      # LLMProvider Protocol
        gemini.py
        groq.py
        openrouter.py
```

## Open question for next session

Whether score-path sub-steps (keyword / semantic / experience) each get their
own granular SSE status event, or collapse into one "Analyzing Resume..." event
— since nothing in the PRD requires streaming inside the score computation itself.