---
tags: [incident, postmortem, database, seed]
created: 2026-04-12
severity: medium
status: resolved
---

# 2026-04-12 — Seed Data: All Members CORP_OWNER

## What happened
On the team page, every member showed as "مالك المنظمة" (CORP_OWNER). A real organization should have 1 owner and multiple agents.

## Root cause
The seed script (`apps/api/scripts/seed-full-data.ts`) used `i % 10 === 0` to assign CORP_OWNER based on the global loop index. This broke across multiple seed runs because:
- When i=0 lands on org A → owner. When i=10 lands on org A again → second owner.
- Some orgs ended up with 10 owners, others with 0.

102 orgs were affected: 9 had ALL owners, 90 had ALL agents, only 3 had a correct mix.

## How it was fixed
1. **Database fix:** SQL update set earliest member per org as CORP_OWNER, rest as CORP_AGENT. Updated 182 users across 102 orgs.
2. **Seed script fix:** Replaced `i % 10 === 0` with per-org tracking using `orgHasOwner` Set — first agent per org gets CORP_OWNER, rest get CORP_AGENT.
3. **Middleware fix:** Split `requireOwnerOrAdmin` into `requireOrgMember` (read) + `requireOwnerOrAdmin` (write) so CORP_AGENT can view the team page.
4. **Frontend fix:** Added `canManage` flag using `useAuth().hasRole()` to hide owner-only buttons from agents.

## Timeline
- **Reported:** 2026-04-12
- **Diagnosed:** 2026-04-12 (DB query confirmed 9 orgs with 10 owners each)
- **Fixed:** 2026-04-12 (DB + seed script + middleware + UI)
- **Verified:** 2026-04-13 (all 102 orgs have exactly 1 owner)

## Prevention
- Seed script now tracks `orgHasOwner` Set — deterministic regardless of run count
- Verification query added to [[Runbooks/Reset Demo Data]]

## Related
- Commits: `a9f451a`, `37ca5e7`, `b97f9cc`
- Files: `apps/api/scripts/seed-full-data.ts`, `apps/api/routes/org-team.ts`, `apps/web/src/pages/platform/team/index.tsx`
