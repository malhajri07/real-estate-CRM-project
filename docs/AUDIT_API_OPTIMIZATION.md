# API & Routing Optimization Audit

**Date:** 2026-02-08  
**Goal:** Remove unnecessary API routes and fix mismatches to optimize the application.

---

## Executive Summary

| Category | Count | Action |
|----------|-------|--------|
| Unused API routes (safe to remove) | 3 | Remove |
| Frontend API path mismatches | 2 | Fix |
| Dev-only routes (keep for now) | 1 | Document |

---

## 1. Unused API Routes (Recommended for Removal)

### 1.1 `/api/inquiries` — **UNUSED**
- **Route file:** `apps/api/routes/inquiries.ts`
- **Endpoints:** `POST /` (create inquiry)
- **Frontend usage:** None. No component calls `/api/inquiries`.
- **Recommendation:** Remove. No property inquiry form submits to this endpoint.
- **Impact:** Zero. No feature depends on it.

### 1.2 `/api/knowledge` — **UNUSED**
- **Route file:** `apps/api/routes/knowledge-base.ts`
- **Endpoints:** `GET /`, `POST /`, `GET /:agentId`
- **Frontend usage:** None. No component calls `/api/knowledge`.
- **Recommendation:** Remove. Agent Knowledge Base has no UI.
- **Impact:** Zero. No feature depends on it.

### 1.3 `/api/audit-logs` — **UNUSED**
- **Route file:** `apps/api/routes/audit-logs.ts`
- **Endpoints:** `GET /` (list audit logs)
- **Frontend usage:** `SecurityAuditLogs` in security-management uses `/api/rbac-admin/activities`, NOT `/api/audit-logs`.
- **Recommendation:** Remove. The audit_logs table exists but no UI fetches from this route.
- **Impact:** Zero. Security tab uses rbac-admin activities instead.

---

## 2. Frontend API Path Mismatches (Fix Required)

### 2.1 `/api/saudi-cities` — **WRONG PATH**
- **Correct path:** `/api/locations/saudi-cities`
- **Affected files:**
  - `apps/web/src/components/modals/add-lead-drawer.tsx` (queryKey + default fetch)
  - `apps/web/src/components/modals/add-lead-modal.tsx`
  - `apps/web/src/components/modals/add-property-drawer.tsx`
  - `apps/web/src/pages/unverified-listing/hooks/useListingData.ts` (explicit fetch)
- **Impact:** Add-lead and add-property modals get 404 when loading cities.
- **Fix:** Update all to use `/api/locations/saudi-cities`.

### 2.2 `/api/regions` and `/api/districts` — **QUERY KEY ONLY**
- **Correct paths:** `/api/locations/regions`, `/api/locations/districts?cityId=X`
- **Note:** `useListingData` uses correct URLs in `queryFn` but wrong `queryKey`. Unverified-listing may use wrong paths in some places.
- **Fix:** Ensure all fetches use `/api/locations/*` paths.

---

## 3. Routes to Keep (In Use)

| Route | Used By |
|-------|---------|
| `/api/auth` | Login, signup, AuthProvider |
| `/api/pool` | Pool page (`pages/platform/pool`) |
| `/api/community` | Forum page |
| `/api/cms/*` | CMS admin, landing, articles, media, seo, templates, navigation |
| `/api/locations` | Map, requests, unverified-listing, add-lead/add-property modals |
| `/api/listings` | Properties, map, post listing, compare |
| `/api/leads` | Dashboard, leads, customers, pipeline, reports |
| `/api/deals` | Dashboard, pipeline, reports |
| `/api/activities` | Dashboard, clients |
| `/api/requests` | Pipeline, customer requests, real-estate requests |
| `/api/moderation` | Moderation page |
| `/api/reports` | Dashboard metrics, revenue chart, reports page |
| `/api/agencies` | Agencies, agent detail |
| `/api/favorites` | Favorites page |
| `/api/search` | Saved searches |
| `/api/notifications` | Header, notifications page |
| `/api/campaigns` | Notifications page |
| `/api/messages` | SendWhatsAppModal |
| `/api/csv` | Leads (upload, process) |
| `/api/support` | supportAdmin (complaints-management) |
| `/api/billing` | billingAdmin (revenue-management) |
| `/api/appointments` | Calendar page |
| `/api/rbac-admin` | Admin dashboard, analytics, billing, notifications |
| `/api/unverified-listings` | Unverified listing form, management |
| `/api/property-categories` | Unverified listing |
| `/api/property-types` | Unverified listing |
| `/api/marketing-requests` | Marketing board |
| `/api/landing` | Landing page |

---

## 4. Dev-Only Routes (Optional)

| Route | Status | Note |
|-------|--------|------|
| `/api/populate/*` | 501 disabled | Main populate disabled. `/api/fake` may still work for dev. |
| `/api/locations/*/seed` | Admin | Used for seeding geography. Keep. |

---

## 5. Implementation Checklist

- [ ] Remove `inquiriesRoutes` from routes.ts and delete or archive `routes/inquiries.ts`
- [ ] Remove `knowledgeBaseRoutes` from routes.ts and delete or archive `routes/knowledge-base.ts`
- [ ] Remove `auditLogsRoutes` from routes.ts and delete or archive `routes/audit-logs.ts`
- [ ] Fix add-lead-drawer: use `/api/locations/saudi-cities`
- [ ] Fix add-lead-modal: use `/api/locations/saudi-cities`
- [ ] Fix add-property-drawer: use `/api/locations/saudi-cities`, `/api/locations/regions`, `/api/locations/districts`
- [ ] Fix useListingData: use `/api/locations/saudi-cities`
- [ ] Fix unverified-listing index: use `/api/locations/regions`, `/api/locations/districts` (verify queryFn paths)

---

## 6. Resolved (360° Evaluation – Feb 2026)

The following items were addressed during the evaluation follow-up:

| Item | Resolution |
|------|------------|
| `/api/activities` 404 | Added `GET /` handler returning today's activities |
| Agencies storage | Implemented `listAgencies`, `getAgency`, `listAgencyAgents`, `getAgencyListings` (organizations table) |
| Search saved | Storage stubs `getSavedSearches`, `createSavedSearch`, `deleteSavedSearch`; moved `POST /run-alerts` before export |
| Reports storage | Storage stubs `createReport`, `listReports`, `resolveReport` (no table yet) |
| Pipeline DnD | Removed deprecated `react-beautiful-dnd`; using `@hello-pangea/dnd` only |
