---
tags: [plan, comments, documentation, baby-steps]
created: 2026-04-10
plan: C1-C20
status: proposed
---

# 📝 Comment Plan C1–C20 — Document All Code

> Sister plan to [[Sessions/Enhancement Plan E1-E20|Enhancement Plan E1-E20]]. While the E plan **adds features**, this plan **adds documentation** — TSDoc/JSDoc comments on every function, route, hook, and component so future-Claude (and future-you) can read any file and immediately know **what it does, where its inputs come from, and where its outputs go**.

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
| C3 | Backend — auth + middleware | 6 | ✅ |
| C4 | Backend — CRM (leads, activities, appointments, lead-routing) | 4 | ✅ |
| C5 | Backend — Properties & deals (listings, deals, projects) | ~5 | ⏳ |
| C6 | Backend — Marketing & inbox (campaigns, inbox, chatbot, messages, webhooks) | ~6 | ⏳ |
| C7 | Backend — Pool, tenancy, reports, notifications | ~7 | ⏳ |
| C8 | Backend — Billing, admin, remaining routes | ~10 | ⏳ |
| C9 | Backend — `lib/` (validation, integrations, helpers) | ~15 | ⏳ |
| C10 | Frontend — hooks (`hooks/api/*`, useAuth, useToast, useMobile…) | 10 | ⏳ |
| C11 | Frontend — admin pages | 26 | ⏳ |
| C12 | Frontend — platform CRM pages (dashboard, leads, customers, activities, calendar, pipeline) | ~10 | ⏳ |
| C13 | Frontend — platform property pages (properties, projects, post-listing, map) | ~10 | ⏳ |
| C14 | Frontend — platform marketing/comm (notifications, inbox, forum, broker-requests, pool) | ~10 | ⏳ |
| C15 | Frontend — platform settings, reports, billing, my-team | ~10 | ⏳ |
| C16 | Frontend — public + client portal (landing, auth, public listing, client/*) | ~10 | ⏳ |
| C17 | Frontend — `components/admin` + `components/dashboard` | ~30 | ⏳ |
| C18 | Frontend — `components/layout` + `components/skeletons` + custom UI | ~30 | ⏳ |
| C19 | Frontend — shared `lib/`, `config/`, `types/` | ~20 | ⏳ |
| C20 | Verify, generate TypeDoc HTML, coverage report, link to vault | — | ⏳ |

**Total files in scope: ~470** (matches the 465 file count plus ~5 newly added)

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

### C3 — Backend: Auth + middleware
**Goal:** The security perimeter is the most-read code in any review. Comment it first.

- [ ] `apps/api/routes/auth.ts` — OTP issue/verify, JWT refresh
- [ ] `apps/api/routes/users.ts`
- [ ] `apps/api/routes/organizations.ts`
- [ ] `apps/api/middleware/auth.ts` — `authenticateToken`
- [ ] `apps/api/middleware/org-isolation.ts` — `injectOrgFilter`, `injectWriteFilter`
- [ ] `apps/api/middleware/rate-limit.ts`

### C4 — Backend: CRM
- [ ] `routes/leads.ts` (already has `leadScore` calc — document the formula)
- [ ] `routes/customers.ts`
- [ ] `routes/activities.ts`
- [ ] `routes/contact-log.ts`
- [ ] `routes/appointments.ts`

### C5 — Backend: Properties & deals
- [ ] `routes/listings.ts` — REGA validation logic; document every check
- [ ] `routes/deals.ts` — `stageEnteredAt`, `deal_stage_history`, forecast
- [ ] `routes/projects.ts` — off-plan units

### C6 — Backend: Marketing & inbox
- [ ] `routes/campaigns.ts`
- [ ] `routes/inbox.ts`
- [ ] `routes/chatbot.ts`
- [ ] `routes/messages.ts`
- [ ] `routes/webhooks/*.ts` (WhatsApp inbound)

### C7 — Backend: Pool, tenancy, reports, notifications
- [ ] `routes/buyer-pool.ts`
- [ ] `routes/broker-requests.ts`
- [ ] `routes/tenancies.ts`
- [ ] `routes/reports.ts` — period filtering, growth calc, stuck deals
- [ ] `routes/custom-reports.ts`
- [ ] `routes/notifications.ts` — `/count` aggregator
- [ ] `routes/promotions.ts`

### C8 — Backend: Billing, admin, remaining
- [ ] `routes/subscriptions.ts`
- [ ] `routes/invoices.ts`
- [ ] `routes/transactions.ts`
- [ ] `routes/admin.ts` (or per-domain admin routes)
- [ ] All remaining route files (~10)

### C9 — Backend: `lib/` & integrations
- [ ] `lib/messaging/*` — Unifonic, Twilio adapters
- [ ] `lib/validation/saudi-phone.ts`
- [ ] `lib/pdf/*`
- [ ] `lib/payments/*`
- [ ] `lib/utils/*`

### C10 — Frontend: hooks
- [ ] `hooks/api/*` — react-query hooks (document query keys + invalidation)
- [ ] `hooks/useAuth.ts`
- [ ] `hooks/useToast.ts`
- [ ] `hooks/useMobile.ts`
- [ ] Any custom domain hooks

### C11 — Frontend: admin pages
**Goal:** 26 admin pages, batch through them. Each page header should state: required role, what data hooks it consumes, what mutations it performs.

### C12 — Frontend: platform CRM pages
- [ ] `dashboard.tsx` — period selector, growth deltas, stuck deals
- [ ] `leads/index.tsx` — bulk actions, quality score, source badges
- [ ] `customers/index.tsx`
- [ ] `activities/index.tsx`
- [ ] `calendar/index.tsx`
- [ ] `pipeline/index.tsx` — drag-drop, forecast, stage age badges

### C13 — Frontend: platform property pages
- [ ] `properties/index.tsx`
- [ ] `properties/detail.tsx`
- [ ] `properties/post-listing.tsx`
- [ ] `projects/*`
- [ ] `map/*`

### C14 — Frontend: platform marketing & communication
- [ ] `notifications/index.tsx`
- [ ] `inbox/index.tsx`
- [ ] `forum/index.tsx`
- [ ] `broker-requests/index.tsx`
- [ ] `pool/index.tsx`

### C15 — Frontend: platform settings, reports, billing
- [ ] `settings/*`
- [ ] `reports/*`
- [ ] `my-team/*`
- [ ] `billing/*`

### C16 — Frontend: public + client portal
- [ ] `landing.tsx`
- [ ] `auth/*`
- [ ] `client/*`
- [ ] `public/listing/[id].tsx`

### C17 — Frontend: `components/admin` + `components/dashboard`
- [ ] `AdminCard`, `AdminTable`, `AdminChart`, `AdminEmptyState`, `AdminDialog`, `AdminSheet`, `AdminLoading`
- [ ] `MetricCard`, `RevenueChart`, etc.

### C18 — Frontend: `components/layout` + skeletons + custom UI
- [ ] `Header`, `Sidebar`, page wrappers
- [ ] All skeleton variants
- [ ] Custom (non-shadcn) UI components — `chart-tooltip`, `loading-state`, `metrics-card`, `page-section-header`, `empty-state`

### C19 — Frontend: shared `lib/`, `config/`, `types/`
- [ ] `lib/auth.ts`, `lib/utils.ts`, `lib/api-client.ts`
- [ ] `config/platform-theme.ts`, `config/design-tokens.ts`
- [ ] `types/*` — every shared type

### C20 — Verify, build docs, coverage report
- [ ] Run `/typecheck` — must be clean
- [ ] Run `/coverage-report` — surface remaining undocumented exports
- [ ] Run `npm run docs` — generate TypeDoc HTML at `docs/api/`
- [ ] Spot-check 10 random files manually
- [ ] Commit final state with `/commit-and-track`
- [ ] Add `Aqarkom_Knowledge/Reference/API Docs.md` linking to `docs/api/index.html`
- [ ] Mark plan as ✅ complete

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
- [[Sessions/Enhancement Plan E1-E20]]
- [[Skills/Index]]
- [[Decisions/ADR Index]]
