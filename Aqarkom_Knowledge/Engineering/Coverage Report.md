# Coverage Report — after C2 (Schema)

**Generated:** 2026-04-10 02:46
**Convention:** [[Engineering/Comment Style]]
**Plan:** [[Sessions/Comment Plan C1-C20]]

```
web         72/  383  ( 18.8%)  ██████░░░░░░░░░░░░░░░░░░░░░░░░
api         49/  180  ( 27.2%)  ████████░░░░░░░░░░░░░░░░░░░░░░
schema      77/   77  (100.0%)  ██████████████████████████████
────────────────────────────────────────────────────────────────
overall    198/  640  ( 30.9%)  █████████░░░░░░░░░░░░░░░░░░░░░
```

**Delta vs baseline:** +77 documented exports (+12.0 pp)

**Total exports tracked:** 640
**Documented:** 198
**Remaining:** 442 across C3-C19

## Session deltas

| Session | What | Before | After | Δ |
|---|---|---|---|---|
| C1 (baseline) | tooling only — no exports commented | — | 121 / 640 (18.9%) | — |
| C2 | Prisma schema (77 models + 39 enums) | 0 / 77 | 77 / 77 | **+77** |

## Worst-covered files (≥3 exports, <50% documented)

| File | Documented / Total |
|---|---|
| `apps/api/rbac.ts` | 0/20 |
| `apps/web/src/lib/rbacAdmin.ts` | 0/15 |
| `apps/api/src/middleware/audit.ts` | 0/12 |
| `apps/api/src/middleware/error-handler.ts` | 0/12 |
| `apps/web/src/lib/cms.ts` | 0/11 |
| `apps/api/auth.ts` | 0/9 |
| `apps/web/src/components/report/ReportExportPanel.tsx` | 0/8 |
| `apps/web/src/lib/billingAdmin.ts` | 0/5 |
| `apps/web/src/lib/supportAdmin.ts` | 0/5 |
| `apps/web/src/components/admin/data-display/AdminChart.tsx` | 0/5 |
| `apps/web/src/components/deal/DealSummaryCard.tsx` | 0/5 |
| `apps/api/rbac-policy.ts` | 0/5 |
| `apps/web/src/components/admin/feedback/AdminLoading.tsx` | 0/4 |
| `apps/web/src/components/charts/ChartContainer.tsx` | 0/4 |
| `apps/web/src/components/deal/DealStageHistory.tsx` | 0/4 |

## Notes
- Schema heuristic now matches `/// ...\nmodel X` blocks (was missing these in baseline run).
- 100% of models + enums now documented as of C2 — drives the schema row from 0% → 100%.
- The next leverage point is **C3 — Backend auth + middleware** (security perimeter, ~6 files).

## Related
- [[Sessions/Comment Plan C1-C20]]
- [[Decisions/008 - TSDoc with Source-Consumer Lineage]]
- [[Engineering/Comment Style]]