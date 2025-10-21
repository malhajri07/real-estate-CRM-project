# Role-Based Application Sitemap

This document summarizes the navigational structure of the real estate CRM, focusing on how role-based access control (RBAC) unlocks or restricts specific routes. Core roles are defined centrally and reused across the platform and APIs to keep permissions consistent.【F:packages/shared/rbac.ts†L8-L71】

## Legend
- **Landing Experience** – Public pages reachable before authentication.
- **Platform Shell** – Authenticated CRM workspace rooted at `/home/platform`.
- **Admin Console** – RBAC administration area rooted at `/admin`.
- Aliases (e.g., `/customers`) redirect to the canonical `/home/platform/...` paths.

## Public (Unauthenticated Visitor)
Landing (`/` or `/home`) serves as the gateway into both the customer-facing experience and the CRM. The following pages remain accessible without signing in while the app is hosted on the primary dashboard server (port 3000).【F:apps/web/src/App.tsx†L600-L649】

- Landing page (`/`, `/home`)
  - RBAC login (`/login`, `/rbac-login`)
  - Signup flow
    - Plan selection (`/signup`)
    - Individual signup (`/signup/individual`)
    - Corporate signup (`/signup/corporate`)
    - Submission success (`/signup/success`)
    - KYC confirmation (`/signup/kyc-submitted`)
  - Marketing request submission (`/marketing-request`)
  - Real-estate service requests (`/real-estate-requests`)
  - Property discovery (`/search-properties`)
  - Public unverified listing viewer (`/unverified-listings`, legacy alias `/unverfied-listing`)
  - Diagnostics: temporary QA route at `/test-login`

## Authenticated Experiences by Role
After successful RBAC login, routing depends on the role mix attached to the session. The app distinguishes between administrative, platform (corporate/agent), and consumer (seller/buyer) personas before registering the available routes.【F:apps/web/src/App.tsx†L695-L840】 The `renderPlatformShellRoute` helper applies additional per-page role checks, showing an access denied state if a user reaches a URL they are not authorized to view.【F:apps/web/src/App.tsx†L330-L354】

### Website Administrator (WEBSITE_ADMIN)
Administrators are redirected from the landing page to the RBAC console at `/admin/overview/main-dashboard`. They can load every route listed in the admin sidebar configuration, which covers overview dashboards, user/role management, organization tools, billing, analytics, integrations, security, notifications, and system settings.【F:apps/web/src/App.tsx†L720-L726】【F:apps/web/src/config/admin-sidebar.ts†L1-L1399】 Key groupings include:

- **Overview** – `/admin/overview/main-dashboard`, `/admin/overview/general-statistics`, `/admin/overview/recent-activity`
- **User & Role Management** – `/admin/users/*`, `/admin/roles/*`
- **Organization Management** – `/admin/organizations/*`
- **Revenue & Billing** – `/admin/revenue/*`, `/admin/billing/*`
- **Complaints Desk** – `/admin/complaints/*`
- **Integrations & Content** – `/admin/integrations/*`, `/admin/content/*`
- **Feature Catalog & Analytics** – `/admin/features/*`, `/admin/analytics/*`
- **Security, Notifications, System Settings** – `/admin/security/*`, `/admin/notifications/*`, `/admin/system/*`

Administrators are also registered for the platform shell routes, but the default redirect steers them back to the admin console. If a website admin also holds an additional platform role (e.g., CORP_OWNER), the shared platform routes below become available and respect the same permission checks.

### Corporate Owner (CORP_OWNER)
Corporate owners land on `/home/platform` with access to the entire platform shell catalog plus corporate management features.【F:apps/web/src/App.tsx†L730-L807】 Navigation highlights:

- **Core CRM Workspace** (shared with corporate and independent agents)
  - Customers (`/home/platform/customers`)
  - Properties (`/home/platform/properties`)
  - Leads (`/home/platform/leads`)
  - Sales pipeline (`/home/platform/pipeline`)
  - Clients (`/home/platform/clients`)
  - Reports (`/home/platform/reports`)
  - Notifications (`/home/platform/notifications`)
  - Workspace settings (`/home/platform/settings`)
  - Marketing request board (`/home/platform/marketing-requests`)
