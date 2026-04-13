---
tags: [incident, postmortem, frontend, recharts]
created: 2026-04-11
severity: high
status: resolved
---

# 2026-04-11 — Team Page Freeze

## What happened
The team management page (`/home/platform/team`) was completely unresponsive — "not clickable, freezing." Users could not interact with any element on the page.

## Root cause
Four Recharts chart components used **double-nested tooltips** — `<ReTooltip content={<ChartTooltip content={<ChartTooltipContent />} />} />` — nesting two Recharts Tooltip components inside each other. No other page in the codebase used this pattern. This caused rendering conflicts that froze the browser's main thread.

Additionally, the admin user (WEBSITE_ADMIN) had `organizationId: null`, causing the `/api/org/team` endpoint to return 400 errors, which react-query retried indefinitely.

## How it was fixed
1. Replaced all 4 double-nested tooltips with the correct pattern: `<ChartTooltip content={<ChartTooltipContent />} />`
2. Changed GET endpoints to return empty 200 responses (not 400) for users without an org
3. Added an empty state UI for users without an organization

## Timeline
- **Reported:** 2026-04-11 ~02:00
- **Diagnosed:** 2026-04-11 ~02:30 (API 400 + nested tooltips)
- **Fixed:** 2026-04-11 ~03:00
- **Verified:** 2026-04-11 ~03:10

## Prevention
- `/add-analytics-widget` skill now documents the correct chart tooltip pattern
- Skeleton audit ensures every page has a proper loading state

## Related
- Commit: `727fcb3`
- Files: `apps/web/src/pages/platform/team/index.tsx`, `apps/api/routes/org-team.ts`
