# HYPER PLAN — Design & Layout Unification

> **Goal:** Unify every visual surface of the app into a single coherent design system, eliminate duplicate UI patterns, remove valueless labels, and ensure full Arabic localization across all pages.
>
> **Scope:** `apps/web/src/` — all pages, components, and styles
>
> **Priority order:** Critical bugs → Design system foundation → Component consolidation → Page-by-page fixes → Localization cleanup

---

## AUDIT FINDINGS SUMMARY

### Critical Design Inconsistencies Found

| Category | Issues Found | Severity |
|----------|-------------|----------|
| Two competing MetricCard implementations | `components/dashboard/MetricCard.tsx` vs `components/admin/MetricCard.tsx` | HIGH |
| Hardcoded colors (emerald, blue, slate, red) instead of CSS variables | 30+ instances across 12 files | HIGH |
| `listing/index.tsx` uses raw `<a>` tag + `ui-surface` class + hardcoded colors | 1 file | HIGH |
| `unverified-listing/index.tsx` uses hardcoded `bg-emerald-600` buttons | 1 file | HIGH |
| Duplicate status label switch statements (Arabic) | 4+ files | HIGH |
| AdminCard (glass morphism) vs Card (standard) inconsistency | All admin pages | MEDIUM |
| Page header pattern inconsistency (some have icon+title+subtitle, some don't) | 3+ pages | MEDIUM |
| Hardcoded badge colors in moderation, complaints, articles pages | 3 files | MEDIUM |
| Map polygon colors hardcoded as hex/rgba strings | 1 file | MEDIUM |
| Two ListingCard / PropertiesMap card styles inconsistent | 2 files | LOW |
| Bulk actions repeat same labels as per-row actions in articles-management | 1 file | LOW |

---

## PHASE 1 — Design System Foundation
**Files:** `globals.css`, `tailwind.config.ts`, new `constants/labels.ts`
**Goal:** Establish single source of truth for colors, spacing, and Arabic labels.

### 1.1 — CSS Variables Layer

Add to `apps/web/src/index.css` (or globals.css):

```css
/* Brand color scale — used everywhere instead of hardcoded emerald/blue */
--color-brand: theme(colors.emerald.600);
--color-brand-hover: theme(colors.emerald.700);
--color-brand-light: theme(colors.emerald.50);
--color-brand-text: theme(colors.emerald.700);

/* Status colors */
--color-pending: theme(colors.yellow.500);
--color-pending-bg: theme(colors.yellow.50);
--color-approved: theme(colors.emerald.500);
--color-approved-bg: theme(colors.emerald.50);
--color-rejected: theme(colors.red.500);
--color-rejected-bg: theme(colors.red.50);
--color-info: theme(colors.blue.500);
--color-info-bg: theme(colors.blue.50);

/* Surface layers */
--surface-glass: rgba(255,255,255,0.7);
--surface-icon-container: theme(colors.slate.50);
--surface-icon-text: theme(colors.slate.600);
```

Add Tailwind utility classes in `tailwind.config.ts`:
```ts
extend: {
  colors: {
    brand: 'var(--color-brand)',
    'brand-hover': 'var(--color-brand-hover)',
    'brand-light': 'var(--color-brand-light)',
  }
}
```

**Files to edit:**
- `apps/web/src/index.css` — add CSS variables block
- `tailwind.config.ts` — extend colors with CSS variable aliases

---

### 1.2 — Centralized Arabic Labels / Status Constants

Create `apps/web/src/constants/labels.ts`:

```ts
// Lead status labels
export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'جديد',
  qualified: 'مؤهل',
  viewing: 'معاينة',
  negotiation: 'تفاوض',
  closed: 'مغلق',
  lost: 'مفقود',
};

// Property listing status labels
export const LISTING_STATUS_LABELS: Record<string, string> = {
  pending: 'بانتظار المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  active: 'نشط',
  inactive: 'غير نشط',
  under_review: 'قيد المراجعة',
  needs_info: 'مطلوب معلومات',
};

// Support / ticket status labels
export const TICKET_STATUS_LABELS: Record<string, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلقة',
};

// Interest type labels
export const INTEREST_TYPE_LABELS: Record<string, string> = {
  buying: 'شراء',
  selling: 'بيع',
  renting: 'تأجير',
};

// Marital status labels
export const MARITAL_STATUS_LABELS: Record<string, string> = {
  single: 'أعزب',
  married: 'متزوج',
  divorced: 'مطلق',
  widowed: 'أرمل',
};

// Property type labels
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'شقة',
  villa: 'فيلا',
  land: 'أرض',
  commercial: 'تجاري',
  office: 'مكتب',
  warehouse: 'مستودع',
};

// Time period labels (for charts/metrics)
export const TIME_PERIOD_LABELS = {
  today: 'اليوم',
  week7: '٧ أيام',
  month30: '٣٠ يوم',
} as const;
```

**Files to remove duplicate switch statements from:**
- `apps/web/src/pages/platform/leads/index.tsx` (lines 36-73)
- `apps/web/src/pages/admin/complaints-management.tsx` (lines 53-70)
- `apps/web/src/components/admin/AdminStatusBadge.tsx` (lines 27-32)
- `apps/web/src/pages/platform/moderation.tsx` (any status labels)

---

### 1.3 — Unified StatusBadge Component

Refactor `apps/web/src/components/admin/AdminStatusBadge.tsx` to use `LISTING_STATUS_LABELS` and standardized badge variants:

```tsx
// Use this component everywhere status is displayed
export function StatusBadge({ status }: { status: string }) {
  const label = LISTING_STATUS_LABELS[status] ?? status;
  const variant = STATUS_VARIANT_MAP[status] ?? 'outline';
  return <Badge variant={variant}>{label}</Badge>;
}
```

Map variants to CSS variable colors so only one component covers all status types.

---

## PHASE 2 — Component Consolidation

### 2.1 — Merge Duplicate MetricCard Implementations

**Problem:** Two files, two styles, same purpose:
- `apps/web/src/components/dashboard/MetricCard.tsx` — `bg-white border border-slate-100 rounded-2xl`
- `apps/web/src/components/admin/MetricCard.tsx` — `glass border-0 rounded-2xl hover:shadow-2xl`

**Fix:** Keep ONE canonical MetricCard in `components/ui/metric-card.tsx` with optional `variant` prop:
```tsx
<MetricCard variant="glass" ... />   // admin use
<MetricCard variant="default" ... /> // dashboard use
```

**Files to update after:**
- All admin pages importing from `components/admin/MetricCard`
- All dashboard pages importing from `components/dashboard/MetricCard`

---

### 2.2 — Unify Page Header Pattern

**Problem:** Some pages (moderation.tsx) have consistent icon + title + subtitle header; others (cms-landing/index.tsx) don't.

**Fix:** Create `apps/web/src/components/ui/page-section-header.tsx`:
```tsx
interface PageSectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}
```

Use this component as the standard page header across:
- All admin pages
- All platform dashboard pages
- Moderation, articles, cms-landing, user-management, etc.

---

### 2.3 — Standardize Icon Container

**Problem:** Throughout admin and dashboard pages, icon containers are hardcoded:
- `bg-blue-50 text-blue-600 rounded-2xl` (cms-landing)
- `bg-slate-50 text-slate-600 rounded-xl` (dashboard)
- `bg-blue-50 text-blue-600 rounded-2xl` (moderation)

**Fix:** Extract to a utility component `<IconContainer>` or Tailwind class `icon-container`:
```css
.icon-container {
  @apply bg-brand-light text-brand rounded-2xl p-3 flex items-center justify-center;
}
```

---

### 2.4 — AdminCard vs Card Decision

The `AdminCard` (glass morphism) is aesthetically different from base `Card`. This creates visual inconsistency within the admin section itself.

**Decision:** Use `AdminCard` (glass morphism) only for metric cards and summary cards at the top of admin pages. Use standard `Card` for all data tables, forms, and content sections.

Document this rule in a comment at the top of `AdminCard.tsx`.

---

### 2.5 — Unify Empty State Usage

**Problem:** Some pages create custom "no data" messages; `EmptyState` component exists but is underused.

**Fix:** Replace all custom empty divs in these files:
- `apps/web/src/pages/platform/agents/detail.tsx` (lines 73-77)
- Any admin table with custom "لا توجد نتائج" divs

**Rule:** Every table/list must use `<EmptyState>` component when data is empty.

---

## PHASE 3 — Page-by-Page Fixes

### 3.1 — `apps/web/src/pages/listing/index.tsx` — CRITICAL

**Current state (broken design):**
```tsx
// Line 61 — hardcoded color
<p className="text-2xl font-bold text-emerald-700 mb-2">
// Line 66 — raw <a> tag, not Button component, hardcoded color
<a href={`https://wa.me/...`} className="bg-emerald-600 text-white px-4 py-2 rounded">
// Line 52 — custom ui-surface class
<div className="ui-surface ...">
```

**Fix:**
```tsx
// Line 61 — use design token
<p className="text-2xl font-bold text-brand mb-2">
// Line 66 — use Button component
<Button asChild variant="default" size="lg">
  <a href={`https://wa.me/...`} target="_blank" rel="noopener noreferrer">
    تواصل عبر واتساب
  </a>
</Button>
// Line 52 — use Card component
<Card className="p-6">
```

---

### 3.2 — `apps/web/src/pages/unverified-listing/index.tsx`

**Issues:**
- `bg-emerald-600 hover:bg-emerald-700` buttons → use `<Button variant="default">`
- `text-red-500` required field markers → use `text-destructive`
- `border-emerald-200 bg-white text-emerald-700` file input → use `border-border bg-background text-brand`
- `shadow-emerald-500/20` → remove or use CSS variable shadow

**Fix pattern:** Replace all `emerald-*` references with `brand` alias or Button component.

---

### 3.3 — `apps/web/src/pages/admin/moderation.tsx`

**Issues:**
- Line 85: `bg-slate-50 text-slate-500 border-0` (property type badge) → use `<Badge variant="secondary">`
- Line 88: `bg-blue-50 text-blue-600 border-0` → use `<Badge variant="outline">`
- Line 107: `bg-yellow-100 text-yellow-800 border-yellow-200` → use `<StatusBadge status="pending">`
- Line 122: `text-slate-600 hover:bg-slate-100` (approve button) → use `<Button variant="ghost" size="sm">`
- Line 131: `text-red-400 hover:text-red-600 hover:bg-red-50` → use `<Button variant="ghost" size="sm" className="text-destructive">`
- Line 148: `bg-blue-50 text-blue-600 rounded-2xl` → use `<IconContainer>` utility class

---

### 3.4 — `apps/web/src/pages/admin/articles-management.tsx`

**Issues:**
- Line 678: `h-11 bg-white/50` inconsistent input styling
- Line 734: `bg-blue-600 border-blue-600` (submit button) → use `<Button variant="default">`
- Line 760: `bg-slate-800 border-slate-800` (tags styling) → use `<Badge>` component
- Line 825: `bg-blue-600 hover:bg-blue-700` → use `<Button variant="default">`
- **Duplicate bulk actions**: Remove duplicate labels. The bulk action bar and per-row actions both say "نشر", "أرشفة", "حذف". Per-row actions should only have icons (no text labels). Bulk action bar keeps text.

---

### 3.5 — `apps/web/src/pages/admin/cms-landing/index.tsx`

**Issues:**
- Line 344: `bg-blue-50 text-blue-600 rounded-2xl` → use `<IconContainer>`
- Line 354: `text-slate-600 hover:bg-slate-50` → use `<Button variant="ghost">`
- Line 407: `bg-slate-900 text-white` (selected section button) → use `<Button variant="default">`
- Line 408: `bg-white/50 border border-slate-100 text-slate-600` (unselected) → use `<Button variant="outline">`
- Line 430: `bg-emerald-500/20 text-emerald-300` → use `<Badge variant="secondary">`
- Line 372: `bg-blue-50 text-blue-700` → use `<Badge variant="outline">`
- **Add page header** with icon + title + subtitle matching moderation.tsx pattern.

---

### 3.6 — `apps/web/src/pages/map/components/PropertiesMap.tsx`

**Issues:**
- Line 305: `strokeColor: "#1d4ed8"` → use CSS variable `getComputedStyle(document.documentElement).getPropertyValue('--color-brand')`
- Line 308: `fillColor: "rgba(37,99,235,0.15)"` → same approach
- Line 318: `strokeColor: "#0f9d58"` → define as constant at top of file
- Line 240: `bg-slate-100/70` container → use `bg-muted/70`

---

### 3.7 — `apps/web/src/pages/platform/leads/index.tsx`

**Issues:**
- Lines 36-73: Duplicate status/type switch statements
- Fix: Import from `constants/labels.ts` → `LEAD_STATUS_LABELS`, `INTEREST_TYPE_LABELS`, `MARITAL_STATUS_LABELS`
- Replace switch statements with lookup: `LEAD_STATUS_LABELS[status] ?? status`

---

### 3.8 — `apps/web/src/pages/admin/complaints-management.tsx`

**Issues:**
- Lines 53-70: Duplicate status labels → import from `constants/labels.ts`
- Lines 55-58: `bg-red-50 text-red-700 border-red-200` etc. → use `<StatusBadge status={ticket.status}>`

---

### 3.9 — `apps/web/src/components/landing/PricingCards.tsx`

**Issues:**
- `from-emerald-50 to-emerald-50` → use `bg-brand-light`
- `from-emerald-600 to-teal-600` (CTA button gradient) → use `bg-brand hover:bg-brand-hover`
- `to-blue-900` dark gradient → define as a CSS class `landing-dark-gradient`
- `px-4 py-2 rounded-full bg-purple-50/80` (Most Popular badge) → use `<Badge>`

---

### 3.10 — `apps/web/src/components/landing/LandingFooter.tsx`

**Issues:**
- `from-slate-900 via-slate-800 to-slate-900` → extract to CSS class `landing-footer`
- `from-emerald-900/10 to-blue-900/10` overlay → extract to CSS class `landing-footer-overlay`

---

### 3.11 — `apps/web/src/components/dashboard/MetricCard.tsx`

**Issues:**
- `bg-white border border-slate-100 rounded-2xl` → use `<Card>` base or CSS variable surface
- Icon container hardcoded `bg-slate-50 text-slate-600` → use `<IconContainer>`

---

## PHASE 4 — Localization Cleanup

All pages are already Arabic. The remaining cleanup is consolidating hardcoded strings into the constants layer.

### 4.1 — Remove Valueless Labels

| Location | Label | Action |
|----------|-------|--------|
| `moderation.tsx:165` | "إعلانات جديدة" under metric (already shown by number) | Remove subtitle if redundant |
| `articles-management.tsx` per-row buttons | Text on icon buttons ("نشر", "أرشفة") | Remove text, keep icon + tooltip only |
| `dashboard.tsx` metric cards | "اليوم" appears both in card subtitle and in chart | Keep only in chart |

### 4.2 — Standardize Date/Time Labels

Replace all hardcoded `"اليوم"`, `"٧ أيام"`, `"٣٠ يوم"` strings with `TIME_PERIOD_LABELS` from constants.

### 4.3 — Ensure `dir="rtl"` is set at root

Verify `apps/web/src/App.tsx` or `index.html` sets `dir="rtl"` and `lang="ar"` on `<html>`, so no page needs to set it individually.

---

## PHASE 5 — Table Style Unification

All tables already use TanStack React Table. The unification work is visual, not structural.

### 5.1 — Standardize Table Wrapper

Every table must be wrapped in:
```tsx
<Card>
  <CardContent className="p-0">
    <Table> ... </Table>
  </CardContent>
</Card>
```
Pages that currently render tables inside plain divs need the Card wrapper added.

### 5.2 — Table Row Hover State

Ensure every table row has consistent hover:
```css
/* In globals */
.table-row-hover tbody tr:hover {
  @apply bg-muted/50 cursor-pointer;
}
```

### 5.3 — Standardize Empty Table State

Every DataTable/AdminTable must render `<EmptyState>` when `data.length === 0`.

---

## PHASE 6 — Redundant Function Removal

### 6.1 — Remove Duplicate Status Helpers

After `constants/labels.ts` is created, remove these local implementations:
- `getStatusLabel()` function in `leads/index.tsx`
- Inline switch in `complaints-management.tsx`
- Inline switch in `AdminStatusBadge.tsx`
- Any other local `getXxxLabel()` functions

### 6.2 — Consolidate RevenueChart + ReportCharts

`apps/web/src/pages/platform/reports/ReportCharts.tsx` and `apps/web/src/components/dashboard/RevenueChart.tsx` both render Recharts charts with similar configuration. Extract shared chart config (axis props, tooltip style, grid style) to:
```ts
// apps/web/src/lib/chart-defaults.ts
export const CHART_DEFAULTS = { ... }
```

### 6.3 — Remove `ui-surface` Custom Class

`listing/index.tsx` uses `ui-surface` class that isn't defined in shadcn or the design system. Replace with `Card` component everywhere.

---

## EXECUTION ORDER (Recommended)

```
Phase 1 (Foundation) — do first, unblocks everything else
  1.1 CSS variables in index.css
  1.2 Create constants/labels.ts
  1.3 Refactor StatusBadge to use constants

Phase 2 (Components) — parallel work
  2.1 Merge MetricCard implementations
  2.2 Create PageSectionHeader component
  2.3 Create IconContainer class/component
  2.4 Document AdminCard vs Card rule

Phase 3 (Pages) — fix page by page, highest impact first
  Priority 1: listing/index.tsx (broken design)
  Priority 2: unverified-listing/index.tsx (public-facing)
  Priority 3: moderation.tsx, articles-management.tsx
  Priority 4: cms-landing, complaints-management, leads
  Priority 5: map, dashboard, forum (minor fixes only)

Phase 4 (Localization) — cleanup pass after phases 1-3
Phase 5 (Tables) — wrapper standardization pass
Phase 6 (Cleanup) — remove dead code, duplicate helpers
```

---

## QUICK WINS (< 15 min each)

1. Add `dir="rtl" lang="ar"` to `index.html` root element
2. Create `constants/labels.ts` with all status label maps
3. Replace `<a href="https://wa.me/...">` with `<Button asChild>` in `listing/index.tsx`
4. Remove text labels from per-row action buttons in `articles-management.tsx` (icons only)
5. Replace `text-red-*` / `text-blue-*` hardcoded badge classes in `moderation.tsx` with `<StatusBadge>`

---

## FILE CHANGE SUMMARY

| File | Change Type | Priority |
|------|-------------|----------|
| `apps/web/src/index.css` | Add CSS variables | P1 |
| `apps/web/index.html` | Add `dir="rtl" lang="ar"` | P1 |
| `apps/web/src/constants/labels.ts` | **NEW** — Arabic label constants | P1 |
| `apps/web/src/components/admin/AdminStatusBadge.tsx` | Use constants, remove switch | P1 |
| `apps/web/src/pages/listing/index.tsx` | Replace `<a>` with Button, Card, brand colors | P1 |
| `apps/web/src/pages/unverified-listing/index.tsx` | Replace hardcoded emerald with Button/brand | P1 |
| `apps/web/src/pages/admin/moderation.tsx` | Replace all hardcoded badge classes | P2 |
| `apps/web/src/pages/admin/articles-management.tsx` | Remove duplicate labels, fix button colors | P2 |
| `apps/web/src/pages/admin/cms-landing/index.tsx` | Fix hardcoded colors, add page header | P2 |
| `apps/web/src/pages/admin/complaints-management.tsx` | Use constants, fix badge colors | P2 |
| `apps/web/src/pages/platform/leads/index.tsx` | Use constants, remove switch | P2 |
| `apps/web/src/components/dashboard/MetricCard.tsx` | Merge with admin MetricCard | P2 |
| `apps/web/src/components/landing/PricingCards.tsx` | Replace hardcoded gradients | P3 |
| `apps/web/src/components/landing/LandingFooter.tsx` | Extract gradient to CSS class | P3 |
| `apps/web/src/pages/map/components/PropertiesMap.tsx` | Replace hex colors with constants | P3 |
| `apps/web/src/pages/platform/dashboard.tsx` | Fix icon container colors | P3 |
| `apps/web/src/components/ui/metric-card.tsx` | **NEW** — unified MetricCard | P2 |
| `apps/web/src/components/ui/page-section-header.tsx` | **NEW** — unified page header | P2 |
| `apps/web/src/lib/chart-defaults.ts` | **NEW** — shared chart config | P3 |
| `tailwind.config.ts` | Add brand color aliases | P1 |

---

*Generated: 2026-03-27 | Based on full codebase audit*
