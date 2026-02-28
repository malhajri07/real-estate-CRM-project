# Route & Navigation Audit Report

**Date:** Feb 28, 2026  
**Scope:** Full application tree, all routes, links, and navigation targets

---

## 1. Route Inventory

### Public Routes (No Auth Required)
| Path | Component | Accessible From |
|------|-----------|-----------------|
| `/` | Landing | Entry, PublicHeader logo |
| `/home` | Landing | Redirect target |
| `/signup` | SignupSelection | Landing CTA, PublicHeader |
| `/signup/individual` | SignupIndividual | SignupSelection |
| `/signup/corporate` | SignupCorporate | SignupSelection |
| `/signup/success` | SignupSuccess | SignupIndividual |
| `/signup/kyc-submitted` | KYCSubmitted | SignupCorporate |
| `/blog` | BlogPage | PublicHeader, Blog back link |
| `/blog/:slug` | BlogPage | Blog listing, article links |
| `/unverified-listings` | UnverifiedListingPage | PublicHeader nav |
| `/marketing-request` | MarketingRequestSubmissionPage | PublicHeader nav |
| `/real-estate-requests` | RealEstateRequestsPage | PublicHeader nav |
| `/map` | MapPage | PublicHeader nav |
| `/rbac-login` | LoginPage | Landing, PublicHeader, Signup |
| `/login` | Redirect → `/rbac-login` | kyc-submitted (inconsistent) |

### Platform Routes (Auth Required)
| Path | Aliases | Component | In Sidebar |
|------|---------|-----------|------------|
| `/home/platform` | — | Dashboard | ✓ |
| `/home/platform/customers` | `/customers` | Customers | ❌ **DEAD END** |
| `/home/platform/properties` | `/properties` | Properties | ✓ |
| `/home/platform/leads` | `/leads` | Leads | ✓ |
| `/home/platform/pipeline` | `/pipeline` | Pipeline | ✓ |
| `/home/platform/clients` | `/clients` | Clients | ✓ |
| `/home/platform/reports` | `/reports` | Reports | ✓ |
| `/home/platform/notifications` | `/notifications` | Notifications | ✓ |
| `/home/platform/settings` | `/settings` | Settings | ✓ |
| `/home/platform/agencies` | `/agencies` | Agencies | ✓ |
| `/home/platform/agency/:id` | `/agency/:id` | AgencyDetail | ✓ (from agencies list) |
| `/home/platform/agent/:id` | `/agent/:id` | AgentDetail | ✓ (from agency detail) |
| `/home/platform/properties/:id` | `/properties/:id` | PropertyDetail | ✓ (from properties list) |
| `/home/platform/listing/:id` | `/listing/:id` | PublicListing | ✓ |
| `/home/platform/pool` | `/pool` | Pool | ✓ |
| `/home/platform/forum` | `/forum` | Forum | ✓ |
| `/home/platform/moderation` | `/moderation` | Moderation | ✓ |
| `/home/platform/cms` | `/cms`, `/cms-admin` | CMS | ✓ |
| `/home/platform/marketing-requests` | `/marketing-requests` | MarketingBoard | ✓ |
| `/home/platform/unverified-listings` | — | UnverifiedListingsMgmt | ✓ |
| `/home/platform/customer-requests` | `/customer-requests` | CustomerRequests | ✓ |
| `/home/platform/admin-requests` | `/admin/requests` | AdminRequests | ✓ |
| `/home/platform/favorites` | `/favorites` | Favorites | ✓ |
| `/home/platform/compare` | `/compare` | Compare | ✓ |
| `/home/platform/post-listing` | `/post-listing` | PostListing | ✓ |
| `/home/platform/saved-searches` | `/saved-searches` | SavedSearches | ✓ |
| `/home/platform/activities` | `/activities` | Activities | ✓ |
| `/home/platform/calendar` | `/calendar` | Calendar | ✓ |

### Admin Routes (Admin Only)
All admin paths render the RBAC Dashboard which uses `adminSidebarConfig` for sub-navigation. Routes include `/admin/overview/main-dashboard`, `/admin/users/*`, `/admin/roles/*`, etc.

---

## 2. Issues Found

### A. Dead-End Routes (No Navigation Link)
| Route | Issue |
|-------|-------|
| `/home/platform/customers` | **Not in platform sidebar** – page exists but cannot be reached by clicking. Sidebar has "clients" (`/clients`) but not "customers" (`/customers`). |

### B. Broken Links (Target Route Missing)
| Source | Link Target | Issue |
|--------|-------------|-------|
| Dashboard LeadCard | `/home/platform/leads/${leadId}` | **No route** `/home/platform/leads/:id` – leads detail page does not exist |
| LeadCard component | `/home/platform/leads/${lead.id}` | Same – link goes to non-existent route |
| Map page | `/properties/${propertyId}` | Unauthenticated users: `/properties/:id` not in public routes; falls through |

### C. Path Mismatches
| Source | Current Link | Should Be |
|--------|--------------|-----------|
| AdminLayout handleBack | `/platform/dashboard` | `/admin/overview/main-dashboard` |
| kyc-submitted | `/login` | `/rbac-login` (for consistency) |

### D. Marketing Request Path Inconsistency
- Public route: `/marketing-request` (singular)
- Platform sidebar: `/marketing-requests` (plural) – different page (board vs submission)

---

## 3. Recommendations

1. **Customers**: Add "العملاء" (Customers) to platform sidebar, or clarify if customers vs clients are the same – currently both routes exist.
2. **Leads detail**: Either add `/home/platform/leads/:id` route + LeadsDetail page, or change LeadCard/Dashboard links to `/home/platform/leads` (list view).
3. **AdminLayout**: Fix back button from `/platform/dashboard` to `/admin/overview/main-dashboard`.
4. **kyc-submitted**: Use `/rbac-login` instead of `/login`.
5. **Map → property**: For unauthenticated users, `/properties/:id` is platform-only; consider adding public listing route or keeping property view in-map.

---

## 4. Fixes Applied (Feb 28, 2026)

| Issue | Fix |
|-------|-----|
| AdminLayout back button | `/platform/dashboard` → `/admin/overview/main-dashboard` |
| kyc-submitted login link | `/login` → `/rbac-login` |
| LeadCard / Dashboard lead links | `/home/platform/leads/:id` → `/home/platform/leads` (no detail route exists) |
| Customers dead-end | Added "سجل العملاء" (Customers) to platform sidebar |

---

## 5. Link Tree (Entry Points)

```
/ (Landing)
├── /signup → /signup/individual, /signup/corporate, /rbac-login
├── /rbac-login → /admin/overview/main-dashboard | /home/platform
├── /blog → /blog/:slug
├── /map
├── /unverified-listings
├── /marketing-request
├── /real-estate-requests
└── PublicHeader nav (from API or fallback)

/home/platform (Dashboard)
└── Sidebar → all platform routes (except /customers)
```
