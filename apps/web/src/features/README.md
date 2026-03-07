# Features (New Architecture)

Feature-based organization. Each feature owns its:
- Page component
- API hooks (useQuery/useMutation)
- Types
- Sub-components

## Structure

```
features/
  dashboard/
    DashboardPage.tsx    # Page component
    useDashboard.ts     # Data hooks
  contacts/
    ContactsPage.tsx
    useContacts.ts
  ...
```

## Usage

- Import pages from `@/features/<name>/<Page>`
- Use `PageShell` for consistent layout
- Use `apiClient` from `@/lib/apiClient` for API calls
- Use tokens from `@/config/platform-theme`

## Migration

Existing pages in `pages/platform/` remain. New features go here.
Gradually migrate pages by moving to features/ and updating routes.
