# Real Estate CRM - Complete Site Tree Map

**Last Updated**: $(date)
**Application**: React SPA with Wouter Router
**Backend**: Express.js REST API

---

## Frontend Routes (Wouter)

### Public Routes (Unauthenticated)

| Path | Component | Description | Auth Required |
|------|-----------|-------------|---------------|
| `/` | `Landing` | Landing page with marketing content | ❌ |
| `/home` | `Landing` | Landing page alias | ❌ |
| `/blog` | `BlogPage` | Blog listing page | ❌ |
| `/blog/:slug` | `BlogPage` | Individual blog post | ❌ |
| `/map` | `MapPage` | Property search map (public) | ❌ |
| `/signup` | `SignupSelection` | Signup type selection | ❌ |
| `/signup/individual` | `SignupIndividual` | Individual agent signup | ❌ |
| `/signup/corporate` | `SignupCorporate` | Corporate signup | ❌ |
| `/signup/success` | `SignupSuccess` | Signup success confirmation | ❌ |
| `/signup/kyc-submitted` | `KYCSubmitted` | KYC submission confirmation | ❌ |
| `/rbac-login` | `RBACLoginPage` | Login page | ❌ |
| `/login` | Redirect | Redirects to `/rbac-login` | ❌ |
| `/real-estate-requests` | `RealEstateRequestsPage` | Real estate request submission | ❌ |
| `/marketing-request` | `MarketingRequestSubmissionPage` | Marketing request form | ❌ |
| `/unverified-listings` | `UnverifiedListingPage` | Public unverified listings view | ❌ |

### Platform Routes (Authenticated - `/home/platform/*`)

#### Core Platform Pages

| Path | Component | Aliases | Roles | Description |
|------|-----------|---------|-------|-------------|
| `/home/platform` | `PlatformPage` | - | All authenticated | Platform dashboard |
| `/home/platform/customers` | `Customers` | `/customers` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Customer management |
| `/home/platform/properties` | `Properties` | `/properties` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Property management |
| `/home/platform/leads` | `Leads` | `/leads` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Lead management |
| `/home/platform/pipeline` | `Pipeline` | `/pipeline` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Sales pipeline |
| `/home/platform/clients` | `Clients` | `/clients` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Client management |
| `/home/platform/reports` | `Reports` | `/reports` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Reports and analytics |
| `/home/platform/notifications` | `Notifications` | `/notifications` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Notifications |
| `/home/platform/settings` | `Settings` | `/settings` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Workspace settings |

#### Corporate Management

| Path | Component | Aliases | Roles | Description |
|------|-----------|---------|-------|-------------|
| `/home/platform/agencies` | `AgenciesPage` | `/agencies` | CORP_OWNER | Agency management |
| `/home/platform/agency/:id` | `AgencyPage` | `/agency/:id` | CORP_OWNER | Agency detail page |
| `/home/platform/customer-requests` | `CustomerRequestsPage` | `/customer-requests` | CORP_OWNER | Customer requests |

#### Admin-Only Platform Routes

| Path | Component | Aliases | Roles | Description |
|------|-----------|---------|-------|-------------|
| `/home/platform/moderation` | `ModerationQueuePage` | `/moderation` | WEBSITE_ADMIN | Content moderation |
| `/home/platform/cms` | `CMSAdmin` | `/cms`, `/cms-admin` | WEBSITE_ADMIN | CMS admin interface |
| `/home/platform/unverified-listings` | `UnverifiedListingsManagementPage` | - | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Unverified listings management |
| `/home/platform/admin-requests` | `AdminRequestsPage` | `/admin/requests` | WEBSITE_ADMIN | Admin requests |

#### Cross-Role Features

