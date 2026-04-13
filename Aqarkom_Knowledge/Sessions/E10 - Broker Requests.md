---
tags: [session, completed, broker-requests]
created: 2026-04-11
session: E10
status: done
---

# E10 - Broker Requests Enhancements ✅

**Page:** `apps/web/src/pages/platform/broker-requests/index.tsx`

## Shipped

- ✅ **Backend:** `GET /api/broker-requests/stats/monthly` — requests created/accepted per month (last 6 months)
- ✅ **Frontend:** Property thumbnail photo in request cards (parsed from `property.photos` JSON)
- ✅ **Frontend:** Agreement status timeline: 3-step dots (مقدم → مقبول → موقع) based on acceptance + agreement status
- ✅ **Frontend:** "مشاركة عبر واتساب" button on each card with pre-filled text (title, city, commission)

## No schema change needed
Property photos already included in the broker_requests query via `property: { select: { photos: true } }`.

## Files modified
- `apps/api/routes/broker-requests.ts` — monthly stats endpoint + TSDoc
- `apps/web/src/pages/platform/broker-requests/index.tsx` — thumbnail, timeline, WhatsApp share

## Related
- [[Features/Buyer Pool]]
- [[Plans/Enhancement Plan E1-E20]]
