---
tags: [session, completed, property-detail]
created: 2026-04-10
session: E8
status: done
---

# E8 — Property Detail Enhancements ✅

**Page:** `apps/web/src/pages/platform/properties/detail.tsx`

## Shipped

- ✅ **Database:** `property_price_history` table (propertyId, oldPrice, newPrice, changedAt, changedBy)
- ✅ **Backend:** `GET /api/listings/:id/interested-count` — favorites count
- ✅ **Backend:** `GET /api/listings/:id/price-history` — price change timeline
- ✅ **Backend:** Price tracking on `PUT /api/listings/:id` — auto-records to history when price changes
- ✅ **Frontend:** Real similar properties from DB (replaced `SIMILAR_PROPERTIES_PLACEHOLDER` with `GET /:id/similar`)
- ✅ **Frontend:** "X مهتم" badge next to status badge showing favorites count
- ✅ **Frontend:** Real price history timeline — shows "950K → 900K" with ارتفاع/انخفاض badges and dates
- ✅ **Frontend:** Similar property cards clickable, navigating to `/listing/:id`

## Files modified

- `data/schema/prisma/schema.prisma` — new `property_price_history` model
- `apps/api/routes/listings.ts` — 2 new endpoints + price tracking in PUT handler + TSDoc
- `apps/web/src/pages/platform/properties/detail.tsx` — 3 new queries, real similar/price/interested UI

## Related
- [[Features/Properties & Listings]]
- [[Plans/Enhancement Plan E1-E20]]