| Path | Component | Aliases | Roles | Description |
|------|-----------|---------|-------|-------------|
| `/home/platform/favorites` | `FavoritesPage` | `/favorites` | All authenticated | User favorites |
| `/home/platform/compare` | `ComparePage` | `/compare` | All authenticated | Property comparison |
| `/home/platform/post-listing` | `PostListingPage` | `/post-listing` | All authenticated | Post new listing |
| `/home/platform/saved-searches` | `SavedSearchesPage` | `/saved-searches` | All authenticated | Saved searches |
| `/home/platform/marketing-requests` | `MarketingRequestsBoardPage` | `/marketing-requests` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Marketing requests board |

#### Dynamic Platform Routes

| Path | Component | Aliases | Roles | Description |
|------|-----------|---------|-------|-------------|
| `/home/platform/agent/:id` | `AgentPage` | `/agent/:id` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Agent profile |
| `/home/platform/properties/:id` | `PropertyDetail` | `/properties/:id` | CORP_OWNER, CORP_AGENT, INDIV_AGENT | Property detail |
| `/home/platform/listing/:id` | `PublicListingPage` | `/listing/:id` | All | Public listing view |

### Admin Routes (`/admin/*`)

#### Overview

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/overview/main-dashboard` | `RBACDashboard` | Main admin dashboard |
| `/admin/overview/general-statistics` | `RBACDashboard` | General statistics |
| `/admin/overview/recent-activity` | `RBACDashboard` | Recent activity feed |

#### User Management

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/users/all-users` | `UserManagement` | All users list |
| `/admin/users/active-users` | `UserManagement` | Active users |
| `/admin/users/pending-users` | `UserManagement` | Pending user approvals |
| `/admin/users/user-roles` | `UserManagement` | User role management |
| `/admin/users/user-permissions` | `UserManagement` | User permission management |

#### Role Management

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/roles/roles-list` | `RoleManagement` | Roles list |
| `/admin/roles/create-role` | `RoleManagement` | Create new role |
| `/admin/roles/permissions` | `RoleManagement` | Permissions management |
| `/admin/roles/assignments` | `RoleManagement` | Role assignments |

#### Organization Management

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/organizations/organizations-list` | `OrganizationManagement` | Organizations list |
| `/admin/organizations/create` | `OrganizationManagement` | Create organization |
| `/admin/organizations/organization-types` | `OrganizationManagement` | Organization types |
| `/admin/organizations/organization-settings` | `OrganizationManagement` | Organization settings |

#### Revenue & Subscriptions

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/revenue/overview` | `RBACDashboard` | Revenue overview |
| `/admin/revenue/active-subscriptions` | `RBACDashboard` | Active subscriptions |
| `/admin/revenue/payment-methods` | `RBACDashboard` | Payment methods |
| `/admin/revenue/reports` | `RBACDashboard` | Revenue reports |
| `/admin/revenue/subscription-plans` | `RBACDashboard` | Subscription plans |

#### Complaints Management

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/complaints/all-complaints` | `RBACDashboard` | All complaints |
| `/admin/complaints/open-complaints` | `RBACDashboard` | Open complaints |
| `/admin/complaints/resolved-complaints` | `RBACDashboard` | Resolved complaints |
| `/admin/complaints/categories` | `RBACDashboard` | Complaint categories |
| `/admin/complaints/response-templates` | `RBACDashboard` | Response templates |

#### Integrations

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/integrations/whatsapp-settings` | `RBACDashboard` | WhatsApp settings |
| `/admin/integrations/email-settings` | `RBACDashboard` | Email settings |
| `/admin/integrations/sms-settings` | `RBACDashboard` | SMS settings |
| `/admin/integrations/social-media` | `RBACDashboard` | Social media integration |
| `/admin/integrations/api-integrations` | `RBACDashboard` | API integrations |

#### Content Management

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/content/landing-pages` | `CMSLandingPage` | Landing page CMS |
| `/admin/content/articles` | `ArticlesManagement` | Article management |
| `/admin/content/media-library` | `MediaLibrary` | Media library |
| `/admin/content/seo-settings` | `SEOManagement` | SEO settings |
| `/admin/content/content-templates` | `TemplatesManagement` | Content templates |
| `/admin/content/navigation` | `NavigationManagement` | Navigation management |

