---
tags: [feature]
created: {{date}}
updated: {{date}}
status: active
---

# {{Feature Name}}

## Purpose
One-paragraph description of what this feature does and why it exists.

## User stories
- As a **{{role}}**, I can **{{action}}** so that **{{benefit}}**

## Architecture
- **Frontend:** `apps/web/src/pages/platform/{{page}}.tsx`
- **API:** `apps/api/routes/{{route}}.ts`
- **Database:** `{{model}}` table in Prisma schema

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/{{route}}` | List all |
| POST | `/api/{{route}}` | Create new |

## Related
- [[Architecture/API Routes]]
- [[Architecture/Database Schema]]
