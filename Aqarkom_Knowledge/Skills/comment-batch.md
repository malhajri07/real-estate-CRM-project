---
tags: [skill, pointer, comments, documentation]
created: 2026-04-10
skill: comment-batch
---

# /comment-batch

> **Canonical source:** `.claude/skills/comment-batch/SKILL.md`
>
> Part of the [[Plans/Comment Plan C1-C20]] tooling. Follows the convention at [[Engineering/Comment Style]].

## Description

Run /comment-file across a glob of files (e.g., one Comment Plan session at a time). Tracks progress with TaskCreate, runs /typecheck after each batch, and commits at the end. Use to execute one C-session of the Comment Plan.

## Related
- [[Skills/Index|← Skills MOC]]
- [[Plans/Comment Plan C1-C20]]
- [[Engineering/Comment Style]]
- [[Decisions/008 - TSDoc with Source-Consumer Lineage]]