#### Features & Plans

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/features/feature-comparison` | `RBACDashboard` | Feature comparison |
| `/admin/features/pricing-plans` | `RBACDashboard` | Pricing plans |
| `/admin/features/corporate-features` | `RBACDashboard` | Corporate features |
| `/admin/features/individual-features` | `RBACDashboard` | Individual features |
| `/admin/features/feature-requests` | `RBACDashboard` | Feature requests |

#### Analytics

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/analytics/user-analytics` | `AnalyticsDashboard` | User analytics |
| `/admin/analytics/revenue-analytics` | `AnalyticsDashboard` | Revenue analytics |
| `/admin/analytics/usage-statistics` | `AnalyticsDashboard` | Usage statistics |
| `/admin/analytics/performance-metrics` | `AnalyticsDashboard` | Performance metrics |
| `/admin/analytics/custom-reports` | `AnalyticsDashboard` | Custom reports |

#### Billing

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/billing/invoices-list` | `RBACDashboard` | Invoices list |
| `/admin/billing/create-invoice` | `RBACDashboard` | Create invoice |
| `/admin/billing/payment-tracking` | `RBACDashboard` | Payment tracking |
| `/admin/billing/payment-methods` | `RBACDashboard` | Payment methods |
| `/admin/billing/billing-settings` | `RBACDashboard` | Billing settings |

#### Security

| Path | Component | Description |
|------|-----------|-------------|
| `/admin/security/access-control` | `RBACDashboard` | Access control |
| `/admin/security/audit-logs` | `RBACDashboard` | Audit logs |
| `/admin/security/security-settings` | `RBACDashboard` | Security settings |

#### Legacy Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/rbac-dashboard` | `RBACDashboard` | RBAC dashboard (legacy) |
| `/admin` | `RBACDashboard` | Admin dashboard (legacy) |
| `/overview/dashboard` | `RBACDashboard` | Overview dashboard (legacy) |
| `/overview/main-dashboard` | `RBACDashboard` | Main dashboard (legacy) |
| `/home/admin` | `RBACDashboard` | Admin dashboard (legacy) |

---

## Backend API Routes (Express)

### Authentication (`/api/auth/*`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/auth/login` | `authRoutes` | ❌ | User login |
| POST | `/api/auth/register` | `authRoutes` | ❌ | User registration |
| GET | `/api/auth/me` | `authRoutes` | ✅ | Get current user |
| POST | `/api/auth/logout` | `authRoutes` | ✅ | User logout |
| GET | `/api/auth/user` | Inline | ✅ | Get detailed user info |

### Core Resources

#### Leads (`/api/leads`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/leads` | Inline | ✅ | Get all leads |
| GET | `/api/leads/search` | Inline | ✅ | Search leads |
| GET | `/api/leads/:id` | Inline | ✅ | Get lead by ID |
| POST | `/api/leads` | Inline | ✅ | Create lead |
| PUT | `/api/leads/:id` | Inline | ✅ | Update lead |
| DELETE | `/api/leads/:id` | Inline | ✅ | Delete lead |

#### Properties (`/api/properties`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/properties` | Inline | ✅ | Get all properties |
| GET | `/api/properties/map` | Inline | ❌ | Get properties for map |
| GET | `/api/properties/search` | Inline | ✅ | Search properties |
| GET | `/api/properties/:id` | Inline | ✅ | Get property by ID |
| POST | `/api/properties` | Inline | ✅ | Create property |
| PUT | `/api/properties/:id` | Inline | ✅ | Update property |
| DELETE | `/api/properties/:id` | Inline | ✅ | Delete property |

