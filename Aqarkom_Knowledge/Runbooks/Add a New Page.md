---
tags: [runbook, operations, frontend, scaffolding]
created: 2026-04-13
updated: 2026-04-13
---

# Add a New Platform Page

## When to use
You need to create a new page accessible from the platform sidebar.

## Fastest path
Use the `/add-page` skill:
```
/add-page
```
It scaffolds the full page with skeleton, sidebar entry, and route.

## Manual steps

### 1. Create the page file
`apps/web/src/pages/platform/{name}/index.tsx`

Must include:
- `useMinLoadTime()` + skeleton guard
- `PAGE_WRAPPER` layout
- `PageHeader` with Arabic title
- File-level JSDoc header

### 2. Create the skeleton
Add to `apps/web/src/components/skeletons/page-skeletons.tsx`:
- Match the page's grid/card/table structure
- Use `animate-pulse` at top level
- Use design tokens (`border-border`, `bg-card`, `rounded-2xl`)

### 3. Add lazy import in App.tsx
```tsx
const NewPage = lazy(() => import("@/pages/platform/{name}"));
```

Add to `platformShellRoutes`:
```tsx
{ path: '/home/platform/{name}', component: NewPage, aliases: ['/{name}'], allowedRoles: PLATFORM_CORE_ROLES },
```

### 4. Add sidebar entry
Edit `apps/web/src/config/platform-sidebar.ts`:
```tsx
{
  id: "{name}",
  label: "العنوان بالعربي",
  path: "/home/platform/{name}",
  icon: SomeIcon,
  matchPaths: ["/{name}"],
  allowedRoles: PLATFORM_CORE_ROLES,
},
```

### 5. Verify
- [ ] `/typecheck` — 0 errors
- [ ] Page loads with skeleton then content
- [ ] Sidebar link appears and highlights correctly
- [ ] RTL layout renders correctly

## Related
- [[Engineering/Skeleton Audit]]
- [[Architecture/Frontend Structure]]
