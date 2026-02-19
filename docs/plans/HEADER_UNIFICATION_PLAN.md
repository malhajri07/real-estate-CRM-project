# Plan: Unify Platform Header Design

**Created:** 2026-02-08  
**Status:** Implemented  
**Scope:** All platform pages under `/home/platform/*`

---

## 1. Executive Summary

Unify the header across all platform pages with consistent:
- **Font size** – Page title and subtitle typography
- **Buttons** – Primary and secondary actions
- **Search bar** – Width, height, placeholder, behavior
- **Container** – Width and height alignment
- **Design system** – Apply design tokens from `platform-theme.ts` and `theme.ts`

---

## 2. Current State Analysis

### 2.1 Header Architecture

| Component | Location | Purpose |
|-----------|----------|---------|
| **Header** | `components/layout/header.tsx` | Global sticky header (all platform pages) |
| **PlatformShell** | `components/layout/PlatformShell.tsx` | Wraps content, passes `title`, `searchPlaceholder` to Header |
| **RouteGuard** | `components/auth/RouteGuard.tsx` | Passes `shellProps` from route config to PlatformShell |

### 2.2 Current Header Specs

| Element | Current Value | Issue |
|---------|---------------|------|
| **Height** | `h-[4.25rem]` (68px) | Fixed, not from design tokens |
| **Container** | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | Aligns with main content |
| **Title font** | `text-lg font-black lg:text-xl` | Different from page body `TYPOGRAPHY.pageTitle` (text-2xl/3xl) |
| **Subtitle** | `text-xs font-bold uppercase tracking-[0.2em]` | "Aqarkom Platform" badge |
| **Search input** | `h-11 rounded-2xl max-w-2xl` | No `onSearch` callback wired – search is non-functional |
| **Search icon** | `h-4 w-4` | Position varies by RTL |
| **Buttons** | Ghost, icon, rounded-xl | Inconsistent with `BUTTON_PRIMARY_CLASSES` |

### 2.3 Route → Header Mapping

| Route | Has `options`? | Title | SearchPlaceholder |
|-------|-----------------|-------|-------------------|
| `/home/platform` (Dashboard) | No | (undefined) | `nav.search` |
| `/home/platform/leads` | No | (undefined) | `nav.search` |
| `/home/platform/properties` | No | (undefined) | `nav.search` |
| `/home/platform/customers` | No | (undefined) | `nav.search` |
| `/home/platform/pipeline` | No | (undefined) | `nav.search` |
| `/home/platform/clients` | No | (undefined) | `nav.search` |
| `/home/platform/reports` | No | (undefined) | `nav.search` |
| `/home/platform/notifications` | No | (undefined) | `nav.search` |
| `/home/platform/settings` | No | (undefined) | `nav.search` |
| `/home/platform/customer-requests` | Yes | طلبات العملاء | ابحث في بيانات العملاء |
| `/home/platform/unverified-listings` | Yes | إعلانات غير موثقة | ابحث في الإعلانات غير الموثقة |
| All others | No | (undefined) | `nav.search` |

**Gap:** Most routes have no `title` → header shows no page title. Page content often has its own `<h1>` duplicating structure.

### 2.4 Page-Internal Headers

Many pages render their own header section:

- **Dashboard** – Custom gradient welcome card with `text-4xl font-black`
- **Forum** – `TYPOGRAPHY.pageTitle`, custom layout
- **Pool** – `TYPOGRAPHY.pageTitle`, custom search bar in content
- **Leads, Properties, Customers** – Card with `CardTitle` / `TYPOGRAPHY.cardTitle`
- **Calendar, Settings, Reports** – Mixed `text-2xl font-bold` or `TYPOGRAPHY.pageTitle`

**Result:** Two levels of headers (global + page) with inconsistent typography.

---

## 3. Design Tokens (Reference)

From `platform-theme.ts` and `theme.ts`:

| Token | Value | Use |
|-------|-------|-----|
| `TYPOGRAPHY.pageTitle` | `text-2xl lg:text-3xl font-black text-slate-900 tracking-tight` | Page title |
| `TYPOGRAPHY.pageSubtitle` | `text-base lg:text-lg text-slate-600 leading-relaxed` | Subtitle |
| `INPUT_STYLES.search` | `rounded-xl py-2.5`, emerald focus | Search input |
| `BUTTON_PRIMARY_CLASSES` | `rounded-xl font-bold`, emerald gradient | Primary buttons |
| `COMPONENT_STYLES.pageHeader` | `mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4` | Header layout |

---

## 4. Proposed Changes

### Phase 1: Centralize Route → Header Config

**4.1.1 Create `platform-header-config.ts`**

