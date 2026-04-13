---
tags: [engineering, convention, comments, tsdoc]
created: 2026-04-10
status: canonical
---

# Comment Style Guide

The single source of truth for **how we comment code in this project**. Every TSDoc/JSDoc block in `apps/web/`, `apps/api/`, and `data/schema/` must conform to this guide.

> This is the convention. The plan that applies it across the codebase is [[Plans/Comment Plan C1-C20]].
> The decision behind it lives in [[Decisions/008 - TSDoc with Source-Consumer Lineage]].

## The 4 questions every block must answer

1. **What** does this do? — one-line purpose
2. **Where** do its inputs come from? — `@param ... Source:`
3. **Where** do its outputs go? — `@returns ... Consumer:`
4. **What side effects** does it cause? — `@sideEffect`

The Source/Consumer pattern is **the project's signature** — it gives every function explicit data lineage. A reader should never need to grep to know who calls this function or where its output flows.

## The standard block

```typescript
/**
 * One-line purpose. Imperative voice. No period needed.
 *
 * Optional second paragraph for non-obvious context — the *why*, never the what.
 *
 * @route   POST /api/leads/batch/assign     // Express handlers only
 * @auth    Required — CORP_AGENT or higher  // Express handlers only
 *
 * @param req.body.leadIds - Array of lead IDs to reassign.
 *   Source: bulk action bar in `apps/web/src/pages/platform/leads/index.tsx`
 *           (`selectedLeadIds` state, sent via `useReassignLeadsMutation`).
 * @param req.body.agentId - Target agent's user ID.
 *   Source: agent picker `<Select>` in the same bulk bar.
 *
 * @returns `{ updated: number }` — count of leads actually reassigned.
 *   Consumer: TanStack Query in `leads/index.tsx`. On success, invalidates
 *   `['/api/leads']` so the table refetches; on failure, shows a destructive toast.
 *
 * @throws 401 — caller is not authenticated
 * @throws 403 — `agentId` belongs to a different organization
 * @throws 400 — `leadIds` empty / non-array
 *
 * @sideEffect Updates `leads.assignedAt` to `now()` for every matched row.
 *
 * @see [[Features/CRM Core]]
 * @see leads/index.tsx
 */
export async function batchAssignLeads(req: Request, res: Response) { ... }
```

## Required vs optional tags

| Tag | When required |
|---|---|
| `@param` | Every parameter on every exported function |
| `@returns` | Every function that returns a value |
| `@route` | Every Express route handler |
| `@auth` | Every Express route handler that requires auth |
| `@throws` | Every error path the caller must handle |
| `@sideEffect` | Any DB write, external API call, file system op, or shared-state mutation |
| `@example` | Encouraged on hooks and shared utilities |
| `@deprecated` | Anything we plan to remove |
| `@see` | Encouraged — link to vault notes with `[[wikilinks]]` |

## Source/Consumer style rules

- **`Source:`** answers "where does this value originate?" Examples:
  - `Source: JWT payload (apps/api/middleware/auth.ts)`
  - `Source: URL query param ?period=`
  - `Source: form input in apps/web/src/pages/platform/leads/components/LeadForm.tsx`
  - `Source: chatbot conversation handoff (POST /api/chatbot/handoff)`
  - `Source: webhook from Unifonic SMS provider`
- **`Consumer:`** answers "where does this value flow next?" Examples:
  - `Consumer: rendered in <DataTable> on dashboard.tsx`
  - `Consumer: stored in deals.stageEnteredAt + deal_stage_history`
  - `Consumer: passed to react-query cache; invalidates ['/api/leads']`
  - `Consumer: emitted to WhatsApp via lib/messaging/unifonic.ts`
- **Be specific** — `Consumer: the frontend` is useless. Name the file or hook.
- **Wrap long lines** at ~90 chars; indent continuation lines under the field name.

## Prisma schema (`///` triple-slash)

```prisma
/// A Lead is the *opportunity* wrapping a customer + intent.
/// Distinct from `customers` which is the master record.
/// Lifecycle: NEW → CONTACTED → QUALIFIED → CONVERTED (creates a Deal)
model leads {
  id              String    @id @default(cuid())
  /// FK to the Customer this lead represents.
  customerId      String
  /// Agent currently owning this lead. Reassignable via /api/leads/batch/assign.
  agentId         String
  /// Org-isolation key. Required on every multi-tenant table.
  organizationId  String
  /// Profile-completeness score (0-100), calculated server-side.
  /// Formula: see leadScore in apps/api/routes/leads.ts.
  leadScore       Int?
  /// Set on the first contact_log entry; updated by /api/leads/batch/assign.
  assignedAt      DateTime?
  ...
  @@index([organizationId])
  @@index([agentId, status])  /// Used by My Leads tab + dashboard "active leads" count
}
```

## React component & hook headers

```tsx
/**
 * Pipeline Kanban board — drag-drop deal cards across stage columns.
 *
 * Stage transitions PATCH `/api/deals/:id` and update local cache optimistically.
 * On error, rolls back the optimistic update and shows a destructive toast.
 *
 * @auth   Visible to all agent roles
 * @route  /home/platform/pipeline
 *
 * @dataSources
 *   - `useQuery(['/api/deals'])` → all deals scoped to current agent
 *   - `useQuery(['/api/leads'])` → for the customer dropdown (filtered to user.id)
 *   - `useQuery(['/api/deals/forecast'])` → revenue forecast bar
 *
 * @stateOwners
 *   - `selectedDeal` — local; controls the detail sheet
 *   - `customerName` — local; controlled <Select> in deal-create form
 *
 * @children
 *   - <DealCard> — receives the deal object + drag handlers
 *   - <DealForm> — deal-create dialog
 *
 * @see [[Features/Pipeline & Deals]]
 * @see [[Sessions/E3 - Pipeline]]
 */
export default function PipelinePage() { ... }
```

## When NOT to comment

- Self-evident code: `// increment counter` for `i++`
- Trivial getters/setters: `get name() { return this._name }`
- Wrappers around shadcn primitives that just re-export
- Generated code (Prisma client, GraphQL codegen)
- Test files — describe blocks are documentation enough

## Anti-patterns

- ❌ Restating the function name in prose: "`getLeads` gets leads"
- ❌ Documenting types: TypeScript already does that
- ❌ Generic AI-style boilerplate ("This function performs the operation")
- ❌ Multi-paragraph essays — keep blocks under 30 lines
- ❌ Stale comments — if you change a function, update its block in the same edit
- ❌ Wikilinks to non-existent vault notes — verify before linking

## Tooling

- **Linter**: `eslint-plugin-tsdoc` (planned in C1)
- **Doc generator**: `typedoc` + `typedoc-plugin-markdown` → emits to `docs/api/`
- **Coverage report**: `/coverage-report` skill — counts undocumented exports
- **Auto-add**: `/comment-file <path>` skill — adds blocks following this guide

## Related
- [[Plans/Comment Plan C1-C20]] — the rollout plan
- [[Decisions/008 - TSDoc with Source-Consumer Lineage]] — the decision
- [[Skills/comment-file]] · [[Skills/comment-batch]] · [[Skills/coverage-report]]
