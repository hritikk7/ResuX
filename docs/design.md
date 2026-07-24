# Resume Analyzer — Design System

## Design Direction

The application should feel like a professional desktop productivity tool inspired
by Linear. Do **not** clone Linear directly — borrow its principles:

- high information density
- restrained visual hierarchy
- subtle borders
- compact typography
- keyboard-first interactions
- minimal decoration
- fast perceived interaction
- calm interface

The product should feel designed for engineers and technical professionals rather
than consumers.

## Core Principle

**Content is the interface.** Do not wrap every piece of information in cards.

Prefer: sections, rows, lists, dividers, tables, inline metadata, side panels
— over large floating cards.

## Open Decisions (Deferred)

Same discipline as the backend PRD — call out what isn't locked in yet rather
than let a default get baked in silently:

- **Theme.** Dark-first is not required right now. Build components with theming
  in mind (don't hardcode dark-only values), but don't commit to dark-only or a
  light/dark toggle yet — decide once the core screens exist and it's clearer
  which reads better for a "technical report" feel.
- **Sidebar timing.** A persistent sidebar implies something to navigate between.
  V1 has one flow (upload → analyze → results) — no history, no auth. Leaning
  toward a minimal header for V1 and introducing the sidebar in V2 once History
  and Cover Letter exist as real nav destinations, rather than shipping an empty
  sidebar now. Not fully decided.
- **"Apply" action semantics.** Unclear what a bullet rewrite's action button
  actually does, since there's no resume file editing/export in scope (Full
  resume builder is explicitly Out of Scope in the PRD). Likely just "Copy to
  clipboard" — rename accordingly unless something else is intended.
- **⌘K command palette.** This is a real feature commitment (command registry,
  focus handling, state), not a side effect of "minimal aesthetic." Confirm it's
  deliberately in scope before building it, since it's not mentioned in the PRD's
  frontend requirements.

## Layout

Main content should have generous horizontal room. Navigation should visually
recede compared with content. Use consistent page headers throughout.

If/when the sidebar ships (see Open Decisions): ~220px, persistent, left side.

## Typography

- Use **Geist Sans** for UI text.
- Use **Geist Mono** for: percentages, technical metadata, scores, filenames.
- Keep hierarchy compact — avoid oversized headings.

| Level | Size |
|---|---|
| Page title | 18px |
| Section heading | 14px |
| Body | 13px |
| Metadata | 12px |

At 13px/12px, keep line-height and color contrast generous — "compact" should
not slide into "hard to read."

## Surfaces

Use subtle elevation differences rather than obvious cards. Borders extremely
subtle. Avoid heavy shadows. (Theme mode: see Open Decisions.)

## Radius

Keep restrained.

- Small controls: 5–6px
- Panels: 6–8px
- Avoid excessive pill-shaped elements.

## Color

Mostly neutral surfaces. Accent color appears sparingly. No large gradients.

Semantic colors:

| Meaning | Color |
|---|---|
| Matched | green |
| Partial | amber |
| Missing | red |
| Selected / primary action | indigo |

## Resume Analysis Page

The centerpiece of the app. Reads like a technical report, not a marketing
dashboard.

Structure:

```
Analysis header
Match score
Summary
Skills
Experience alignment
Missing requirements
Resume suggestions
```

### Match Score

Present prominently but quietly — no giant colorful score card.

```
78%
Match score
Strong alignment

Keyword       68%
Semantic      81%
Experience    60%
```

The 40/40/20 breakdown is a PRD requirement, not optional — the big number alone
isn't sufficient. Numbers in Geist Mono, same quiet treatment as the headline
score, not a separate visual block competing with it.

### Skills

Compact rows, not chips:

```
React                  Matched
Next.js                Matched
AWS                    Missing
Kafka                  Missing
```

### Resume Suggestions

```
Current
<existing bullet>

Suggested
<improved bullet>

[Copy]
```

**Three states per bullet, not two:**

1. **Suggested** — rewrite succeeded, shown as above with the copy action.
2. **In progress** — this bullet's rewrite hasn't streamed back yet (bullets
   arrive one at a time, not all at once — see Loading below).
3. **Rejected** — the hallucination guardrail flagged the rewrite (it introduced
   something not in the source resume) and it was withheld. Show a muted row
   with a short inline reason, e.g. *"suggestion skipped — introduced an unlisted
   skill"*, rather than silently omitting it. This is the guardrail visibly
   working, not a failure to hide.

## Interaction

Support: hover states, tooltips, copy actions, inline editing, keyboard
navigation. ⌘K command palette — see Open Decisions before building.

Transitions: 120–200ms.

## Loading

Two distinct phases, not one flat checklist — this reflects how the backend
actually streams, not a generic "steps" list:

**Phase 1 — fast, synchronous-feeling (checklist):**
```
Resume parsed
Job description processed
Skills extracted
```
Once this phase completes, the match score renders immediately — don't wait
for phase 2 to show it.

**Phase 2 — bullet rewrites, streamed one at a time (progress indicator, not a
checklist):**
```
Rewriting suggestion 1 of 3...
```
Updates per bullet as each one streams back (each is a separate LLM call, so
this can take a few seconds per bullet). Never collapse this into "Recommendations
generated" as a single static item — that hides real, variable-length wait time
behind a checkbox that ticks too early.

Never show generic "AI is thinking" animations.

## Avoid

- purple gradients
- glassmorphism
- huge cards
- excessive rounded containers
- giant dashboard statistics
- excessive icons
- decorative illustrations
- glowing buttons
- oversized headings
- marketing-site aesthetics inside the application
- excessive whitespace
- generic AI dashboard layouts

## Reference

Visual inspiration: Linear. Interpret its principles rather than reproducing its
interface exactly.

The resulting product should feel like: **Linear × developer tooling × resume
intelligence.**