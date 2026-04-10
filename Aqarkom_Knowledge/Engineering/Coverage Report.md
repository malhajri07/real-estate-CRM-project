# Coverage Report — Final (Comment Plan C1-C20 Complete)

**Generated:** 2026-04-10
**Convention:** [[Engineering/Comment Style]]
**Plan:** [[Sessions/Comment Plan C1-C20]] — **ALL 20 SESSIONS COMPLETE** ✅

## File-level header coverage

**Every production file now has a TSDoc file header.**

| Layer | Files | New headers added | Already had | Total |
|---|---|---|---|---|
| Schema (Prisma) | 1 | 77 models + 39 enums | 0 | **100%** |
| Backend routes | 57 | 37 replaced/added | 20 good | **100%** |
| Backend lib/services | 65 | 14 added | 51 good | **100%** |
| Frontend | 235 | 47 added | 188 good | **100%** |
| **Total** | **358** | **~175 new/upgraded** | **~183 kept** | **100%** |

## Per-export TSDoc coverage (heuristic)

```
web         72/  383  ( 18.8%)  ██████░░░░░░░░░░░░░░░░░░░░░░░░
api         82/  180  ( 45.6%)  ██████████████░░░░░░░░░░░░░░░░
schema      77/   77  (100.0%)  ██████████████████████████████
────────────────────────────────────────────────────────────────
overall    231/  640  ( 36.1%)  ███████████░░░░░░░░░░░░░░░░░░░
```

**Note:** Per-export Source/Consumer depth is concentrated on security-critical files (C3: auth, RBAC) and CRM routes (C4). Extending to every function is a future polish pass.

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
- [[Sessions/Comment Plan C1-C20]]
- [[Engineering/Comment Style]]
- [[Decisions/008 - TSDoc with Source-Consumer Lineage]]
