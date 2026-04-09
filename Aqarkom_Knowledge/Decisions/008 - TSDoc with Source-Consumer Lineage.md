---
tags: [decision, adr, tsdoc, comments, documentation]
created: 2026-04-10
adr: 008
status: Accepted
---

# ADR 008 — TSDoc with Source/Consumer Lineage

## Context

The codebase is ~121K LOC across 465 files with 78 DB tables, 57 API routes, and 91 pages. Reading any single file usually requires grepping for callers, callees, and side effects to understand what it does. New contributors (and Claude in fresh sessions) waste a lot of time reconstructing data flow that the original author already knew.

Existing comments are sparse and inconsistent. There's no convention, no linter, no doc generator, no coverage measure.

The user explicitly asked for a comment plan that answers: *"what is this code doing, where is it getting the variable from, and where is the code output variable going to."*

## Decision

Adopt **TSDoc** as the formal comment style across the monorepo, with one project-specific extension: **every `@param` includes a `Source:` line and every `@returns` includes a `Consumer:` line**. This provides explicit data lineage at the function boundary.

The full convention is at [[Engineering/Comment Style]]. The rollout plan is [[Sessions/Comment Plan C1-C20]].

### The 4 questions every block answers

1. **What** does this do? — one-line purpose
2. **Where** do its inputs come from? — `@param ... Source:`
3. **Where** do its outputs go? — `@returns ... Consumer:`
4. **What side effects** does it cause? — `@sideEffect`

## Alternatives considered

- **JSDoc without Source/Consumer** — Standard, supported by every IDE, but loses the data-flow story. Reader still has to grep.
- **Plain comments (`//`)** — No structure, no tooling, no coverage measure.
- **Markdown docs in `docs/`** — Decouples docs from code, guaranteed to go stale, no IDE integration.
- **Auto-generated TypeDoc only** — Useful for the type signature but not the *why*. Doesn't capture intent or data flow.
- **JSDoc + a custom `@dataflow` tag** — Considered, but `Source:`/`Consumer:` lines inside `@param`/`@returns` are more discoverable and don't require custom parser support.

## Consequences

### Positive
- Every function reads as a contract: source → transform → consumer
- Future-Claude can answer "where does X come from?" without grep
- Forces refactor discipline — if `Source:`/`Consumer:` are wrong, the comment is broken and visible
- Standard TSDoc syntax means TypeDoc and IDE tooling work out of the box
- Tooling (lint + coverage) is incremental and doesn't block adoption

### Negative
- ~470 files to back-fill — paced as 20 sessions in [[Sessions/Comment Plan C1-C20]]
- Requires discipline on every new function going forward (enforced via `eslint-plugin-tsdoc` once installed in C1)
- More verbose than standard TSDoc — Source/Consumer lines add 2-4 lines per function
- Risk of stale comments if not maintained — same problem as any docs

### Neutral
- Existing files will be updated incrementally; new files start with the convention
- Doesn't change the build, just how we write comments

## Enforcement

- **Linter**: `eslint-plugin-tsdoc` (installed in C1) catches malformed blocks
- **Doc generator**: `typedoc` produces browsable HTML at `docs/api/`
- **Coverage**: `/coverage-report` skill measures % of exports with TSDoc; goal is 90%+ on backend, 70%+ on frontend (UI primitives don't need it)
- **PR review**: any new exported function without a TSDoc block is a review blocker

## Related

- [[Engineering/Comment Style]] — the convention guide
- [[Sessions/Comment Plan C1-C20]] — the rollout
- [[Skills/comment-file]] · [[Skills/comment-batch]] · [[Skills/coverage-report]]
- [[Decisions/ADR Index]]
