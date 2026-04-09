---
tags: [session, completed, pipeline]
created: 2026-04-10
session: E3
status: done
---

# E3 — Pipeline Enhancements ✅

**Page:** `apps/web/src/pages/platform/pipeline/index.tsx`

## Shipped

- ✅ Column headers show count + sum: "NEW (5) · 2.5M ر.س"
- ✅ Stage age badges on cards: `> 14d` warning, `> 30d` destructive
- ✅ Revenue forecast bar (on track / at risk / lost)
- ✅ `stageEnteredAt` field on deal response, set on stage transitions
- ✅ `GET /api/deals/forecast` endpoint
- ✅ `deal_stage_history` table for transition log
- ✅ Customer dropdown filtered to **agent's own leads only** (not all org)
- ✅ FormField changed from free-text Input to Select with auto-fill phone

## Schema additions

`data/schema/prisma/schema.prisma`
```prisma
model deals {
  // ...
  stageEnteredAt    DateTime?     @default(now())
  // ...
}
```

`deal_stage_history` table:
- `id`, `dealId`, `fromStage`, `toStage`, `changedAt`, `changedBy`

## Stage transition tracking

`apps/api/routes/deals.ts`
```ts
if (validatedData.stage !== undefined && validatedData.stage !== existing.stage) {
  updatePayload.stageEnteredAt = new Date();
  await db.$executeRaw`INSERT INTO deal_stage_history ...`;
}
```

## Customer scope fix

Pipeline customer dropdown was previously showing all org leads. Fixed by filtering:

```ts
const { data: allLeads } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });
const leads = useMemo(() => {
  if (!allLeads || !user?.id) return allLeads;
  return allLeads.filter((l) => l.agentId === user.id);
}, [allLeads, user?.id]);
```

## Lessons
- `stageEnteredAt` existed in DB but not in Prisma schema → had to `prisma db push`
- Pipeline customer scope is **agent-only**, not org-wide (user explicit feedback)

## Related
- [[Features/Pipeline & Deals]]
- [[Sessions/Enhancement Plan E1-E20]]
