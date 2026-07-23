@AGENTS.md
## Implementation Rules

This repository iterates on the product across versioned PRDs. `docs/PRD.md` is the
V1 PRD, kept as-is for history — do not edit it to reflect new scope. **The active
PRD is `docs/PRD_V2.md`.** Where V2 amends or expands V1 (skill matching mechanism,
auth, persistence, cover letter generator), V2 wins; anything V2 doesn't touch still
follows V1/`docs/ARCHITECTURE.md`.

This repository follows the active PRD strictly.

If there is a conflict:

1. User instruction
2. Active PRD (docs/PRD_V2.md)
3. Architecture (docs/ARCHITECTURE.md)

Never introduce, beyond what the active PRD explicitly scopes in:

- Redis
- background workers
- analytics
- unnecessary abstractions

Authentication, a database, and additional LLM-backed features are no longer
blanket-banned — V2 explicitly scopes in Supabase Auth, Supabase Postgres, and a
cover letter generator. Anything beyond exactly what V2 describes (e.g. a second
auth provider, a second table, a fourth LLM feature) still counts as scope creep.

If a requested change violates the active PRD, explain why before implementing it.