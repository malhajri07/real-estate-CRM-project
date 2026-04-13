---
tags: [reference, credentials, admin]
created: 2026-04-10
---

# Admin Credentials

> ⚠️ Local development only — never commit to public repos.

## Platform admin

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |
| Login route | `/admin/login` |
| Required | `isActive = true` in `users` table |

## Demo agents (mobile + OTP)

Login uses Saudi mobile + OTP. In dev mode the OTP is logged to the API console.

| Phone | Role |
|---|---|
| `0560000001` | INDIV_AGENT |
| `0560001005` | CORP_AGENT |
| `0560002001` | CORP_OWNER |

(Subject to seed data — verify with `apps/api/seed.ts`.)

## Database

PostgreSQL connection string lives in `.env` (`DATABASE_URL`). Use `npx prisma studio` for a quick UI.

## Related
- [[Architecture/Authentication & RBAC]]
- [[Runbooks/Useful Commands]]
