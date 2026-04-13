---
tags: [runbook, operations, auth, debugging]
created: 2026-04-13
updated: 2026-04-13
---

# Debug 403 Forbidden Errors

## When to use
A page or API call returns 403 (Forbidden) when you expect it to succeed.

## Common causes

### 1. Stale JWT token
The JWT was issued before a role change. The token has old roles baked in.
- **Fix:** Log out and log back in to get a fresh token.
- **Why it works:** `authenticateToken` middleware reads roles from DB, but the frontend `AuthProvider` uses the login response roles for UI gating.

### 2. Wrong role for the endpoint
Check which middleware the endpoint uses:
```
requireOrgMember     → CORP_OWNER, CORP_AGENT, WEBSITE_ADMIN (read)
requireOwnerOrAdmin  → CORP_OWNER, WEBSITE_ADMIN only (write)
requireAdmin         → WEBSITE_ADMIN only
```

### 3. No organizationId
Admin users (WEBSITE_ADMIN) have `organizationId: null`. Org-scoped endpoints return empty data, not 403.

## Steps

### 1. Identify the endpoint
Check browser DevTools → Network tab → find the 403 request → note the URL.

### 2. Check the middleware
```bash
grep -A3 "router.get.*{endpoint_path}" apps/api/routes/{file}.ts
```

### 3. Check the user's role
```bash
psql "postgresql://mohammedalhajri@localhost:5432/real_estate_crm" -c \
  "SELECT username, roles FROM users WHERE username = '{username}';"
```

### 4. Test with curl
```bash
TOKEN=$(curl -s http://localhost:3000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"{user}","password":"{pass}"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s -w " [%{http_code}]" "http://localhost:3000/api/{endpoint}" \
  -H "Authorization: Bearer $TOKEN"
```

## Related
- [[Architecture/Authentication & RBAC]]
- [[History/Incidents/2026-04-11 Team Page Freeze]]
