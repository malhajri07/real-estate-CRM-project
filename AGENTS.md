# AGENTS.md

## Cursor Cloud specific instructions

- **Package manager**: pnpm (lockfile: `pnpm-lock.yaml`). Run `pnpm install` to install dependencies.
- **Build**: `npx vite build` from the workspace root. Compiles the frontend; output goes to `dist/public/`.
- **Dev server**: `pnpm dev` starts the unified Express + Vite dev server on port 3000. Requires PostgreSQL running on localhost:5432.
- **Lint**: `npx eslint .` — ESLint is configured but ignores `.ts`/`.tsx` files (only lints `.js`/`.jsx`).
- **TypeScript**: `npx tsc --noEmit` — has pre-existing errors in some files (scripts, services); not all are fixable without schema changes.
- **Tests**: `pnpm test` is configured but the referenced test file does not exist. E2E smoke tests use Playwright: run `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test --reporter=list` (requires dev server running and Playwright chromium installed via `npx playwright install chromium`).
- **Docker**: Docker daemon must be started before PostgreSQL: `sudo dockerd &>/dev/null &` then wait ~5s. Requires `fuse-overlayfs` storage driver and `iptables-legacy` in this Cloud environment (already configured in the VM snapshot).
- **Database**: PostgreSQL 15 required. Use Docker: `sudo docker compose -f docker-compose.dev.yml up -d postgres-dev`. DATABASE_URL must use `schema=public` (not `schema=real_estate_crm`) because migration SQL uses explicit `"public"."tablename"` qualifiers. Run `pnpm db:generate` after schema changes, `pnpm db:deploy` for migrations, `pnpm db:seed-saudi-geography` and `pnpm db:agent1` for seed data.
- **shadcn/ui components**: Located at `apps/web/src/components/ui/`. ALL pages (platform + admin) use shadcn components exclusively. Design tokens (`PAGE_WRAPPER`, `CARD_STYLES`, etc.) live in `config/platform-theme.ts`. Status variant helpers live in `lib/status-variants.ts`. Both sidebars (platform + admin) use the shadcn Sidebar system from `components/ui/sidebar.tsx`. Use shadcn components and platform-theme tokens; avoid custom style constants.
- **Landing page**: The landing page (`pages/landing.tsx` and `components/landing/*`) is the ONLY area that retains Tailwind-heavy styling with Aurora/Glass design patterns. All other pages use shadcn components.
- **Login credentials** (after seeding): `agent1` / `123456` (INDIV_AGENT role). Admin user exists but password hash may be stale.
