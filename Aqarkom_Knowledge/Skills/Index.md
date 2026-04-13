---
tags: [skills, index, workflow]
created: 2026-04-10
---

# 🛠️ Skills — Map of Content

**30 skills total** — 22 project-specific + 5 vault-management ([kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)) + 3 documentation skills for [[Plans/Comment Plan C1-C20|the Comment Plan]]. Each is a reusable workflow that bakes vault + memory updates into the development cycle so knowledge stays fresh automatically.

**Location:** `.claude/skills/<name>/SKILL.md` (project-scoped) and `Aqarkom_Knowledge/.claude/skills/` (vault canonical for kepano set)
**Invocation:** `/<name>` from any prompt (e.g. `/add-page`, `/typecheck`, `/comment-file`)

---

## 🏗️ Scaffolding (7)

Fast vertical-slice creation. Use these for any "create", "add", or "scaffold" request.

| Skill | What it does |
|---|---|
| [[Skills/add-page]] | New platform page with PageHeader, RTL, react-query, skeleton, sidebar entry |
| [[Skills/add-api-route]] | New Express route file with auth, org isolation, zod validation |
| [[Skills/add-prisma-model]] | New Prisma model + push + generate + Schema vault note update |
| [[Skills/add-feature]] | Full vertical slice — chains the above + Features note + ADR if needed |
| [[Skills/add-react-query]] | Typed `useQuery` / `useMutation` hook for an API endpoint |
| [[Skills/add-adr]] | New Architecture Decision Record + Index update + cross-link |
| [[Skills/add-arabic]] | Translate strings to Arabic following project conventions |

## 🚀 Session workflow (7)

The enhancement plan E1–E20 lives in `Sessions/`. These skills drive iteration through it.

| Skill | What it does |
|---|---|
| [[Skills/next-session]] | Pick the next ⏳ E session, break into TaskCreate items, confirm with user |
| [[Skills/complete-session]] | Write Sessions/E{n} retro, tick the plan, update Timeline, commit |
| [[Skills/enhance-page]] | Propose 3-5 baby-step enhancements for any page (E pattern) |
| [[Skills/session-retro]] | End-of-conversation: write History/Conversations note + Timeline + memory |
| [[Skills/track-change]] | After any change: propagate to Features/Architecture notes + auto-memory |
| [[Skills/start-dev]] | Boot frontend + backend + verify DB, report status |
| [[Skills/commit-and-track]] | Git commit + update Changelog month note + Timeline |

## 🔒 Quality & audit (6)

Run before declaring work "done". Required preconditions for `/complete-session` and `/commit-and-track`.

| Skill | What it does |
|---|---|
| [[Skills/typecheck]] | `tsc --noEmit` on web + api in parallel |
| [[Skills/audit-org-isolation]] | Find Prisma queries on multi-tenant models without org filter |
| [[Skills/audit-rtl]] | Find LTR-only Tailwind classes (`ml-`, `mr-`, `text-left`, …) |
| [[Skills/audit-tokens]] | Find hardcoded hex/rgb colors and Tailwind palette classes |
| [[Skills/rega-check]] | Verify listing/deal flows satisfy REGA compliance rules |
| [[Skills/find-callers]] | Pre-refactor: find every importer/user of a symbol |

## 🗄️ Database (2)

| Skill | What it does |
|---|---|
| [[Skills/db-push]] | `prisma db push` + `generate` + restart API + update Schema vault note |
| [[Skills/seed-reset]] | Drop + reseed demo data (with confirmation) |

## 📝 Documentation (3)

> Tooling for [[Plans/Comment Plan C1-C20]]. Convention at [[Engineering/Comment Style]] · Decision at [[Decisions/008 - TSDoc with Source-Consumer Lineage]]

| Skill | What it does |
|---|---|
| [[Skills/comment-file]] | Add TSDoc to every export in one file (with `Source:` / `Consumer:` lineage) |
| [[Skills/comment-batch]] | Drive one C session — runs `/comment-file` over a glob, ticks the plan, commits |
| [[Skills/coverage-report]] | Heuristic TSDoc coverage % across web/api/schema; saves report to vault |

## 📚 Vault management — kepano (5)

> From [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) by Steph Ango (creator of Obsidian) · MIT
> Canonical install: `Aqarkom_Knowledge/.claude/skills/` · Mirrored to `.claude/skills/` for project-root invocation
> See [[Skills/Vault Skills - kepano]] for details

| Skill | What it does |
|---|---|
| [[Skills/obsidian-markdown]] | Write valid Obsidian Flavored Markdown — wikilinks, embeds, callouts, properties |
| [[Skills/obsidian-bases]] | Create/edit `.base` files (Obsidian's database views with filters/formulas) |
| [[Skills/json-canvas]] | Create/edit `.canvas` files (visual diagrams, mind maps, flowcharts) |
| [[Skills/obsidian-cli]] | Drive Obsidian via CLI for vault ops + plugin/theme dev |
| [[Skills/defuddle]] | Extract clean markdown from web pages (lighter than `WebFetch`) |

---

## How they fit together

```
User asks for a feature
  └─ /add-feature
       ├─ /add-prisma-model      ──┐
       ├─ /db-push                  │
       ├─ /add-api-route            │  each step
       ├─ /audit-org-isolation      │  updates the
       ├─ /add-react-query          │  vault as it
       ├─ /add-page                 │  goes
       ├─ /audit-rtl                │
       ├─ /audit-tokens             │
       ├─ /typecheck              ──┘
       └─ /commit-and-track
            └─ updates History/Changelog/{month}.md
            └─ updates History/Timeline.md

End of work block
  └─ /track-change      → propagate to Features/Decisions notes
  └─ /session-retro     → write History/Conversations/Session NN.md
                          + auto-memory updates
```

## How to use this with Claude

When you start a session with Claude on this project:

1. **Tell Claude the goal** ("let's do the next session", "add a commissions page", "audit org isolation").
2. **Claude picks the right skill** from this vault and runs it. Each skill is self-contained — it knows what to do, what checks to run, and what to update afterwards.
3. **Claude updates the vault automatically** as part of the skill — you don't have to remind it.
4. **At the end**, ask Claude to run `/session-retro` to capture the conversation as a `History/Conversations/` note.

## Adding new skills

Skills live in `.claude/skills/<name>/SKILL.md` with frontmatter:

```markdown
---
name: skill-name
description: When to use this skill (this is what Claude uses to decide)
---

# Title

Steps, verification checklist, anti-patterns.
```

After adding a skill file, also add a row to the table above and link it.

## Related
- [[Home]]
- [[Plans/Enhancement Plan E1-E20]]
- [[History/Index]]
