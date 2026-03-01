# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
Single-package Node.js project (Express API + React/Vite frontend) served on a unified port. Not a monorepo. Key directories: `apps/api/` (backend), `apps/web/` (frontend), `packages/shared/` (shared types/RBAC), `data/schema/prisma/` (Prisma schema + migrations).

### Required Services
- **PostgreSQL 16** must be running. Start with `sudo pg_ctlcluster 16 main start`.
- **Redis** is optional; the app works without it (sessions use PostgreSQL via `connect-pg-simple`).

### Database
- `DATABASE_URL` in `.env` must point to a valid PostgreSQL instance. The current cloud setup uses `postgresql://crm:crm123@localhost:5432/real_estate_crm?schema=public`.
- Generate Prisma client: `npx prisma generate --schema=data/schema/prisma/schema.prisma`
- Deploy migrations: `npx prisma migrate deploy --schema=data/schema/prisma/schema.prisma`
- The `prisma db seed` command will partially fail due to a pre-existing missing `support_categories` table reference in `data/schema/prisma/seed.ts`. Use `npx tsx scripts/create-agent1.ts` to create the agent1 test user instead.

### Dev Server
- `npm run dev` starts the unified Express + Vite server on port 3000 (API + frontend).
- See `docs/LOCAL_DEV.md` for development workflow details.

### Test Accounts
- **admin** / `admin123` (role: WEBSITE_ADMIN) — password was reset from the migration hash during setup.
- **agent1** / `123456` (role: INDIV_AGENT) — created by `scripts/create-agent1.ts`.

### Lint / TypeScript / Tests
- `npx eslint .` — runs lint (ESLint config ignores all `.ts/.tsx` files, only lints `.js/.jsx`).
- `npx tsc --noEmit` — pre-existing type errors exist in 3 files under `apps/web/src/pages/platform/` (tag mismatches). These were fixed for Vite to work but may regress.
- No automated test files exist; `npm run test` references a non-existent file.

### Build Scripts (pnpm)
`pnpm.onlyBuiltDependencies` is configured in `package.json` to allow Prisma, esbuild, and better-sqlite3 build scripts. Without this, `pnpm install` will skip these critical postinstall scripts.

### Gotchas
- The `.env` file ships with a macOS peer-auth `DATABASE_URL` that won't work in cloud environments. It must be updated to use explicit credentials.
- The server process appears to exit in background terminal logs but remains running (the child Vite process keeps it alive).
- Auth rate limiting is aggressive (5 attempts per 15 minutes on `/api/auth/login`). During testing, restart the server if locked out.