#### Deals (`/api/deals`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/deals` | Inline | ✅ | Get all deals |
| GET | `/api/deals/stage/:stage` | Inline | ✅ | Get deals by stage |
| POST | `/api/deals` | Inline | ✅ | Create deal |
| PUT | `/api/deals/:id` | Inline | ✅ | Update deal |

#### Activities (`/api/activities`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/activities/lead/:leadId` | Inline | ✅ | Get activities by lead |
| GET | `/api/activities/today` | Inline | ✅ | Get today's activities |
| POST | `/api/activities` | Inline | ✅ | Create activity |

#### Messages (`/api/messages`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/messages` | Inline | ✅ | Get all messages |
| GET | `/api/messages/lead/:leadId` | Inline | ✅ | Get messages by lead |
| POST | `/api/messages` | Inline | ✅ | Create message |

#### Notifications (`/api/notifications`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/notifications` | Inline | ✅ | Get user notifications |

### Platform Features

#### Listings (`/api/listings`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/listings` | `listingsRoutes` | ✅ | Get all listings |
| GET | `/api/listings/featured` | `listingsRoutes` | ❌ | Get featured listings |
| GET | `/api/listings/:id` | `listingsRoutes` | ✅ | Get listing by ID |
| POST | `/api/listings` | `listingsRoutes` | ✅ | Create listing |
| PUT | `/api/listings/:id` | `listingsRoutes` | ✅ | Update listing |
| DELETE | `/api/listings/:id` | `listingsRoutes` | ✅ | Delete listing |

#### Search (`/api/search`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/search/properties` | `searchRoutes` | ✅ | Search properties |
| GET | `/api/search/agencies` | `searchRoutes` | ✅ | Search agencies |
| GET | `/api/search/agents` | `searchRoutes` | ✅ | Search agents |

#### Favorites (`/api/favorites`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/favorites` | `favoritesRoutes` | ✅ | Get user favorites |
| POST | `/api/favorites` | `favoritesRoutes` | ✅ | Add to favorites |
| DELETE | `/api/favorites/:id` | `favoritesRoutes` | ✅ | Remove from favorites |

#### Inquiries (`/api/inquiries`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/inquiries` | `inquiriesRoutes` | ✅ | Get user inquiries |
| POST | `/api/inquiries` | `inquiriesRoutes` | ✅ | Create inquiry |
| PUT | `/api/inquiries/:id` | `inquiriesRoutes` | ✅ | Update inquiry |

#### Agencies (`/api/agencies`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/agencies` | `agenciesRoutes` | ✅ | Get all agencies |
| GET | `/api/agencies/:id` | `agenciesRoutes` | ✅ | Get agency by ID |
| GET | `/api/agencies/:id/agents` | `agenciesRoutes` | ✅ | Get agency agents |

#### Reports (`/api/reports`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/reports/sales` | `reportsRoutes` | ✅ | Sales reports |
| GET | `/api/reports/performance` | `reportsRoutes` | ✅ | Performance reports |
| GET | `/api/reports/analytics` | `reportsRoutes` | ✅ | Analytics data |

#### Moderation (`/api/moderation`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/moderation/queue` | `moderationRoutes` | ✅ | Get moderation queue |
| POST | `/api/moderation/approve` | `moderationRoutes` | ✅ | Approve content |
| POST | `/api/moderation/reject` | `moderationRoutes` | ✅ | Reject content |

### CMS Routes (`/api/cms/*`)

#### Landing Pages (`/api/cms/landing`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/cms/landing` | `cmsLandingRoutes` | ❌ | Get public landing content |
| GET | `/api/cms/landing/sections` | `cmsLandingRoutes` | ✅ | Get landing sections |
| POST | `/api/cms/landing/sections` | `cmsLandingRoutes` | ✅ | Create section |
| PUT | `/api/cms/landing/sections/:id` | `cmsLandingRoutes` | ✅ | Update section |
| DELETE | `/api/cms/landing/sections/:id` | `cmsLandingRoutes` | ✅ | Delete section |

