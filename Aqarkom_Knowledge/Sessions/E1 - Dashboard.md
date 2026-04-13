---
tags: [session, completed, dashboard]
created: 2026-04-10
session: E1
status: done
---

# E1 — Dashboard Enhancements ✅

**Page:** `apps/web/src/pages/platform/dashboard.tsx`

## Shipped

- ✅ Period selector (30d / 90d / 1y) in PageHeader, refetches metrics on change
- ✅ Dynamic growth deltas on every metric card driven by `metrics.growth` (3-tone: up=green, neutral=secondary, down=red)
- ✅ Stuck deals alert card (NEGOTIATION > 30 days)
- ✅ `?period=30d|90d|1y` on `/api/reports/dashboard/metrics` with `previousPeriod` for comparison
- ✅ `GET /api/deals/stuck`
- ✅ Index on `deals(stage, updatedAt)`

## Key code

`apps/web/src/pages/platform/dashboard.tsx`
```ts
const [period, setPeriod] = useState("30d");
const growthData = metrics?.growth;
const makeDelta = (val: number | undefined) => {
  if (val === undefined) return undefined;
  const tone = val > 0 ? "up" as const : val < 0 ? "down" as const : "neutral" as const;
  return { value: Math.abs(val), tone };
};
```

`apps/api/routes/reports.ts`
```ts
const calcGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};
```

## Lessons
- Growth badge must show even when value is **0%** (user feedback)
- Must apply to **all** metric cards including Properties (was undefined)
- Three-tone system needed: up / neutral / down

## Related
- [[Plans/Enhancement Plan E1-E20]]
