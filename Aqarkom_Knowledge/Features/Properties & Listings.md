---
tags: [feature, properties, rega]
created: 2026-04-10
---

# Properties & Listings

## Classification

Listings follow **REGA + GASTAT** classification:

- **5 categories** × **33 property types**
- Each listing carries a **REGA ad license number**
- Validation enforced server-side on create/update

## Categories

1. **Residential** (سكني) — apartment, villa, duplex, traditional house, ...
2. **Commercial** (تجاري) — office, shop, showroom, warehouse, ...
3. **Industrial** (صناعي) — factory, workshop, ...
4. **Agricultural** (زراعي) — farm, palm grove, ...
5. **Land** (أراضي) — residential land, commercial land, ...

## Listing fields (selected)

- `regaId`, `adLicenseNumber`, `falLicenseNumber`
- `category`, `type` (constrained to GASTAT taxonomy)
- `purpose` — SALE | RENT
- `price`, `pricePerMeter`, `area`
- `city`, `district`, `coordinates` (lat/lng)
- `status` — DRAFT | PENDING_APPROVAL | ACTIVE | SOLD | RENTED | EXPIRED
- `agentId`, `organizationId`

## Lifecycle

```
DRAFT → PENDING_APPROVAL → ACTIVE → SOLD/RENTED
                         ↘ REJECTED
```

CORP_OWNER reviews `PENDING_APPROVAL` listings. Notification count includes pending approvals for owners.

## Related
- [[Features/REGA Compliance]]
- [[Features/Pipeline & Deals]]
- [[Features/Buyer Pool]]