#### Articles (`/api/cms/articles`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/cms/articles` | `cmsArticlesRoutes` | ❌ | Get published articles |
| GET | `/api/cms/articles/:id` | `cmsArticlesRoutes` | ✅ | Get article by ID |
| POST | `/api/cms/articles` | `cmsArticlesRoutes` | ✅ | Create article |
| PUT | `/api/cms/articles/:id` | `cmsArticlesRoutes` | ✅ | Update article |
| DELETE | `/api/cms/articles/:id` | `cmsArticlesRoutes` | ✅ | Delete article |

#### Media (`/api/cms/media`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/cms/media` | `cmsMediaRoutes` | ✅ | Get media files |
| POST | `/api/cms/media/upload` | `cmsMediaRoutes` | ✅ | Upload media |
| DELETE | `/api/cms/media/:id` | `cmsMediaRoutes` | ✅ | Delete media |

#### SEO (`/api/cms/seo`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/cms/seo` | `cmsSEORoutes` | ✅ | Get SEO settings |
| PUT | `/api/cms/seo` | `cmsSEORoutes` | ✅ | Update SEO settings |

#### Templates (`/api/cms/templates`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/cms/templates` | `cmsTemplatesRoutes` | ✅ | Get templates |
| POST | `/api/cms/templates` | `cmsTemplatesRoutes` | ✅ | Create template |
| PUT | `/api/cms/templates/:id` | `cmsTemplatesRoutes` | ✅ | Update template |

#### Navigation (`/api/cms/navigation`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/cms/navigation` | `cmsNavigationRoutes` | ✅ | Get navigation |
| PUT | `/api/cms/navigation` | `cmsNavigationRoutes` | ✅ | Update navigation |

### Admin Routes (`/api/rbac-admin/*`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/rbac-admin/stats` | `rbacAdminRoutes` | ✅ Admin | System statistics |
| GET | `/api/rbac-admin/activities` | `rbacAdminRoutes` | ✅ Admin | Recent activities |
| GET | `/api/rbac-admin/users` | `rbacAdminRoutes` | ✅ Admin | User management |
| POST | `/api/rbac-admin/users` | `rbacAdminRoutes` | ✅ Admin | Create user |
| PUT | `/api/rbac-admin/users/:id` | `rbacAdminRoutes` | ✅ Admin | Update user |
| DELETE | `/api/rbac-admin/users/:id` | `rbacAdminRoutes` | ✅ Admin | Delete user |
| GET | `/api/rbac-admin/organizations` | `rbacAdminRoutes` | ✅ Admin | Organizations |
| POST | `/api/rbac-admin/organizations` | `rbacAdminRoutes` | ✅ Admin | Create organization |
| GET | `/api/rbac-admin/roles` | `rbacAdminRoutes` | ✅ Admin | Roles and permissions |

### Analytics (`/api/analytics/*`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/analytics/overview` | `analyticsRoutes` | ✅ | Overview analytics |
| GET | `/api/analytics/comprehensive` | `analyticsRoutes` | ✅ | Comprehensive analytics |
| GET | `/api/analytics/kpis` | `analyticsRoutes` | ✅ | KPI data |

### Utility Routes

#### Locations (`/api/locations`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/locations/cities` | `locationsRoutes` | ✅ | Get all cities |
| GET | `/api/locations/districts` | `locationsRoutes` | ✅ | Get districts by city |
| GET | `/api/locations/regions` | `locationsRoutes` | ✅ | Get all regions |

#### Saudi Regions (`/api/saudi-regions`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/saudi-regions` | Inline | ✅ | Get all regions |
| POST | `/api/saudi-regions/seed` | Inline | ✅ | Seed regions |

