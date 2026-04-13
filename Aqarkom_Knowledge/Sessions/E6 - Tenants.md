---
tags: [session, completed, tenants]
created: 2026-04-10
session: E6
status: done
---

# E6 — Tenants Enhancements ✅

**Page:** `apps/web/src/pages/platform/tenants/index.tsx`

## Shipped

- ✅ **Database:** `renewalReminderSentAt DateTime?` added to `tenancies` model
- ✅ **Backend:** `paymentSummary` (`{ total, paid, overdue, upcoming }`) computed per tenancy in GET / response
- ✅ **Backend:** `daysOverdue` field on each rent_payment in the response
- ✅ **Backend:** `POST /api/tenancies/:id/send-reminder` — generates WhatsApp renewal message, updates `renewalReminderSentAt`, returns wa.me deep link
- ✅ **Frontend:** Expiring tenancies sorted to top (urgent first by `daysUntilExpiry`)
- ✅ **Frontend:** Urgency-level badge: red "ينتهي خلال 3 يوم" (< 7 days) vs warning orange (< 90 days)
- ✅ **Frontend:** Overdue payments highlighted with red border + "4,000 ر.س · متأخر 15 يوم" text
- ✅ **Frontend:** "تذكير بالتجديد عبر واتساب" button in detail sheet for expiring tenancies, shows last reminder date

## Files modified

- `data/schema/prisma/schema.prisma` — `renewalReminderSentAt DateTime?` on tenancies
- `apps/api/routes/tenancies.ts` — paymentSummary, daysOverdue, send-reminder endpoint + TSDoc
- `apps/web/src/pages/platform/tenants/index.tsx` — sorting, badges, overdue styling, reminder button

## Related
- [[Features/CRM Core]]
- [[Plans/Enhancement Plan E1-E20]]
