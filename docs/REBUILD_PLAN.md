# Rebuild Plan – Real Estate CRM

## Goal

Systematically migrate the app to the new architecture: design system, unified API client, and PageShell. Remove deprecated patterns.

---

## Phase 1: Migrate `apiRequest` → `apiClient`

**Scope:** All files using `apiRequest` from `@/lib/queryClient`.

**Mapping:**
- `apiRequest("GET", url)` → `apiGet(path)` — returns parsed JSON
- `apiRequest("POST", url, body)` → `apiPost(path, body)`
- `apiRequest("PUT", url, body)` → `apiPut(path, body)`
- `apiRequest("PATCH", url, body)` → `apiPatch(path, body)`
- `apiRequest("DELETE", url)` → `apiDelete(path)`

**Note:** `apiClient` returns parsed JSON and throws on non-2xx. Remove `.json()` calls and simplify error handling.

### 1.1 Platform Pages
- [x] `properties/index.tsx` — already migrated
- [x] `forum/index.tsx`
- [x] `notifications/index.tsx`
- [x] `pipeline/index.tsx`
- [x] `pool/index.tsx`

### 1.2 Modals & Components
- [x] `add-property-drawer.tsx` — uses raw fetch for FormData (multipart)
- [x] `add-property-modal.tsx`
- [x] `send-whatsapp-modal.tsx`
- [x] `LandingStudio.tsx`

### 1.3 Admin Pages
- [x] `templates-management.tsx`
- [x] `notifications-management.tsx`
- [x] `analytics-management.tsx`
- [x] `media-library.tsx`
- [x] `articles-management.tsx`
- [x] `dashboard.tsx`
- [x] `seo-management.tsx`
- [x] `navigation-management.tsx`
- [x] `security-management.tsx`
- [x] `requests.tsx`
- [x] `moderation.tsx`
- [x] `unverified-listings-management.tsx`
- [x] `cms-landing/index.tsx`
- [x] `billing-management.tsx`
- [x] `cms-landing/hooks/useCMSLandingSections.ts`

### 1.4 Libs
- [x] `billingAdmin.ts`
- [x] `rbacAdmin.ts`
- [x] `supportAdmin.ts`

### 1.5 Map
- [x] `useMapLocations.ts`
- [x] `useMapProperties.ts`

---

## Phase 2: Standardize Pages (Optional)

- Use `PageShell` for new/refactored pages where it fits
- Use `CARD_STYLES` for card containers where appropriate
- All platform pages already use `PAGE_WRAPPER`

---

## Phase 3: Deprecate `apiRequest`

- [x] Deprecated `apiRequest` in `queryClient.ts` (JSDoc @deprecated)
- [x] Updated `ARCHITECTURE.md` — use apiClient for all API requests

---

## Execution Order

1. Platform pages (user-facing)
2. Modals & shared components
3. Admin pages
4. Libs (billingAdmin, rbacAdmin, supportAdmin)
5. Map hooks
6. Deprecate apiRequest
