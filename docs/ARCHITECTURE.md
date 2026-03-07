# Architecture (Post-Restart)

## Design System

**`apps/web/src/config/platform-theme.ts`**

Single source of truth for UI tokens:
- `PAGE_WRAPPER` – outer div for all platform pages
- `CARD_STYLES` – standard card container
- `TYPOGRAPHY` – title, subtitle, body classes
- `BUTTON_PRIMARY_CLASSES` – primary action button
- `BADGE_STYLES` – status badges
- `TABLE_STYLES` – table layout
- `LOADING_STYLES` – skeleton animation
- `EMPTY_STYLES` – empty state container
- `METRICS_CARD_STYLES` – dashboard metric cards
- `PLATFORM_BG` – page background

Use these constants instead of ad-hoc Tailwind classes.

## API Client

**`apps/web/src/lib/apiClient.ts`**

Unified API abstraction:
- `apiGet<T>(path)` – GET request, returns typed JSON
- `apiPost<T>(path, body)` – POST
- `apiPut<T>(path, body)` – PUT
- `apiPatch<T>(path, body)` – PATCH
- `apiDelete<T>(path)` – DELETE

Auth token is attached automatically. Use for new code; existing `apiRequest` remains for compatibility.

## Page Template

**`apps/web/src/components/layout/PageShell.tsx`**

Standard page wrapper with:
- `PAGE_WRAPPER` + `dir={dir}`
- `PageHeader` (title, subtitle, actions)
- Error state → `QueryErrorFallback`
- Loading state → custom slot (e.g. `TableSkeleton`)
- Content

```tsx
<PageShell
  title="..."
  subtitle="..."
  isError={isError}
  errorMessage="..."
  onRetry={refetch}
  isLoading={isLoading}
  loadingSlot={<TableSkeleton />}
>
  {content}
</PageShell>
```

## Feature Structure (Future)

**`apps/web/src/features/`**

Target structure for new features:
```
features/
  contacts/
    ContactsPage.tsx
    useContacts.ts
  dashboard/
    DashboardPage.tsx
    useDashboard.ts
```

Existing pages in `pages/platform/` stay. New features go in `features/`. Migrate gradually.

## Migration Checklist

- [ ] Use `PAGE_WRAPPER` from platform-theme for page wrappers
- [ ] Use `apiClient` for new API calls
- [ ] Use `PageShell` for new pages
- [ ] Use `CARD_STYLES` for card containers
- [ ] Remove hardcoded Arabic strings → translation keys
