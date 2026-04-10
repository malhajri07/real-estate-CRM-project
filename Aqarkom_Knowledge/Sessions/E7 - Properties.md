---
tags: [session, completed, properties]
created: 2026-04-10
session: E7
status: done
---

# E7 — Properties List Enhancements ✅

**Page:** `apps/web/src/pages/platform/properties/index.tsx`

## Shipped

- ✅ **Database:** `saved_filters` table (agentId, name, filterConfig JSON)
- ✅ **Backend:** `daysOnMarket` calculated field added to GET /api/listings response
- ✅ **Backend:** `GET/POST/DELETE /api/saved-filters` — filter preset CRUD (new route file)
- ✅ **Backend:** Route mounted at `/api/saved-filters` in routes.ts
- ✅ **Frontend:** "Listed X days" badge on property cards; red after 90 days (Clock icon)
- ✅ **Frontend:** "حفظ" (Save Filter) button — appears when filters are active, prompts for name
- ✅ **Frontend:** "المحفوظات" (Saved Presets) dropdown — loads saved filter config into active state

## Files modified

- `data/schema/prisma/schema.prisma` — new `saved_filters` model
- `apps/api/routes/saved-filters.ts` — new route file with TSDoc
- `apps/api/routes/listings.ts` — `daysOnMarket` calculated in item map
- `apps/api/routes.ts` — mounted saved-filters route
- `apps/web/src/pages/platform/properties/index.tsx` — saved filters query/mutation/UI
- `apps/web/src/pages/platform/properties/PropertiesGrid.tsx` — days-on-market badge

## Related
- [[Features/Properties & Listings]]
- [[Sessions/Enhancement Plan E1-E20]]
