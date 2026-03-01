# AGENTS.md

## Cursor Cloud specific instructions

- **Package manager**: pnpm (lockfile: `pnpm-lock.yaml`). Use `pnpm install --frozen-lockfile`.
- **Build**: `npx vite build` from the workspace root. Compiles the frontend; output goes to `dist/public/`.
- **Dev server**: `pnpm dev` starts the unified Express + Vite dev server on port 3000.
- **Lint**: ESLint is configured but platform page files under `apps/web/src/pages/platform/` are currently ignored by the eslint config.
- **Tests**: `pnpm test` runs the analytics test suite. E2E tests use Playwright (`pnpm e2e`).
- **Database**: Uses Prisma with schema at `data/schema/prisma/schema.prisma`. Run `pnpm db:generate` to regenerate the Prisma client after schema changes.
- **shadcn/ui components**: Located at `apps/web/src/components/ui/`. Platform theme constants in `apps/web/src/config/platform-theme.ts` are still used by many pages; only `PAGE_WRAPPER` and variant helpers like `getLeadStatusVariant` should be kept when refactoring pages to pure shadcn.
- **pnpm build warnings**: `pnpm install` may warn about ignored build scripts for `better-sqlite3`, `bufferutil`, and `esbuild`. The `pnpm-workspace.yaml` has `onlyBuiltDependencies: '@prisma/client'` which handles this; no action needed.
