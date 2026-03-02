# AGENTS.md

## Cursor Cloud specific instructions

- **Package manager**: pnpm (lockfile: `pnpm-lock.yaml`). Run `pnpm install` to install dependencies.
- **Build**: `npx vite build` from the workspace root. Compiles the frontend; output goes to `dist/public/`.
- **Dev server**: `pnpm dev` starts the unified Express + Vite dev server on port 3000. Requires PostgreSQL running on localhost:5432.
- **Lint**: `npx eslint .` — ESLint is configured but ignores `.ts`/`.tsx` files (only lints `.js`/`.jsx`).
- **TypeScript**: `npx tsc --noEmit` — has pre-existing errors in some files (scripts, services); not all are fixable without schema changes.
- **Tests**: `pnpm test` runs the analytics test suite. E2E tests use Playwright (`pnpm e2e`).
- **Database**: PostgreSQL 15 required. Use Docker: `sudo docker compose -f docker-compose.dev.yml up -d postgres-dev`. DATABASE_URL must use `schema=public` (not `schema=real_estate_crm`) because migration SQL uses explicit `"public"."tablename"` qualifiers. Run `pnpm db:generate` after schema changes, `pnpm db:deploy` for migrations, `pnpm db:seed-saudi-geography` and `pnpm db:agent1` for seed data.
- **shadcn/ui components**: Located at `apps/web/src/components/ui/`. All platform pages now use shadcn components (Card, Table, Button, Badge, Dialog, Sheet, Alert, etc.) instead of custom platform-theme style constants. Only `PAGE_WRAPPER` and variant helpers (`getLeadStatusVariant`, `getPropertyStatusVariant`, etc.) from `apps/web/src/config/platform-theme.ts` remain in use — do not re-introduce `CARD_STYLES`, `TABLE_STYLES`, `TYPOGRAPHY`, `BUTTON_PRIMARY_CLASSES`, `LOADING_STYLES`, `EMPTY_STYLES`, or `INPUT_STYLES`.
- **Login credentials** (after seeding): `agent1` / `123456` (INDIV_AGENT role). Admin user exists but password hash may be stale.
