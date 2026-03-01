# Tailwind → Shadcn Replacement Plan

**Goal:** Replace Tailwind-heavy custom styling with Shadcn/ui components across the application.

**Note:** Shadcn/ui is built on Tailwind. This plan migrates from *custom Tailwind token objects* (platform-theme.ts) and *inline Tailwind* to *Shadcn component variants and composition*.

---

## 1. Current State

### What Exists
- **Shadcn:** 55 components in `components/ui` (Button, Card, Badge, Table, Dialog, etc.)
- **platform-theme.ts:** Token objects (CARD_STYLES, TABLE_STYLES, BADGE_STYLES, LOADING_STYLES, etc.)
- **Usage:** Pages mix Shadcn components with `className={CARD_STYLES.container}` or `getLeadStatusBadge()`

### Tailwind-Heavy Areas
| Area | Count | Usage |
|------|-------|-------|
| platform-theme.ts | 30+ | CARD_STYLES, TABLE_STYLES, BADGE_STYLES, TYPOGRAPHY, etc. |
| Platform pages | 20+ | Leads, Pool, Properties, Clients, etc. |
| Admin pages | 5+ | Requests, Moderation, CMS |
| Custom components | 10+ | filter-bar, action-bar, empty-state, loading-state |

---

## 2. Replacement Strategy

### Phase 1: Extend Shadcn Variants
Replace platform-theme tokens with Shadcn variant props.

| Current | Replace With |
|---------|--------------|
| `Badge className={cn(BADGE_STYLES.base, getLeadStatusBadge(status))}` | `Badge variant={getLeadStatusVariant(status)}` |
| `Button className={BUTTON_PRIMARY_CLASSES}` | `Button` (default variant) or `Button variant="default"` |
| `Card className={CARD_STYLES.container}` | `Card` (default Shadcn Card) |
| `className={TABLE_STYLES.headerCell}` | `TableHead` (default) |

### Phase 2: Replace Helper Functions
Replace status helpers to return Shadcn variant names instead of class strings:

| Helper | Current | Replace With |
|--------|---------|--------------|
| `getLeadStatusBadge(status)` | Returns `BADGE_STYLES.*` class string | `getLeadStatusVariant(status)` → `"warning" \| "info" \| "orange" \| "purple" \| "success" \| "destructive" \| "secondary"` |
| `getPropertyStatusBadge(status)` | Returns `BADGE_STYLES.*` class string | `getPropertyStatusVariant(status)` → variant name |
| `getNotificationStatusBadge(status)` | Returns `BADGE_STYLES.*` class string | `getNotificationStatusVariant(status)` → variant name |

Usage change:
```tsx
// Before
<Badge className={cn(BADGE_STYLES.base, getLeadStatusBadge(lead.status))}>

// After
<Badge variant={getLeadStatusVariant(lead.status)}>
```

### Phase 3: Add Missing Badge Variants
Extend `components/ui/badge.tsx` to include:
- `orange` – for "showing" lead status
- `purple` – for "negotiating" / "negotiation" lead status

```ts
// Add to badgeVariants
orange: "border-transparent bg-orange-500/15 text-orange-600",
purple: "border-transparent bg-purple-500/15 text-purple-600",
```

### Phase 4: Custom Components Migration
Migrate components that use `COMPONENT_STYLES` or platform-theme tokens:

| Component | Current | Target |
|-----------|---------|--------|
| `filter-bar.tsx` | `COMPONENT_STYLES` from theme.ts | Shadcn Input, Select, Button |
| `action-bar.tsx` | `ACTION_BAR_STYLES` | Shadcn Card + Button |
| `empty-state.tsx` | `EMPTY_STYLES` | Shadcn Card + typography |
| `loading-state.tsx` | `LOADING_STYLES` | Shadcn Skeleton or spinner |
| `page-header.tsx` | `TYPOGRAPHY` | Shadcn typography |

### Phase 5: Card & Table Migration
- **Card:** Remove `className={CARD_STYLES.container}`; use default Shadcn Card. Add `variant` prop if needed (e.g. `accent="emerald"` for CARD_ACCENTS).
- **Table:** Use `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` without `TABLE_STYLES` classes; rely on Shadcn defaults or extend variants.

### Phase 6: Button Migration
- Replace `className={BUTTON_PRIMARY_CLASSES}` with `Button` (default) or `Button variant="default"`.
- Ensure Shadcn Button default variant matches emerald gradient; otherwise add `primary` variant to `button.tsx`.

---

## 3. File-by-File Migration Order

### High Impact (many usages)
1. `platform-theme.ts` – Add variant helpers, deprecate class-based helpers
2. `components/ui/badge.tsx` – Add orange, purple variants
3. `components/ui/button.tsx` – Add/align primary variant if needed
4. `components/ui/card.tsx` – Add optional accent variants

### Platform Pages (by usage count)
1. `platform/reports/index.tsx` (~18 Card usages)
2. `platform/leads/index.tsx`
3. `platform/properties/index.tsx`
4. `platform/clients/index.tsx`
5. `platform/notifications/index.tsx`
6. `platform/pool/index.tsx`
7. `platform/customers/index.tsx`
8. `platform/dashboard.tsx`
9. `platform/agencies/*`, `platform/agents/*`
10. `platform/calendar/index.tsx`, `platform/forum/index.tsx`, `platform/settings/index.tsx`, etc.

### Admin Pages
1. `admin/requests.tsx`

### Custom Components
1. `filter-bar.tsx`, `action-bar.tsx`, `empty-state.tsx`, `loading-state.tsx`, `page-header.tsx`

---

## 4. Prerequisites

- Ensure Shadcn components use logical properties (RTL-safe)
- Preserve `getIconSpacing(dir)` for icon spacing
- Keep `NUMERIC_LOCALE = "en-US"` for numbers
- Date formatting remains language-specific (`locale` from `useLanguage`)

---

## 5. Testing Checklist

- [ ] All badge statuses render correctly (lead, property, notification)
- [ ] RTL layout unchanged
- [ ] Cards, tables, buttons visually consistent
- [ ] No regressions in filter-bar, action-bar, empty-state, loading-state
- [ ] Build passes: `pnpm run build`
- [ ] Lint passes: `pnpm run lint`

---

## 6. Rollback Strategy

- Keep `platform-theme.ts` exports until migration complete; mark deprecated with JSDoc
- New variant helpers can coexist with old class helpers during transition
- Migrate page-by-page; verify each before moving to next
