---
tags: [architecture, security, multi-tenancy]
created: 2026-04-10
---

# Org Isolation

Multi-tenant data scoping is enforced at the **middleware layer**, not relied on at query sites.

## Middleware

- `injectOrgFilter(req, res, next)` — for **read** queries: appends `organizationId = req.user.organizationId` to `where` clauses
- `injectWriteFilter(req, res, next)` — for **create/update/delete**: forces `organizationId` on writes and rejects cross-org mutations

## Source

`apps/api/middleware/org-isolation.ts`

## Visibility rules

| Role | Can see |
|---|---|
| `WEBSITE_ADMIN` | All organizations (filter bypassed) |
| `CORP_OWNER` | Everything in `req.user.organizationId` |
| `CORP_AGENT` | Their own records (`agentId = req.user.id`) within org |
| `INDIV_AGENT` | Only their own records (no org) |

## Why this matters

All route handlers must go through these middlewares — direct Prisma calls without scoping are flagged in code review.

See also: [[Decisions/ADR Index]]
