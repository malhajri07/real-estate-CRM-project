---
tags: [feature, compliance, rega, legal]
created: 2026-04-10
---

# REGA Compliance

The platform is designed to satisfy **Saudi Real Estate General Authority (REGA)** rules. Compliance is not optional and is enforced both at form-validation and DB-constraint levels.

## Required licenses

| License | Held by | Used for |
|---|---|---|
| **FAL** | Brokerage / agency | Permits brokerage activity |
| **Ad license** | Per listing | Required to publish a listing publicly |
| **REGA agent ID** | Each agent | Linked to user profile |

## Financial rules

| Rule | Value | Enforcement |
|---|---|---|
| Commission cap | **2.5%** of sale value | Validated on deal create/update |
| RETT (Real Estate Transaction Tax) | **5%** | Calculated on closed deals |

## Phone validation

Saudi mobile numbers only: `+966 5X XXX XXXX`. Validated by `apps/api/lib/validation/saudi-phone.ts` (and matching frontend zod schema).

## Listing checklist

Before a listing can move from `DRAFT` → `PENDING_APPROVAL`:
- [x] FAL license number present
- [x] Ad license number present
- [x] GASTAT-compliant category + type
- [x] Valid Saudi address (city + district)
- [x] At least one photo

## Audit

All compliance-relevant mutations are written to `audit_logs` (immutable append-only).

## Related
- [[Architecture/Authentication & RBAC]]
- [[Features/Properties & Listings]]
