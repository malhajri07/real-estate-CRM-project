---
tags: [session, completed, activities]
created: 2026-04-10
session: E5
status: done
---

# E5 — Activities Enhancements ✅

**Page:** `apps/web/src/pages/platform/activities/index.tsx`

## Shipped

- ✅ **Backend:** `GET /api/activities/overdue` — filters activities where `scheduledDate < now` AND not completed
- ✅ **Backend:** `PATCH /api/activities/:id/outcome` — sets outcome (`مهتم` / `غير مهتم` / `معاودة الاتصال`) in `afterJson`
- ✅ **Frontend:** Red "متأخر" badge on overdue activities in the table status column
- ✅ **Frontend:** "متأخر" stat card with destructive red styling + AlertTriangle icon (grid now 5 columns)
- ✅ **Frontend:** "النتيجة" (Outcome) column with dropdown — only visible on completed activities
- ✅ **Frontend:** Outcome mutation wired to `PATCH /:id/outcome`, invalidates `['/api/activities']`

## Design decisions

- **No schema change:** Activities use `audit_logs.afterJson` (JSON string) to store `completed`, `outcome`, `title`, `notes`. Adding dedicated columns would pollute the shared audit table. This keeps the pattern consistent with existing toggle-complete.
- **Overdue is computed client-side** (via `isOverdue()` helper) for the table badges, and also available as a dedicated endpoint for cases where server-side filtering is needed (e.g. notification count).
- **Outcome dropdown only shows on completed activities** — doesn't make sense to set an outcome before the activity is done.

## Key code

```typescript
/** Check if an activity is overdue (E5). */
const isOverdue = (a: Activity) => {
  if (a.completed) return false;
  const scheduled = (a as any).scheduledDate || (a as any).scheduledAt;
  if (!scheduled) return false;
  return new Date(scheduled) < new Date();
};
```

## Files modified

- `apps/api/routes/activities.ts` — 2 new endpoints with TSDoc
- `apps/web/src/pages/platform/activities/index.tsx` — overdue badge, outcome column, stat card

## Related
- [[Features/CRM Core]]
- [[Sessions/Enhancement Plan E1-E20]]
