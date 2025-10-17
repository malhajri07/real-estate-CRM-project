# Folder Restructure Plan

> Step 2 – Define the target layout and map existing directories.

**Progress Update (Step 4)**
- `client/` ➜ `apps/web/` with Vite/Tailwind/TS aliases updated.
- `server/` ➜ `apps/api/` with npm scripts, docs, and shell helpers updated.
- `shared/` ➜ `packages/shared/` with path aliases refreshed.
- `airflow/`, `db/`, `prisma/`, `models/`, `seeds/`, and `attached_assets/` consolidated under `data/{pipeline,schema,warehouse,raw-assets}` with env/docs/scripts updated.
- `npm run check` currently fails with pre-existing type errors in backend/frontend modules; follow-up passes blocked until those issues are resolved.

## Guiding Principles
- **Separate applications from shared packages** to clarify ownership (`apps/*` for deployable services, `packages/*` for libraries).
- **Group data & analytics tooling** under a dedicated namespace so dbt, Airflow, seeds, and SQL policies live together.
- **Keep generated artifacts out of source roots** and ensure tooling (`tsconfig`, `vite`, Prisma) uses path aliases rather than hard-coded directories.

## Proposed Top-Level Layout
```
apps/
  web/            # former client/ (React Vite app)
  api/            # former server/ (Express + jobs)
packages/
  shared/         # former shared/ (types, utilities)
  config/         # central config helpers (future home for scripts/)
data/
  warehouse/      # dbt models, macros, seeds, snapshots (models/, seeds/, macros/, snapshots/)
  pipeline/       # Airflow DAGs and orchestration assets (airflow/)
  schema/         # Prisma schema & SQL policies (prisma/, db/, db/policies/)
  raw-assets/     # attached_assets/ and other import datasets
docs/
  product/
  analytics/
infra/
  scripts/        # operational scripts (setup-db.sh, verify-clean-db.ts, etc.)
  deploy/         # cloudbuild.yaml, Dockerfile, ecosystem.config.js
output/
  dist/           # build artifacts
  tmp/            # temporary scratch files
legacy/
  rest-express@1.0.0/
  NODE_ENV=development
```

## Current → Target Mapping
| Current Path | Proposed Location | Notes/Required Updates |
|--------------|------------------|------------------------|
| `client/` | `apps/web/` | Update `vite.config.ts` root/aliases, adjust `package.json` scripts (`vite` cwd), ensure static assets move under `apps/web/public/` (or keep alias pointing to `data/raw-assets/`). |
| `server/` | `apps/api/` | Update import paths, `package.json` server scripts, `esbuild` build target, `ecosystem.config.js`. |
| `shared/` | `packages/shared/` | Update TS path aliases (`tsconfig.json`, server/client tsconfigs) from `@shared/*` to new location. |
| `attached_assets/` | `data/raw-assets/` (or `apps/web/public/assets/` if only frontend) | Adjust asset imports and CSV references (`apps/api/import-saudi-customers.ts`). |
| `db/`, `prisma/`, `seeds/` | `data/schema/` | Prisma CLI expects `schema.prisma` path; update `package.json` / scripts (`prisma generate`, etc.). |
| `models/`, `dbt_project.yml`, `profiles.yml`, `seeds/` (dbt seeds) | `data/warehouse/` | Keep relative paths inside `dbt_project.yml`; update environment variables pointing to old directories. |
| `airflow/` | `data/pipeline/airflow/` | Update `.env`, `env.example`, and docs referencing `AIRFLOW_HOME=./airflow`. |
| `scripts/` | `infra/scripts/` or split into `packages/config/` | Update any npm scripts expecting `scripts/*.ts`. |
| `docs/` + Markdown root files | `docs/product/` & `docs/analytics/` | Update README links. |
| `dist/`, `tmp/` | `output/dist/`, `output/tmp/` or ensure `.gitignore` handles new paths. |
| Legacy artifacts (`rest-express@1.0.0`, `NODE_ENV=development`) | `legacy/` or archive | Decide whether to delete or archive; remove from repo if obsolete. |

## Configuration & Alias Impact
- **TypeScript (`tsconfig.json`)**: adjust `baseUrl` and `paths` to new structure (e.g. `@/` → `apps/web/src/*`, `@shared/` → `packages/shared/*`).
- **Vite (`vite.config.ts`)**: update `root`, `resolve.alias`, and asset alias to accommodate `apps/web/` root and relocated static assets.
- **Prisma**: update CLI invocations (`npx prisma generate`) with `--schema` pointing to `data/schema/prisma/schema.prisma` if moved.
- **DBT**: update environment variables (`DBT_PROJECT_DIR`, `DBT_PROFILES_DIR`) in `.env`, `env.example`, `README-ANALYTICS.md`.
- **Airflow**: change `AIRFLOW_HOME` references and documentation.
- **npm Scripts**: ensure `dev:client`, `build`, and `esbuild` commands reference new directories.
- **CI/CD (`cloudbuild.yaml`, Dockerfile, start scripts)**: update COPY paths and working directories.

## Clean-Up & Ignore Strategy
- Confirm `.gitignore` excludes `output/`, `target/`, `.turbo/`, etc. after relocation.
- Remove generated artifacts (`dist/`) and scratch workspaces (`tmp/`), or regenerate within a new `output/` directory.
- Update ignore rules (`.gitignore`) as directories move (e.g., added `tmp` exclusion in Step 3).
- Verify no tooling relies on absolute paths (search for `/client/` or `/server/` hard-coding).

## Verification Checklist After Migration
1. `npm run check` (TypeScript) succeeds with updated `tsconfig`.
2. `npm run dev:server` / `npm run dev:client` work with new paths.
3. `vite build` and `esbuild` produce artifacts in `output/dist/`.
4. Prisma migrations and seeds run from `data/schema/`.
5. dbt and Airflow docs updated; env templates reflect new structure.

## Automation & Documentation Notes
- Use `python3 scripts/list_directory_structure.py --max-depth 3` for quick inventory snapshots post-changes.
- Central scripts (`scripts/setup-db.sh`) and docs now reference `data/schema/prisma/schema.prisma`; run `npx prisma ... --schema data/schema/prisma/schema.prisma`.
- Analytics workflows rely on `data/warehouse` (dbt) and `data/pipeline/airflow`; ensure deployment pipelines copy the `data/` subtree.
- Outstanding work: resolve existing TypeScript errors (`npm run check`) before finalizing the restructure rollout.

This plan sets the target structure for subsequent steps (cleanup, migrations, documentation updates).