```ts
// apps/web/src/config/platform-header-config.ts

export type HeaderConfig = {
  titleKey: string;           // e.g. "nav.leads"
  searchPlaceholderKey?: string;  // e.g. "leads.search_placeholder"
  searchContext?: 'leads' | 'properties' | 'listings' | 'pool' | 'global';
  showSearch?: boolean;
};

export const PLATFORM_HEADER_CONFIG: Record<string, HeaderConfig> = {
  '/home/platform': { titleKey: 'nav.dashboard', searchPlaceholderKey: 'nav.search', searchContext: 'global' },
  '/home/platform/leads': { titleKey: 'nav.leads', searchPlaceholderKey: 'leads.search_placeholder', searchContext: 'leads' },
  '/home/platform/properties': { titleKey: 'nav.properties', searchPlaceholderKey: 'properties.search_placeholder', searchContext: 'listings' },
  '/home/platform/customers': { titleKey: 'nav.customers', searchPlaceholderKey: 'leads.search_placeholder', searchContext: 'leads' },
  // ... for all routes
};
```

**4.1.2 Resolve config by path**

- Use `useLocation()` from wouter to get current path
- Match path (including dynamic segments like `/agency/:id`) to config
- For dynamic routes, derive from static prefix (e.g. `/home/platform/agency/123` → agency config)

**4.1.3 Wire App.tsx routes**

- Option A: Keep `options` in route config but **derive from** `platform-header-config` to avoid duplication
- Option B: Remove `options` from routes; Header reads config by path

**Recommendation:** Option B – single source of truth in `platform-header-config.ts`.

---

### Phase 2: Unify Header Component Design

**4.2.1 Header design tokens**

Add to `platform-theme.ts` or `theme.ts`:

```ts
export const HEADER_STYLES = {
  height: 'h-[4.5rem]',           // 72px, consistent
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  title: 'text-xl font-black text-slate-900 tracking-tight lg:text-2xl',
  subtitle: 'text-xs font-bold uppercase tracking-[0.2em] text-emerald-600/80',
  searchHeight: 'h-11',
  searchMaxWidth: 'max-w-2xl',
  searchRounded: 'rounded-xl',
  buttonIcon: 'rounded-xl',
};
```

**4.2.2 Header component updates**

| Change | Before | After |
|--------|--------|-------|
| Title font | `text-lg font-black lg:text-xl` | `HEADER_STYLES.title` (text-xl → text-2xl) |
| Container | Inline classes | `HEADER_STYLES.container` |
| Height | `h-[4.25rem]` | `HEADER_STYLES.height` |
| Search input | Inline classes | Use `INPUT_STYLES.search` + `HEADER_STYLES.searchHeight` |
| Search icon | `left-4`/`right-4` | Logical: `start-4` |
| Buttons | Various | Consistent with `BUTTON_STYLES` from platform-theme |

**4.2.3 Search bar specs**

- **Height:** `h-11` (44px)
- **Max width:** `max-w-2xl` (672px)
- **Border radius:** `rounded-xl`
- **Padding:** `py-2.5 px-4`, icon at `start-4`
- **Font:** `text-sm`
- **Placeholder:** From `searchPlaceholderKey` per route

---

### Phase 3: Global Search API (Optional)

**4.3.1 Current search behavior**

- Header has `onSearch` prop but **PlatformShell never passes it** → search does nothing
- Pages with search (Leads, Properties, Customers, Pool) use **local** search:
  - Leads: `/api/leads/search?q=...` or client-side filter
  - Properties: `/api/listings?q=...`
  - Pool: `/api/pool/search?city=...`

**4.3.2 Unified search API (if desired)**

```ts
// POST /api/platform/search
// Body: { query: string, context?: 'leads' | 'properties' | 'listings' | 'pool' | 'global' }
// Returns: { leads?: [], properties?: [], ... } depending on context
```

**4.3.3 Wire header search**

- PlatformShell passes `onSearch` to Header
- Use `searchContext` from header config to call correct API
- Options:
  - **A) Navigate + filter:** Navigate to Leads/Properties and pass `?q=...` as query
  - **B) Dropdown results:** Show typeahead in header, click to navigate
  - **C) Keep header search cosmetic:** Only page-internal search is functional (minimal change)

**Recommendation:** Phase 3 can be deferred. Start with **4.3.3 Option C** – unify design only; wire search in a later iteration.

---

### Phase 4: Page Content Alignment

**4.4.1 Container width**

