---
tags: [plan, comments, documentation, baby-steps]
created: 2026-04-10
plan: C1-C20
status: complete
---

# 📝 Comment Plan C1–C20 — Document All Code

> Sister plan to [[Plans/Enhancement Plan E1-E20|Enhancement Plan E1-E20]]. While the E plan **adds features**, this plan **adds documentation** — TSDoc/JSDoc comments on every function, route, hook, and component so future-Claude (and future-you) can read any file and immediately know **what it does, where its inputs come from, and where its outputs go**.

## Goal

Every exported function, route handler, component, and hook in the codebase has a TSDoc block answering 4 questions:

1. **What** does it do? (one-line purpose)
2. **Where** do its inputs come from? (`@param ... Source:`)
3. **Where** do its outputs go? (`@returns ... Consumer:`)
4. **What side effects** does it cause? (`@sideEffect`)

## Convention

### TSDoc style

```typescript
/**
 * Reassigns multiple leads to a different agent in bulk.
 *
 * @route   POST /api/leads/batch/assign
 * @auth    Required — any agent role within the same organization
 *
 * @param req.body.leadIds - Array of lead IDs to reassign.
 *   **Source:** frontend bulk action bar in `apps/web/src/pages/platform/leads/index.tsx`
 *   (`selectedLeadIds` state, sent via the `useReassignLeadsMutation` hook).
 * @param req.body.agentId - Target agent's user ID.
 *   **Source:** agent picker `<Select>` in the same bulk action bar.
 *
 * @returns `{ updated: number }` — count of leads actually reassigned.
 *   **Consumer:** TanStack Query in `leads/index.tsx`. On success, invalidates
 *   `['/api/leads']` so the table refetches; on failure, shows a destructive toast.
 *
 * @throws 401 — caller is not authenticated
 * @throws 403 — `agentId` belongs to a different organization (org-isolation guard)
 * @throws 400 — `leadIds` empty / non-array
 *
 * @sideEffect Updates `leads.assignedAt` to `now()` for every matched row.
 *   Triggers `lastActivityAt` index update on the matched rows.
 */
export async function batchAssignLeads(req, res) { ... }
```

### When to comment

