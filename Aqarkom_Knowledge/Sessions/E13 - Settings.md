---
tags: [session, completed, settings]
created: 2026-04-11
session: E13
status: done
---

# E13 - Settings Enhancements ✅

**Page:** `apps/web/src/pages/platform/settings/index.tsx` + `AccountSection.tsx`

## Shipped

- ✅ **Database:** `login_history` table (userId, loginAt, ipAddress, userAgent)
- ✅ **Backend:** Login events recorded on admin login + OTP verify (fire-and-forget)
- ✅ **Backend:** `GET /api/auth/login-history` — last 10 logins with device parsing
- ✅ **Frontend:** Missing profile fields are clickable — navigate to the correct section (profile/professional/payments)
- ✅ **Frontend:** "Login History" card in security tab showing last 10 logins with device icon + IP + relative time
- ✅ **Frontend:** parseUserAgent helper for device display (Mobile/Chrome/Firefox/Safari)

## Files modified
- `data/schema/prisma/schema.prisma` — login_history model
- `apps/api/routes/auth.ts` — login event recording + login-history endpoint + TSDoc
- `apps/web/src/pages/platform/settings/index.tsx` — clickable missing fields with section mapping
- `apps/web/src/pages/platform/settings/AccountSection.tsx` — LoginHistory component

## Related
- [[Architecture/Authentication & RBAC]]
- [[Sessions/Enhancement Plan E1-E20]]
