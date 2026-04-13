---
tags: [session, completed, leads]
created: 2026-04-10
session: E2
status: done
---

# E2 — Leads Enhancements ✅

**Page:** `apps/web/src/pages/platform/leads/index.tsx`

## Shipped

- ✅ Checkbox column + bulk action bar (assign to agent, delete selected)
- ✅ Source badge column (WEBSITE/REFERRAL/CHATBOT/PHONE/SOCIAL_MEDIA/WALK_IN)
- ✅ Quality score circle (red < 40, yellow < 70, green ≥ 70) based on profile completeness
- ✅ `POST /api/leads/batch/assign` — bulk reassignment
- ✅ `leadScore` calculated field in `GET /api/leads`
- ✅ Edit button properly wired (`setDetailLead(lead)` before form reset)
- ✅ Table padding zeroed: `[&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:h-9`
- ✅ Card padding removed: `<CardContent className="p-0">`

## Lead score formula

Server-side in `apps/api/routes/leads.ts`:

```ts
let score = 0;
if (customer?.firstName) score += 15;
if (customer?.lastName) score += 10;
if (customer?.phone) score += 25;
if (customer?.email) score += 15;
if (customer?.city) score += 15;
if (lead.source) score += 10;
if (lead.notes) score += 10;
```

## Lessons
- Edit button needed `setDetailLead(lead)` to wire the save mutation, not just `openEditForm`
- User wants tight tables (no padding) for high information density

## Related
- [[Features/CRM Core]]
- [[Plans/Enhancement Plan E1-E20]]
