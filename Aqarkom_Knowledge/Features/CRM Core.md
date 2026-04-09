---
tags: [feature, crm]
created: 2026-04-10
---

# CRM Core

The heart of Aqarkom — leads, customers, activities, and the contact log that ties them together.

## Entities

- **Customer** (`customers`) — the person. Phone-unique within an organization.
- **Lead** (`leads`) — the *opportunity* wrapping a customer + intent (buy/rent/sell)
- **Activity** (`activities`) — task/follow-up, optionally tied to a lead/property
- **Contact log** (`contact_log`) — append-only history of every touchpoint

## Lead lifecycle

```
NEW → CONTACTED → QUALIFIED → CONVERTED → (deal created)
                                       ↘ LOST
```

## Lead score (0–100)

Calculated server-side in `GET /api/leads`:

| Field | Points |
|---|---|
| firstName | 15 |
| lastName | 10 |
| phone | 25 |
| email | 15 |
| city | 15 |
| source | 10 |
| notes | 10 |

Used by [[Sessions/E2 - Leads]] frontend to render a quality circle (red < 40, yellow < 70, green ≥ 70).

## Source tagging

`WEBSITE | REFERRAL | CHATBOT | PHONE | SOCIAL_MEDIA | WALK_IN`

Each source gets a colored badge in the leads table.

## Bulk operations

`POST /api/leads/batch/assign` — `{ leadIds, agentId }` for reassignment.

## Related
- [[Features/Pipeline & Deals]]
- [[Features/Chatbot]] — chatbot conversations create leads
