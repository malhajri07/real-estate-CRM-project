---
tags: [session, completed, pool]
created: 2026-04-11
session: E9
status: done
---

# E9 - Pool Enhancements ✅

**Page:** `apps/web/src/pages/platform/pool/index.tsx`

## Shipped

- ✅ **Backend:** `GET /api/pool/:id/match-score` — compares buyer request criteria vs agent's active listings (city + price range overlap); returns 0-100 score + matchedListings count
- ✅ **Backend:** `claimCount` field added to pool search response (counts ALL active claims per request)
- ✅ **Backend:** `claimExpiresAt` field added (current agent's claim expiry date)
- ✅ **Frontend:** "X وسطاء" badge showing interested agents count per request
- ✅ **Frontend:** Claim expiry countdown badge: "ينتهي خلال 3 يوم" in orange
- ✅ **Frontend:** New "وسطاء" column in the pool table

## No schema change needed
`claims.expiresAt DateTime` already existed in the schema.

## Files modified
- `apps/api/routes/buyer-pool.ts` — match-score endpoint, claimCount + claimExpiresAt in response, TSDoc
- `apps/web/src/pages/platform/pool/index.tsx` — BuyerRequest type, table column, badges

## Related
- [[Features/Buyer Pool]]
- [[Sessions/Enhancement Plan E1-E20]]
