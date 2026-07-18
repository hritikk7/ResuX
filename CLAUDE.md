@AGENTS.md
## Implementation Rules

This repository follows the PRD strictly.

If there is a conflict:

1. User instruction
2. PRD (docs/PRD.md)
3. Architecture (docs/ARCHITECTURE.md)

Never introduce:

- authentication
- databases
- Redis
- background workers
- analytics
- extra AI features
- unnecessary abstractions

If a requested change violates the PRD, explain why before implementing it.