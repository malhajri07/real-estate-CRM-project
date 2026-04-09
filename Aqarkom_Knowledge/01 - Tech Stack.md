---
tags: [tech, stack, reference]
created: 2026-04-10
---

# 01 — Tech Stack

## Frontend (`apps/web`)
- **React 18** + **TypeScript** + **Vite**
- **shadcn/ui** + **Radix primitives** + **Tailwind CSS**
- **TanStack React Query** for data fetching
- **@hello-pangea/dnd** for Kanban pipeline
- **react-hook-form** + **zod** for forms
- **IBM Plex Sans Arabic** font, RTL-first
- **Emerald theme** (hue 160) via CSS variables

## Backend (`apps/api`)
- **Express.js** + **TypeScript**
- **Prisma ORM** + **PostgreSQL**
- **JWT** auth + **OTP mobile login** (no passwords)
- Rate limiting middleware: 100 req/min API, 10 req/min auth
- Org isolation middleware: `injectOrgFilter`, `injectWriteFilter`

## Data
- **PostgreSQL** (78 tables)
- Schema: [[Architecture/Database Schema]]

## Tooling
- **Playwright** E2E (41 tests)
- **Terraform** for infra (remote backend)
- **claude-mem** persistent memory plugin

## Repo Layout

```
real-estate-CRM-project/
├── apps/
│   ├── web/        # React frontend
│   └── api/        # Express backend
├── data/
│   └── schema/     # Prisma schema
├── docs/
└── Aqarkom_Knowledge/   # ← this Obsidian vault
```
