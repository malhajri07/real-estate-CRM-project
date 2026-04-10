---
tags: [architecture, api, backend]
created: 2026-04-10
---

# API Routes

**Source:** `apps/api/routes/*.ts`
**Total route files:** 57 (snapshot 2026-04-10)

## Conventions
- Mounted under `/api/<domain>`
- Auth: `authenticateToken` middleware (JWT)
- Org scoping: `injectOrgFilter` (read) + `injectWriteFilter` (write)
- Validation: `zod` schemas
- Rate limit: 100 req/min general, 10 req/min on auth routes

## Major route groups

| Path | File | Purpose |
|---|---|---|
| `/api/auth` | `auth.ts` | OTP login, JWT issue, refresh |
| `/api/leads` | `leads.ts` | CRUD + batch assign + leadScore |
| `/api/customers` | `customers.ts` | Customer master |
| `/api/deals` | `deals.ts` | Pipeline + forecast + stage history |
| `/api/listings` | `listings.ts` | Properties + REGA validation |
| `/api/appointments` | `appointments.ts` | Calendar |
| `/api/activities` | `activities.ts` | Tasks + follow-ups |
| `/api/tenancies` | `tenancies.ts` | Rentals + payment schedule |
| `/api/buyer-pool` | `buyer-pool.ts` | Shared buyer requests |
| `/api/campaigns` | `campaigns.ts` | Marketing campaigns |
| `/api/inbox` | `inbox.ts` | Two-way WhatsApp |
| `/api/chatbot` | `chatbot.ts` | Conversational property search |
| `/api/reports` | `reports.ts` | Dashboard metrics + custom reports |
| `/api/notifications` | `notifications.ts` | `/count` aggregator |
| `/api/client-portal` | `client-portal.ts` | Buyer/seller portal API |
| `/api/projects` | `projects.ts` | Off-plan |
| `/api/promotions` | `promotions.ts` | Listing boosts |

## Recent additions
- `POST /api/leads/batch/assign` — bulk reassign ([[Sessions/E2 - Leads]])
- `GET /api/deals/forecast` — pipeline forecast ([[Sessions/E3 - Pipeline]])
- `GET /api/notifications/count` — actionable notification aggregator
- `GET /api/appointments/conflicts` — time-slot overlap detection ([[Sessions/E4 - Calendar]])
