# API, Functions & Pages Audit Report

**Date:** 2026-02-08  
**Scope:** Real Estate CRM – API routes, frontend pages, and usage analysis

---

## Executive Summary

This audit identifies:
- **Unused or orphaned API routes**
- **Unused or orphaned pages**
- **API–frontend contract mismatches**
- **Critical bugs (e.g., leads route not registered, dashboard metrics path mismatch)**

---

## 1. API Audit

### 1.1 Critical Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Leads route not registered** | 🔴 Critical | `leadsRoutes` is imported in `routes.ts` but **never mounted**. Frontend calls `/api/leads` and `/api/leads/search` – these return 404. |
| **Dashboard metrics path mismatch** | 🔴 Critical | Platform dashboard fetches `/api/dashboard/metrics` but the API is at `/api/reports/dashboard/metrics`. Dashboard would get 404. |

### 1.2 API Routes – Usage Summary

| Route | Mount Path | Frontend Usage |
|-------|------------|----------------|
| auth | `/api/auth` | ✅ Login, Signup |
| pool | `/api/pool` | ✅ Pool page (`pages/platform/pool`) |
| community | `/api/community` | ✅ Forum |
| knowledge-base | `/api/knowledge` | ⚠️ No direct usage found |
| cms/* | `/api/cms` | ✅ CMS admin, Landing, Articles |
| unverified-listings | `/api/unverified-listings` | ✅ Unverified forms, management |
| property-categories | `/api/property-categories` | ✅ Unverified form |
| property-types | `/api/property-types` | ✅ Unverified form |
| marketing-requests | `/api/marketing-requests` | ✅ Marketing board |
| rbac-admin | `/api/rbac-admin` | ✅ Admin dashboard |
| listings | `/api/listings` | ✅ Properties, map, post, compare |
| locations | `/api/locations` | ✅ Map, requests, unverified |
| favorites | `/api/favorites` | ✅ Favorites page |
| inquiries | `/api/inquiries` | ⚠️ No direct usage found |
| search | `/api/search` | ✅ Saved searches |
| moderation | `/api/moderation` | ✅ Moderation page |
| reports | `/api/reports` | ✅ Reports, RevenueChart |
| agencies | `/api/agencies` | ✅ Agencies, agent detail |
| requests | `/api/requests` | ✅ Pipeline, customer requests |
| deals | `/api/deals` | ✅ Dashboard, pipeline |
| activities | `/api/activities` | ✅ Dashboard, clients |
| messages | `/api/messages` | ✅ SendWhatsAppModal |
| notifications | `/api/notifications` | ✅ Header, notifications |
| campaigns | `/api/campaigns` | ✅ Notifications page |
| csv | `/api/csv` | ✅ Leads upload/process |
| support | `/api/support` | ✅ supportAdmin (complaints) |
| appointments | `/api/appointments` | ✅ Calendar |
| audit-logs | `/api/audit-logs` | ⚠️ No direct usage found |
| landing | `/api/landing` | ✅ Landing page |
| **leads** | **NOT MOUNTED** | **🔴 Used by Dashboard, Leads, Customers, Pipeline** |

### 1.3 Low-Usage or Orphaned APIs

- **`/api/knowledge`** – No frontend usage found
- **`/api/inquiries`** – No frontend usage found
- **`/api/audit-logs`** – No direct frontend usage (admin dashboard may use via rbac-admin)

---

## 2. Pages Audit

### 2.1 Pages in App.tsx Router (Used)

All pages below are imported and routed in `App.tsx`:

- Landing, Signup (selection, individual, corporate, success, kyc-submitted)
- Map, Blog, Real estate requests, Unverified listing
- Platform: Dashboard, Leads, Customers, Properties, Pipeline, Clients, Reports, Notifications, Settings
- Platform: Agencies, Agency detail, Agent detail, Property detail, Post listing
- Platform: Favorites, Compare, Saved searches, Activities, Calendar, Pool, Forum
- Platform: Customer requests, Admin requests
- Admin: RBAC Dashboard, User management, Role management, Organization management
- Admin: CMS, Articles, Media, Navigation, SEO, Templates, Complaints, Revenue
- Admin: Analytics, Billing, Moderation, Unverified listings management
- Admin: Integrations, Features, Security, Notifications, System settings
- Marketing: Submission, Board
- Auth: Login
- Listing (public)

### 2.2 Pages That Exist But May Be Orphaned or Redundant

| Page | Path | Notes |
|------|------|-------|
| `admin/analytics-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/billing-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/features-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/integrations-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/system-settings.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/security-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/notifications-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/complaints-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |
| `admin/revenue-management.tsx` | Rendered inside RBAC dashboard | ✅ Used |

All admin pages are rendered as content within the RBAC dashboard based on the current route – they are **not orphaned**.

### 2.3 Admin Sidebar vs Actual Routes

The `admin-sidebar.ts` config defines many routes (e.g. `/admin/users/active-users`, `/admin/roles/create-role`, `/admin/revenue/overview`). The RBAC dashboard uses `adminSidebarConfig` and renders content based on the current path. Routes like `/admin/overview/main-dashboard` are in `ADMIN_DASHBOARD_ROUTES` and are matched. Some sidebar items may point to routes that render placeholder or generic content – a deeper audit of each admin sub-route would be needed to confirm.

---

## 3. Recommendations

### 3.1 Immediate Fixes (APPLIED)

1. **Register leads routes** ✅
   - Added `app.use("/api/leads", leadsRoutes)` in `routes.ts`

2. **Fix dashboard metrics path** ✅
   - Updated all frontend references from `/api/dashboard/metrics` to `/api/reports/dashboard/metrics`

### 3.2 Cleanup Candidates

- **`/api/knowledge`** – Remove or document intended use
- **`/api/inquiries`** – Integrate into property/lead flows or remove
- **`/api/audit-logs`** – Verify if used by admin; if not, remove or document

### 3.3 Populate Routes

- `populate` routes are disabled (501). Consider removing or gating behind `NODE_ENV=development` if not needed.

---

## 4. Summary Table – Pages of No Use

| Category | Item | Action |
|----------|------|--------|
| API | `/api/leads` | **Fix:** Register `leadsRoutes` |
| API | `/api/dashboard/metrics` | **Fix:** Align frontend or add API alias |
| API | `/api/knowledge` | Review – no frontend usage |
| API | `/api/inquiries` | Review – no frontend usage |
| API | `/api/audit-logs` | Review – no direct usage |
| Pages | None identified | All pages appear to be routed and used |

---

*Generated by API/Pages audit per Database, API, Planner, QA, and System Design architect skills.*
