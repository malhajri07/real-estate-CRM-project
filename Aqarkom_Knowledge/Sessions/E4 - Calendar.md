---
tags: [session, completed, calendar]
created: 2026-04-10
session: E4
status: done
---

# E4 — Calendar Enhancements ✅

**Page:** `apps/web/src/pages/platform/calendar/index.tsx`

## Shipped

- ✅ **Database:** `duration Int @default(30)` added to `appointments` model (minutes)
- ✅ **Backend:** `GET /api/appointments/conflicts?date=X&time=Y&duration=Z` — finds overlapping appointments for the agent using time-range intersection
- ✅ **Backend:** `duration` field accepted in `POST /api/appointments` (15-480 min, default 30)
- ✅ **Frontend:** Right sidebar (25% width, `lg:` breakpoint) showing selected day's agenda as a sorted list with duration, customer, property, conflict badges
- ✅ **Frontend:** Overlapping appointments highlighted with orange `ring-[hsl(var(--warning))]` border in both the grid and the sidebar
- ✅ **Frontend:** Day headers clickable to switch the agenda sidebar; selected day shown with primary ring
- ✅ **Frontend:** Duration picker in the create form (15/30/45/60/90/120 min)
- ��� **Frontend:** Duration displayed in the appointment detail sheet
- ✅ **Frontend:** Empty-day state in sidebar with quick "إضافة موعد" button

## Key code

### Conflict detection (backend)
```typescript
// Time-range overlap: appt overlaps if apptStart < proposedEnd AND apptEnd > proposedStart
const overlapping = conflicts.filter((appt) => {
  const apptStart = new Date(appt.scheduledAt);
  const apptEnd = new Date(apptStart.getTime() + (appt.duration || 30) * 60 * 1000);
  return apptEnd > start;
});
```

### Overlap detection (frontend)
```typescript
const overlappingIds = useMemo(() => {
  const ids = new Set<number>();
  const sorted = [...appointments].sort(byTime);
  for (let i = 0; i < sorted.length; i++) {
    const aEnd = aStart + (sorted[i].duration || 30) * 60 * 1000;
    for (let j = i + 1; j < sorted.length; j++) {
      if (bStart >= aEnd) break;
      ids.add(sorted[i].id); ids.add(sorted[j].id);
    }
  }
  return ids;
}, [appointments]);
```

## Files modified

- `data/schema/prisma/schema.prisma` — `duration Int @default(30)` on appointments
- `apps/api/routes/appointments.ts` — conflict endpoint + duration in create/schema
- `apps/web/src/pages/platform/calendar/index.tsx` — sidebar, overlap highlighting, duration picker

## Lessons
- Conflict detection uses a sweep-line approach on sorted appointments — O(n log n)
- Sidebar only visible on `lg:` breakpoint to avoid cramming on mobile
- Duration in minutes (not ISO 8601) — simpler for the select dropdown and DB storage

## Related
- [[Features/CRM Core]]
- [[Sessions/Enhancement Plan E1-E20]]
