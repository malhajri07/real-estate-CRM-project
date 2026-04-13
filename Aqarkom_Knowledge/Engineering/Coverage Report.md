---
tags: [engineering, documentation, coverage]
created: 2026-04-10
updated: 2026-04-13
status: complete
---

# Coverage Report — Final (Comment Plan C1-C20 Complete)

**Generated:** 2026-04-10 | **Updated:** 2026-04-11
**Convention:** [[Engineering/Comment Style]]
**Plan:** [[Plans/Comment Plan C1-C20]] — **ALL 20 SESSIONS COMPLETE** ✅

## File-level header coverage

**Every production file now has a TSDoc file header.**

| Layer | Files | New headers added | Already had | Total |
|---|---|---|---|---|
| Schema (Prisma) | 1 | 77 models + 39 enums | 0 | **100%** |
| Backend routes | 57 | 37 replaced/added | 20 good | **100%** |
| Backend lib/services | 65 | 14 added | 51 good | **100%** |
| Frontend | 235 | 47 added | 188 good | **100%** |
| **Total** | **358** | **~175 new/upgraded** | **~183 kept** | **100%** |

## Per-handler JSDoc coverage (2026-04-11 completion pass)

**286 per-handler `@route` JSDoc blocks added to all backend route handlers.**

| Scope | Handlers documented | Files |
|---|---|---|
| C3 — Auth + middleware | 18 | org-team.ts |
| C4 — CRM | 10 | activities, appointments, lead-routing |
| C5 — Properties & deals | 35 | listings, deals, deal-documents, projects, property-categories, property-types, commission |
| C6 — Marketing & inbox | 28 | campaigns, inbox, chatbot, messages, promotions, sequences |
| C7 — Pool/tenancy/reports | 36 | buyer-pool, broker-requests, tenancies, reports, custom-reports, notifications, requests |
| C8 — Admin + remaining | 106 | rbac-admin, billing, audit-logs, 6 CMS routes, moderation, support, feedback, maintenance + 19 more |
| C9 — Lib/middleware | 53 | 26 middleware/service/util files |
| **Total** | **286** | **81 files** |

## Per-export TSDoc coverage (heuristic)

```
web         72/  383  ( 18.8%)  ██████░░░░░░░░░░░░░░░░░░░░░░░░
api        368/  413  ( 89.1%)  ███████████████████████████░░░
schema      77/   77  (100.0%)  ██████████████████████████████
────────────────────────────────────────────────────────────────
overall    517/  873  ( 59.2%)  ██████████████████░░░░░░░░░░░░
```

**Note:** Backend route handlers now at ~89% coverage. Frontend per-export coverage remains at file-header level (18.8%) — a future pass can add per-component/hook JSDoc.

## TypeDoc

- `pnpm run docs` — 0 errors, 802 warnings
- Output: `docs/api/` (5.7 MB HTML, gitignored)
- Browse: `open docs/api/index.html`

## Session progression

| Session | Layer | Files | Key delivery |
|---|---|---|---|
| C1 ✅ | Tooling | 6 | eslint-plugin-tsdoc, typedoc, 3 skills, ADR 008 |
| C2 ✅ | Schema | 1 | 77 models + 39 enums with `///` docs |
| C3 ✅ | Auth + RBAC | 6 | Source/Consumer on authenticateToken, all RBAC middleware |
| C4 ✅ | CRM routes | 4 | leads, activities, appointments, lead-routing |
| C5 ✅ | Properties | 7 | listings (REGA gate), deals (stage tracking), projects |
| C6 ✅ | Marketing | 6 | campaigns, chatbot (FSM docs), inbox, promotions |
| C7 ✅ | Pool/reports | 7 | buyer-pool, broker-requests, tenancies, notifications |
| C8 ✅ | Remaining | 30 | All remaining backend routes |
| C9 ✅ | Lib/services | 65 | middleware, validators, services |
| C10-C19 ✅ | Frontend | 235 | pages, components, hooks, lib, config |
| C20 ✅ | Verify | — | tsc clean, TypeDoc rebuilt, this report |

## Related
- [[Plans/Comment Plan C1-C20]]
- [[Engineering/Comment Style]]
- [[Decisions/008 - TSDoc with Source-Consumer Lineage]]