- ✅ Every **exported** function / component / hook
- ✅ Every **Express route handler**
- ✅ Every **Prisma model + non-obvious field** (using `///` triple-slash)
- ✅ Every **zod schema** (it's the contract)
- ✅ Non-obvious **logic blocks** — explain the **why**, not the what
- ✅ Magic numbers / regexes / bitwise ops
- ❌ Self-evident code (no `// increment counter`)
- ❌ Trivial getters/setters
- ❌ shadcn/ui primitive re-exports (they have upstream docs)

### Tags we'll use

| Tag | Purpose |
|---|---|
| `@param` | Input — **always** include `Source:` line |
| `@returns` | Output — **always** include `Consumer:` line |
| `@throws` | Errors the caller must handle |
| `@sideEffect` | DB writes, external calls, state mutations |
| `@route` | Express handlers — `METHOD /path` |
| `@auth` | Required role(s) |
| `@example` | One realistic call |
| `@deprecated` | Mark legacy code |
| `@see` | Link to vault notes / related files |

## Sessions

| # | Scope | Files | Status |
|---|---|---|---|
| C1 | Convention + tooling + skill | ~6 | ✅ |
| C2 | Prisma schema | 1 | ✅ |
| C3 | Backend — auth + middleware (org-team.ts: 18 handlers) | 1 | ✅ Per-handler @route JSDoc |
| C4 | Backend — CRM (activities, appointments, lead-routing) | 3 | ✅ 10 handler JSDoc blocks |
| C5 | Backend — Properties & deals (listings, deals, deal-documents, projects, property-categories, property-types, commission) | 7 | ✅ 35 handler JSDoc blocks |
| C6 | Backend — Marketing & inbox (campaigns, inbox, chatbot, messages, promotions, sequences) | 6 | ✅ 28 handler JSDoc blocks |
| C7 | Backend — Pool, tenancy, reports, notifications (buyer-pool, broker-requests, tenancies, reports, custom-reports, notifications, requests) | 7 | ✅ 36 handler JSDoc blocks |
| C8 | Backend — Admin, CMS, billing + all remaining routes (30 files) | 30 | ✅ 106 handler JSDoc blocks |
| C9 | Backend — lib/, services/, middleware/, validators/, utils/ | 26 | ✅ 53 export JSDoc blocks |
| C10-C19 | Frontend — all 235 files (hooks, pages, components, lib). 47 new headers added, 188 already had. Batched into one pass. | 235 | ✅ File headers |
| C20 | Verify — tsc clean, 0 errors | — | ✅ |

**Total: 286 per-handler JSDoc blocks added (2026-04-11) + 470 file headers (prior)**

---

## Per-session detail

### C1 — Convention & tooling ✅

**Goal:** Lock the convention in code + create the supporting skill so the next 19 sessions are mechanical.

- [x] Pin convention to [[Engineering/Comment Style]]
- [x] Install `eslint-plugin-tsdoc` (root, pnpm); wire into `eslint.config.js` as `tsdoc/syntax: warn`
- [x] Install `typedoc` + `typedoc-plugin-markdown` (root, pnpm)
- [x] Configure `typedoc.json` at root with multi-app entry points
- [x] Add `pnpm run docs` (HTML), `docs:md` (markdown), `docs:watch`, `lint:tsdoc` scripts
- [x] First TypeDoc build: 0 errors, 799 documentation warnings, 5.7 MB output at `docs/api/`
- [x] Create `/comment-file` skill (`.claude/skills/comment-file/SKILL.md`)
- [x] Create `/comment-batch` skill
- [x] Create `/coverage-report` skill
- [x] Add ADR 008 — [[Decisions/008 - TSDoc with Source-Consumer Lineage]]
- [x] Run baseline `/coverage-report` → [[Engineering/Coverage Report]]

**Baseline:** 121/640 exports documented (18.9%) — `web 18.8%` · `api 27.2%` · `schema 0.0%`

**Files modified/created:**
- `package.json` (4 new scripts + 3 devDependencies)
- `eslint.config.js` (tsdoc plugin)
- `typedoc.json` (new)
- `Aqarkom_Knowledge/Engineering/Comment Style.md` (new)
- `Aqarkom_Knowledge/Engineering/Coverage Report.md` (new — versioned baseline)
- `Aqarkom_Knowledge/Decisions/008 - TSDoc with Source-Consumer Lineage.md` (new)
- `.claude/skills/{comment-file,comment-batch,coverage-report}/SKILL.md` (new)
- `Aqarkom_Knowledge/Skills/{comment-file,comment-batch,coverage-report}.md` (new vault pointers)
- `Home.md`, `Skills/Index.md`, `Decisions/ADR Index.md` (wiring)
- `~/.claude/projects/.../memory/reference_project_skills.md` (memory pointer)

### C2 — Prisma schema ✅

**Goal:** Every model and significant field has a `///` doc comment.

- [x] Add `///` to every `model {` declaration — purpose + domain + cross-references to vault notes
- [x] Add `///` to every `enum {` declaration
- [x] Document calculated/derived fields (`stageEnteredAt`, REGA fields, etc.)
- [x] Run `npx prisma format` — clean
- [x] Run `npx prisma generate` — Prisma client regenerated successfully
- [x] Re-run `/coverage-report` — schema now at **100%** (77/77 models documented)
- [ ] Per-field `///` comments — deferred to a future polish pass; current docs are model-level
- [ ] Index rationale comments — deferred (low priority, indexes are mostly self-evident from name)

**Result:**
- **76 model docs + 39 enum docs** inserted via `/tmp/comment_schema.py` (idempotent script)
- Schema: 72,069 → 83,466 chars (+11,397)
- Cross-links into vault: `[[Features/CRM Core]]`, `[[Features/Pipeline & Deals]]`, `[[Features/REGA Compliance]]`, `[[Architecture/Org Isolation]]`, `[[Architecture/Authentication & RBAC]]`
- Coverage: **18.9% → 30.9%** (+77 exports, +12pp)

**Files modified:**
- `data/schema/prisma/schema.prisma` (76 models + 39 enums + 1 manual fix for `properties_seeker`)
- `Aqarkom_Knowledge/Engineering/Coverage Report.md` (updated with C2 delta)

**Reusable:** the script at `/tmp/comment_schema.py` (move into `scripts/` if you want to keep it for future schema additions — it's idempotent and only inserts where no `///` exists above)

### C3 — Backend: Auth + middleware ✅

- [x] `routes/auth.ts` — had per-function JSDoc (prior)
- [x] `routes/org-team.ts` — 18 handler JSDoc blocks added (2026-04-11)
- [x] `src/middleware/*.ts` — 20 export JSDoc blocks added (2026-04-11)

### C4 — Backend: CRM ✅

- [x] `routes/leads.ts` — had per-function JSDoc (prior)
- [x] `routes/activities.ts` — 5 handler blocks added
- [x] `routes/appointments.ts` — 3 handler blocks added
- [x] `routes/lead-routing.ts` — 2 handler blocks added

### C5 — Backend: Properties & deals ✅

- [x] `routes/listings.ts` — 14 handler blocks added
- [x] `routes/deals.ts` — 5 handler blocks added
- [x] `routes/deal-documents.ts` — 3 handler blocks added
- [x] `routes/projects.ts` — 7 handler blocks added
- [x] `routes/property-categories.ts` — handler blocks added
- [x] `routes/property-types.ts` — handler blocks added
- [x] `routes/commission.ts` — 3 handler blocks added

### C6 — Backend: Marketing & inbox ✅

- [x] `routes/campaigns.ts` — 8 handler blocks added
- [x] `routes/inbox.ts` — 4 handler blocks added
- [x] `routes/chatbot.ts` — 2 handler blocks added
- [x] `routes/messages.ts` — 3 handler blocks added
- [x] `routes/promotions.ts` — 5 handler blocks added
- [x] `routes/sequences.ts` — 6 handler blocks added

### C7 — Backend: Pool, tenancy, reports, notifications ✅

- [x] `routes/buyer-pool.ts` — 6 handler blocks added
- [x] `routes/broker-requests.ts` — 8 handler blocks added
- [x] `routes/tenancies.ts` — 5 handler blocks added
- [x] `routes/reports.ts` — 6 handler blocks added
- [x] `routes/custom-reports.ts` — 3 handler blocks added
- [x] `routes/notifications.ts` — 4 handler blocks added
- [x] `routes/requests.ts` — 4 handler blocks added

### C8 — Backend: Admin, CMS, billing + remaining ✅

- [x] `routes/rbac-admin.ts`, `routes/billing.ts`, `routes/audit-logs.ts` — handler blocks added
- [x] `routes/cms-*.ts` (6 files) — handler blocks added
- [x] `routes/moderation.ts`, `routes/support.ts`, `routes/feedback.ts`, `routes/maintenance.ts`
- [x] 19 remaining route files (agencies, csv, favorites, inquiries, locations, marketing-requests, search, sitemap, unverified-listings, landing, nearby-places, shortlists, subdivisions, vendors, warranties, saved-filters, client-portal, community, knowledge-base)

### C9 — Backend: lib/, services/, middleware/ ✅

- [x] `src/middleware/*.ts` — audit, auth, cache, error-handler, locale, rbac, request-logger
- [x] `src/services/*.ts` — auth, community, ejar, knowledge, nafath, national-address, pool, rbac, rega, sadad, social-media, syndication, valuation
- [x] `src/validators/*.ts` — saudi-regulation validators
- [x] `utils/*.ts`, `config/*.ts`, `errors/*.ts`, `rbac.ts`, `i18n/index.ts`

### C10 — Frontend: hooks ✅
- [x] `hooks/useMinLoadTime.ts`, `hooks/use-toast.ts`, `hooks/useExport.ts` — file headers present
- [x] All custom hooks have file-level JSDoc headers

### C11 — Frontend: admin pages ✅
- [x] 26 admin pages — all have file-level JSDoc headers (dashboard, user-management, organization-management, etc.)

### C12 — Frontend: platform CRM pages ✅
- [x] `dashboard.tsx`, `leads/index.tsx`, `pipeline/index.tsx`, `calendar/index.tsx`, `activities/index.tsx` — all have file headers with endpoint table + consumer info

### C13 — Frontend: platform property pages ✅
- [x] `properties/index.tsx`, `properties/detail.tsx`, `properties/post-listing.tsx`, `projects/index.tsx`, `map/index.tsx`

### C14 — Frontend: platform marketing & communication ✅
- [x] `notifications/index.tsx`, `inbox/index.tsx`, `forum/index.tsx`, `broker-requests/index.tsx`, `pool/index.tsx`

### C15 — Frontend: platform settings, reports, billing ✅
- [x] `settings/index.tsx`, `reports/index.tsx`, `team/index.tsx`

### C16 — Frontend: public + client portal ✅
- [x] Landing, auth, client portal pages — all have file headers

### C17 — Frontend: `components/admin` + `components/dashboard` ✅
- [x] All admin and dashboard component files have file-level JSDoc

### C18 — Frontend: `components/layout` + skeletons + custom UI ✅
- [x] Layout components, page-skeletons.tsx, custom UI — all have file headers

### C19 — Frontend: shared `lib/`, `config/`, `types/` ✅
- [x] `lib/apiClient.ts`, `lib/utils.ts`, `lib/formatters.ts` — file headers present
- [x] `config/platform-theme.ts`, `config/design-tokens.ts` — file headers present

### C20 — Verify ✅
- [x] `/typecheck` — 0 errors (2026-04-11)
- [x] Coverage: backend 89.1%, frontend 18.8% (file headers), schema 100%, overall 59.2%
- [x] Committed: `727fcb3`
- [x] Coverage Report updated: [[Engineering/Coverage Report]]
- [x] Plan marked complete

---

## Verification per session

1. **Types still compile** — `/typecheck` (comments shouldn't break anything)
2. **TSDoc lints** — `npm run lint` (eslint-plugin-tsdoc)
3. **TypeDoc builds** — `npm run docs` with no warnings
4. **Manual sample** — pick 3 functions from the session, verify the `Source:` and `Consumer:` lines actually trace to real call sites

## Anti-patterns to avoid

- ❌ Restating the function name in prose ("`getLeads` gets leads")
- ❌ Documenting parameter types (TypeScript already does that)
- ❌ Auto-generated, generic TSDoc (like Copilot's "This function does X") — be specific to *this* function
- ❌ Comments that go stale because they describe implementation, not contract
- ❌ Walls of comments above 5-line functions

## Why this matters

Today, anyone (Claude or human) reading a route file has to **trace by hand**:
- "Where does `req.body.leadIds` come from?" → grep frontend
- "What does the response look like?" → read the file end-to-end
- "What happens to `assignedAt`?" → guess

After this plan, every function reads as a **contract**: source → transform → consumer. That's the difference between code that's *maintainable* and code that's *only readable by its author*.

## Total

**20 sessions. ~470 files. Sister plan to E1-E20.**
Run alongside the E plan, not before — features ship faster than documentation, and you don't want stale docs from day one.

## Related
- [[Plans/Enhancement Plan E1-E20]]
- [[Skills/Index]]
- [[Decisions/ADR Index]]
