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
- Frontend: `RouteGuard` in `apps/web/src/components/auth/RouteGuard.tsx` checks `allowedRoles`
- Frontend: `useAuth().hasRole()` hides owner-only UI (e.g. team page management buttons)
- Backend: middleware checks `req.user.roles` — two tiers:
  - `requireOrgMember` — any CORP_OWNER / CORP_AGENT / WEBSITE_ADMIN (read access)
  - `requireOwnerOrAdmin` — only CORP_OWNER / WEBSITE_ADMIN (write access)
- See [[Architecture/Org Isolation]] for tenant scoping

## Team page access model (org-team.ts)
| Endpoint | CORP_OWNER | CORP_AGENT | WEBSITE_ADMIN |
|---|---|---|---|
| GET (view team, stats, leaderboard, performance) | ✅ | ✅ read-only | ✅ |
| POST/PUT/PATCH (invite, edit, toggle, transfer) | ✅ | ❌ hidden + 403 | ✅ |
| Frontend buttons (invite, edit, hours, role change) | visible | hidden | visible |

## Login flow
1. User enters Saudi mobile (+966)
2. OTP sent via SMS provider (Unifonic/Twilio)
3. User enters 6-digit code
4. JWT issued with `userId`, `roles`, `organizationId`
5. Frontend stores token, all requests carry `Authorization: Bearer <token>`
