---
tags: [session, completed, client-portal]
created: 2026-04-11
session: E15
status: done
---

# E15 - Client Portal Enhancements ✅

**Page:** Client portal API (`apps/api/routes/client-portal.ts`)

## Shipped

- ✅ **Database:** `agentRating Int?` + `agentReviewText String?` added to `viewing_feedback`
- ✅ **Backend:** Documents section in dashboard response (deal_documents across all client deals)
- ✅ **Backend:** Viewing history with feedback in dashboard response (viewing_feedback entries)
- ✅ **Backend:** `POST /api/client/rate-agent` — upsert agentRating + review text on viewing_feedback
- ✅ **Backend:** Agent ID included in appointment response for rating linkage

## Files modified
- `data/schema/prisma/schema.prisma` — agentRating + agentReviewText on viewing_feedback
- `apps/api/routes/client-portal.ts` — documents, viewings in dashboard, rate-agent endpoint + TSDoc

## Note
Frontend client portal page not modified in this session — the API contract is ready for frontend consumption. The client page itself would need a separate UI pass to render documents, viewings, and the star rating component.

## Related
- [[Features/CRM Core]]
- [[Plans/Enhancement Plan E1-E20]]