- Header container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Main content: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6` (PlatformShell)

**Already aligned.** No change needed.

**4.4.2 Page-internal headers**

- **Option A:** Remove duplicate `<h1>` on pages where global header shows title
- **Option B:** Keep page `<h1>` for accessibility but style consistently with `TYPOGRAPHY.pageTitle`

**Recommendation:** Option B – keep page title for screen readers and in-page hierarchy; ensure it uses `TYPOGRAPHY.pageTitle` so it matches header visually when both are shown.

**4.4.3 Pages with custom header layout**

- **Dashboard:** Keep welcome card; use `TYPOGRAPHY.pageTitle` for any title text
- **Forum, Pool:** Replace custom `text-3xl` with `TYPOGRAPHY.pageTitle`
- **Leads, Properties, Customers:** Card titles use `TYPOGRAPHY.cardTitle`; page title in header only

---

### Phase 5: API Fixes (If Required)

**5.1 Search APIs**

| Endpoint | Current | Notes |
|----------|---------|------|
| `/api/leads/search?q=` | Exists | Used by Leads page |
| `/api/listings?q=` | Exists | Used by Properties page |
| `/api/pool/search?city=` | Exists | Pool uses `city` param, not `q` |

**Potential fix:** If header search is wired for Pool, support `q` as alias for `city` in `/api/pool/search` for consistency.

**5.2 Notifications count**

- Header shows `notificationCount = 3` (hardcoded)
- **Fix:** Fetch from `/api/notifications` (or similar) and show real count

---

## 5. Implementation Checklist

### Phase 1: Config
- [ ] Create `platform-header-config.ts` with route → title/placeholder mapping
- [ ] Add `useHeaderConfig(path)` hook to resolve config by path
- [ ] Update PlatformShell to get title/searchPlaceholder from config when route options are absent
- [ ] Add translation keys for any missing titles/placeholders in `LanguageContext.tsx`

### Phase 2: Header Design
- [ ] Add `HEADER_STYLES` to `platform-theme.ts`
- [ ] Update `header.tsx` to use `HEADER_STYLES`, `INPUT_STYLES`, logical properties (`start-4`)
- [ ] Ensure search bar uses `HEADER_STYLES.searchHeight`, `searchMaxWidth`, `searchRounded`
- [ ] Align button styles with `BUTTON_STYLES`

### Phase 3: Search (Deferred)
- [ ] (Optional) Implement `/api/platform/search` unified endpoint
- [ ] (Optional) Wire `onSearch` from PlatformShell to Header
- [ ] (Optional) Add search context to `platform-header-config`

### Phase 4: Page Alignment
- [ ] Audit all platform pages for duplicate/inconsistent headers
- [ ] Replace custom typography with `TYPOGRAPHY.pageTitle` / `TYPOGRAPHY.pageSubtitle`
- [ ] Ensure Forum, Pool, Calendar, Settings use shared tokens

### Phase 5: API
- [ ] Replace hardcoded `notificationCount` with API fetch
- [ ] (Optional) Add `q` param support to `/api/pool/search` if header search is wired

---

## 6. Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/config/platform-header-config.ts` | **New** – route → header config |
| `apps/web/src/config/platform-theme.ts` | Add `HEADER_STYLES` |
| `apps/web/src/components/layout/header.tsx` | Use design tokens, logical props |
| `apps/web/src/components/layout/PlatformShell.tsx` | Resolve title/placeholder from config |
| `apps/web/src/contexts/LanguageContext.tsx` | Add missing translation keys |
| `apps/web/src/App.tsx` | Simplify route options (derive from config) |
| `apps/web/src/pages/platform/*` | Audit and unify page headers |

---

## 7. Acceptance Criteria

1. **Font size:** All header titles use same token (`text-xl lg:text-2xl font-black`)
2. **Buttons:** Header actions use `BUTTON_STYLES` or equivalent
3. **Search bar:** Fixed height (44px), max-width (672px), rounded-xl, consistent placeholder
4. **Container:** Header and main content share `max-w-7xl` and horizontal padding
5. **Height:** Header height is consistent (72px or design token)
6. **Route titles:** Every platform route has a title in the header
7. **RTL:** All header elements use logical properties (`start/end`, `ps/pe`, `ms/me`)

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Route matching for dynamic paths | Use path prefix matching; fallback to generic config |
| Breaking existing route options | Keep route options as override; config is default |
| Performance of config lookup | Simple object lookup; no async |

---

## 9. References

- `apps/web/src/config/platform-theme.ts` – Platform design tokens
- `apps/web/src/config/theme.ts` – `COMPONENT_STYLES`
- `apps/web/src/config/platform-sidebar.ts` – Route labels (`labelKey`)
- `.agent/skills/01-frontend-architect.md` – RTL, typography, logical properties
