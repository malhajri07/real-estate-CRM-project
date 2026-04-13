---
tags: [reference, commands, dev]
created: 2026-04-10
---

# Useful Commands

## Dev servers

```bash
# Frontend (Vite)
cd apps/web && npm run dev

# Backend (Express + ts-node)
cd apps/api && npm run dev

# Both together (root)
npm run dev
```

## Database

```bash
# Apply schema changes (no migration file)
cd data/schema && npx prisma db push

# Generate client
npx prisma generate

# Inspect data visually
npx prisma studio

# Reseed
npx tsx apps/api/seed.ts
```

## Type checking

```bash
# Per workspace
cd apps/web && npx tsc --noEmit
cd apps/api && npx tsc --noEmit

# Both
npm run typecheck
```

## Testing

```bash
# Playwright E2E (41 tests)
npx playwright test

# Headed mode for debugging
npx playwright test --headed
```

## Stats

```bash
# Lines of code
cloc apps/ data/ --exclude-dir=node_modules,dist,build

# Table count
psql -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"
```