- **Corporate Management Exclusives**
  - Agencies directory (`/home/platform/agencies`)
  - Agency profile pages (`/home/platform/agency/:id`)
  - Centralized customer request inbox (`/home/platform/customer-requests`)
- **Cross-role Utilities**
  - Favorites, property comparison, posting listings, and saved searches (see “Extended Platform Utilities” below)
  - Agent detail pages (`/home/platform/agent/:id`)
  - Property detail views (`/home/platform/properties/:id`)
  - Public listing view within the shell (`/home/platform/listing/:id`)
  - Unverified listing review (`/home/platform/unverified-listings`, legacy alias `/home/platform/unverfied-listing`)

### Corporate Agent (CORP_AGENT)
Corporate agents inherit the core CRM workspace, marketing board, and agent/property detail routes described above.【F:apps/web/src/App.tsx†L363-L418】【F:apps/web/src/App.tsx†L730-L807】 They do **not** receive the corporate management exclusives (agencies list or customer-request hub) because those routes require the CORPORATE_MANAGEMENT role set. Agents can still reach the extended utilities—favorites, compare, post listing, saved searches—because those routes accept the broader `EXTENDED_PLATFORM_ROLES` list.

### Independent Agent (INDIV_AGENT)
Independent agents share the same platform shell as corporate agents, minus organization-specific tooling. They retain access to leads, pipeline, marketing requests, and the extended utilities for managing personal listings and saved buyer activity.【F:apps/web/src/App.tsx†L363-L418】 Dynamic detail pages for agents, properties, and public listings are equally available.

### Extended Platform Utilities
Some platform shell routes are deliberately open to a wider set of roles, including sellers and buyers, by checking against the `EXTENDED_PLATFORM_ROLES` array.【F:apps/web/src/App.tsx†L414-L417】 When a user’s roles satisfy this condition (e.g., agents, owners, or consumers assigned additional permissions), the following endpoints unlock within the shell:

- Favorites (`/home/platform/favorites`)
- Property comparison (`/home/platform/compare`)
- Post a listing (`/home/platform/post-listing`)
- Saved searches (`/home/platform/saved-searches`)

### Seller (SELLER)
Sellers authenticate into the platform experience but receive a trimmed route registration: the shell entry point (`/home/platform`) and unverified listing viewer are available, while administrative pages redirect back to the platform dashboard.【F:apps/web/src/App.tsx†L811-L823】 Sellers can submit unverified properties through the “Post a listing” workflow (`/home/platform/post-listing`), which drops submissions into the shared unverified pool. Corporate owners and agents can then pull those listings into their managed inventory for verification and publication. The pool also exposes discoverability to other agents so they can view in-progress submissions before they are claimed.

Sellers can reach a dedicated agent-contact panel (`/home/platform/post-listing/agents`) that lists at least ten eligible agents; the platform enforces a minimum outreach capacity so the seller can message multiple representatives while waiting for an exclusive agreement. Once an agent claims a listing, a seven-day countdown is surfaced in the seller dashboard reminding both parties to finalize the marketing agreement before the listing re-enters the pool. Once additional permissions are granted (for example, via hybrid agent/seller roles), the extended utilities above also become available. Without extra roles, attempts to reach guarded routes will fall back to the landing page.

### Buyer (BUYER)
Buyers mirror the seller sitemap. They enter through `/home/platform`, can review unverified listings, and are otherwise limited unless granted extended platform permissions (e.g., to manage favorites or saved searches). Administrative URLs redirect to `/home/platform` for this role as well.【F:apps/web/src/App.tsx†L811-L823】 Buyers have access to a request submission wizard (`/home/platform/buyer-request`) that feeds directly into the buyer pool dashboards consumed by agents and corporate owners. Agents can approach buyers from this pool, and the system does not cap how many agents a buyer can contact—or how many can reach out in return—ensuring an open matching marketplace across the platform shell.

### Shared Redirects and Legacy Paths
Legacy URLs like `/dashboard` are automatically redirected into the platform workspace to preserve backward compatibility. Similarly, anonymous visits to admin paths prompt a login redirect. These safety nets help maintain a predictable sitemap even when outdated links are used.【F:apps/web/src/App.tsx†L444-L643】【F:apps/web/src/App.tsx†L729-L833】