#### Saudi Cities (`/api/saudi-cities`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/saudi-cities` | Inline | ✅ | Get all cities |
| GET | `/api/saudi-cities/region/:regionCode` | Inline | ✅ | Get cities by region |
| POST | `/api/saudi-cities/seed` | Inline | ✅ | Seed cities |

#### Buyer Pool (`/api/pool/*`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/pool/buyers` | `buyerPoolRoutes` | ✅ | Search buyer requests |
| POST | `/api/pool/buyers/:id/claim` | `buyerPoolRoutes` | ✅ | Claim buyer request |
| POST | `/api/pool/buyers/:id/release` | `buyerPoolRoutes` | ✅ | Release claim |

#### Unverified Listings (`/api/unverified-listings`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/unverified-listings` | `unverifiedListingsRoutes` | ❌ | Get unverified listings |
| POST | `/api/unverified-listings` | `unverifiedListingsRoutes` | ❌ | Submit unverified listing |

#### Marketing Requests (`/api/marketing-requests`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/marketing-requests` | `marketingRequestRoutes` | ✅ | Get marketing requests |
| POST | `/api/marketing-requests` | `marketingRequestRoutes` | ❌ | Submit marketing request |

#### Requests (`/api/requests`)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/requests` | `requestsRoutes` | ✅ | Get all requests |
| POST | `/api/requests` | `requestsRoutes` | ✅ | Create request |
| PUT | `/api/requests/:id` | `requestsRoutes` | ✅ | Update request |

### Dashboard & Metrics

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/dashboard/metrics` | Inline | ✅ | Dashboard metrics |

### Campaigns

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/campaigns` | Inline | ✅ | Create campaign |

### CSV Processing

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| POST | `/api/csv/upload-url` | Inline | ✅ | Get CSV upload URL |
| POST | `/api/csv/process-leads` | Inline | ✅ | Process CSV leads |

### Health & Utility

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/health` | Inline | ❌ | Health check |
| GET | `/sitemap.xml` | `sitemapRoutes` | ❌ | Sitemap |
| GET | `/robots.txt` | `sitemapRoutes` | ❌ | Robots.txt |
| GET | `/preview/landing` | Inline | ✅ | Preview landing page |

### Test Routes (Should be removed)

| Method | Path | Handler | Auth | Description |
|--------|------|---------|------|-------------|
| GET | `/api/test-admin` | `testAdminRoutes` | ✅ | Test admin |
| GET | `/api/test-dashboard` | `testDashboardRoutes` | ✅ | Test dashboard |
| GET | `/api/test-db` | `testDbRoutes` | ✅ | Test database |
| GET | `/api/simple-analytics` | `simpleAnalyticsRoutes` | ✅ | Simple analytics |

---

## Route Statistics

- **Total Frontend Routes**: ~65 routes
- **Total Backend API Routes**: ~100+ endpoints
- **Public Routes**: 15 routes
- **Platform Routes**: 30+ routes
- **Admin Routes**: 50+ routes

---

## Route Patterns

### Frontend Routing Patterns

1. **Port-based routing**: Routes behave differently on port 3000 vs other ports
2. **Role-based access**: Routes check user roles before rendering
3. **Aliases**: Many routes have short aliases (e.g., `/customers` → `/home/platform/customers`)
4. **Lazy loading**: All page components are lazy-loaded for performance

### Backend Routing Patterns

1. **Modular routes**: Most routes are in separate modules under `routes/`
2. **Inline routes**: Some routes are defined inline in `routes.ts` (should be extracted)
3. **RBAC middleware**: Routes use RBAC middleware for authorization
4. **Rate limiting**: Authentication routes have stricter rate limiting

---

## Recommendations

1. **Extract inline routes** from `routes.ts` into separate modules
2. **Remove test routes** from production code
3. **Consolidate route aliases** - some routes have multiple aliases
4. **Document route dependencies** - which routes depend on which services
5. **Add route-level tests** - ensure routes work correctly after refactoring

