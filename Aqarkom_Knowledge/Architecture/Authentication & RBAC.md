---
tags: [architecture, auth, rbac, security]
created: 2026-04-10
---

# Authentication & RBAC

## Authentication

- **Primary method:** Mobile + OTP (Saudi market norm)
- **Token:** JWT, signed with `JWT_SECRET`, 7-day expiry
- **Refresh:** Sliding session via refresh token
- **Rate limit:** 10 req/min on `/api/auth/*`
- **Admin login:** username/password fallback for `WEBSITE_ADMIN`

## Roles

| Role | Scope |
|---|---|
| `WEBSITE_ADMIN` | Full platform access |
| `CORP_OWNER` | Owns an organization, sees all org agents |
| `CORP_AGENT` | Agent inside an organization, sees own data |
| `INDIV_AGENT` | Independent (no organization) |
| `BUYER` | Client portal — buyer view |
| `SELLER` | Client portal — seller view |

A user can hold multiple roles (`user_roles` join table).

## Permission gating
- Frontend: route guards in `apps/web/src/lib/auth.ts`
- Backend: middleware checks `req.user.roles`
- See [[Architecture/Org Isolation]] for tenant scoping

## Login flow
1. User enters Saudi mobile (+966)
2. OTP sent via SMS provider (Unifonic/Twilio)
3. User enters 6-digit code
4. JWT issued with `userId`, `roles`, `organizationId`
5. Frontend stores token, all requests carry `Authorization: Bearer <token>`
