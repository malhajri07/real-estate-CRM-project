---
tags: [feature, pool, marketplace]
created: 2026-04-10
---

# Buyer Pool

Shared marketplace where any agent in the platform can claim a buyer or owner request.

## Page

`apps/web/src/pages/platform/pool/index.tsx`
Tab name: **الطلبات العقارية** (Property Requests)

## Two sub-sections

1. **Buyer requests** — people looking for a property to buy/rent
2. **Owner requests** — owners who need an agent to sell/rent for them

## Claim mechanic

- Agent clicks "Claim" → row added to `claims` table with `expiresAt = now + 7 days`
- During claim window, only the claiming agent can see contact details
- After expiry, the request returns to the open pool

## Match score *(planned E9)*

`GET /api/pool/:id/match-score` — compares request criteria against the agent's active inventory and returns 0–100.

## Owner request → brokerage deal

When a CORP_OWNER claims an owner request, the system surfaces the option to lock the owner into a brokerage agreement (REGA-compliant template).

## Related
- [[Features/REGA Compliance]]
- [[Features/Properties & Listings]]
