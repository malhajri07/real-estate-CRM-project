# API & Prisma Audit Report

**Date:** Feb 28, 2026  
**Scope:** All API routes, Prisma schema, and database usage

---

## 1. Git Status

**Working tree:** Clean – no uncommitted changes in `apps/api` or `data/schema`.

---

## 2. Prisma Schema

**Location:** `data/schema/prisma/schema.prisma`  
**Migrations:** 13 migration files in `data/schema/prisma/migrations/`

### Models (75 total)

| Category | Models |
|----------|--------|
| Core | users, organizations, agent_profiles, leads, properties, listings |
| CRM | buyer_requests, claims, contact_logs, customers, deals |
| Location | regions, cities, districts |
| CMS | LandingSection, LandingCard, CMSArticle, MediaLibrary, SEOSettings, ContentTemplate, NavigationLink |
| Billing | billing_accounts, billing_invoices, billing_subscriptions, billing_payments |
| Support | support_tickets, support_categories, support_templates |
| Community | community_posts, community_comments |
| Other | property_listings, property_category, property_type, agent_memory, audit_logs, inquiries, appointments, session |

---

## 3. API Routes – Mounted vs Unmounted

### Mounted Routes (35 route modules)

| Path | Route File | Status |
|------|------------|--------|
| `/api/auth` | auth.ts | ✓ Mounted |
| `/api/pool` | buyer-pool.ts | ✓ Mounted |
| `/api/community` | community.ts | ✓ Mounted |
| `/api/cms/*` | cms-landing, cms-articles, cms-media, cms-seo, cms-templates, cms-navigation | ✓ Mounted |
| `/api/unverified-listings` | unverified-listings.ts | ✓ Mounted |
| `/api/property-categories` | property-categories.ts | ✓ Mounted |
| `/api/property-types` | property-types.ts | ✓ Mounted |
| `/api/marketing-requests` | marketing-requests.ts | ✓ Mounted |
| `/api/rbac-admin` | rbac-admin.ts | ✓ Mounted |
| `/api/listings` | listings.ts | ✓ Mounted |
| `/api/locations` | locations.ts | ✓ Mounted |
| `/api/favorites` | favorites.ts | ✓ Mounted |
| `/api/search` | search.ts | ✓ Mounted |
| `/api/moderation` | moderation.ts | ✓ Mounted |
| `/api/reports` | reports.ts | ✓ Mounted |
| `/api/agencies` | agencies.ts | ✓ Mounted |
| `/api/requests` | requests.ts | ✓ Mounted |
| `/api/leads` | leads.ts | ✓ Mounted |
| `/api` (populate) | populate.ts | ✓ Mounted |
| `/api/deals` | deals.ts | ✓ Mounted |
| `/api/activities` | activities.ts | ✓ Mounted |
| `/api/messages` | messages.ts | ✓ Mounted |
| `/api/notifications` | notifications.ts | ✓ Mounted |
| `/api/campaigns` | campaigns.ts | ✓ Mounted |
| `/api/csv` | csv.ts | ✓ Mounted |
| `/api/billing` | billing.ts | ✓ Mounted |
| `/api/support` | support.ts | ✓ Mounted |
| `/api/appointments` | appointments.ts | ✓ Mounted |
| `/api/landing` | landing.ts | ✓ Mounted |
| `/` (sitemap) | sitemap.ts | ✓ Mounted |

### Unmounted Route Files (3)

| Route File | Expected Path | Status |
|------------|---------------|--------|
| **inquiries.ts** | `/api/inquiries` | ❌ Not imported or mounted |
| **audit-logs.ts** | `/api/audit-logs` | ❌ Not imported or mounted |
| **knowledge-base.ts** | `/api/knowledge-base` or `/api/knowledge` | ❌ Not imported or mounted |

**Impact:**
- **inquiries.ts** – `storage-prisma` has `createPropertyInquiry`; any frontend POST to `/api/inquiries` would 404. No frontend calls found.
- **audit-logs.ts** – Admin audit log API; would 404 if called.
- **knowledge-base.ts** – Agent memory API; would 404 if called. No frontend calls found.

---

## 4. Prisma Usage

### Primary Entry Points

| File | Usage |
|------|-------|
| `prismaClient.ts` | Exports `basePrisma` (PrismaClient singleton) |
| `storage-prisma.ts` | Uses Prisma for listings, leads, properties, claims, organizations, regions, cities, districts, inquiries |
| `rbac.middleware.ts` | `prisma.users.findUnique` |
| `auth.service.ts` | `prisma.users` (findUnique, create, update) |
| `knowledge.service.ts` | `prisma.agent_memory` |

### Route Files Using Prisma Directly

- `audit-logs.ts` – `prisma.audit_logs`
- `buyer-pool.ts`, `leads.ts`, `listings.ts`, etc. – via storage or direct Prisma

---

## 5. Summary

| Item | Status |
|------|--------|
| Uncommitted changes | None |
| Prisma schema | 75 models, migrations present |
| Mounted API routes | 35 route modules |
| Unmounted route files | 3 (inquiries, audit-logs, knowledge-base) |
| Frontend calls to unmounted APIs | None found |

---

## 6. Recommendations

1. **inquiries.ts** – Mount at `/api/inquiries` if property inquiry creation is needed, or remove if unused.
2. **audit-logs.ts** – Mount at `/api/audit-logs` if admin audit log UI is needed.
3. **knowledge-base.ts** – Mount at `/api/knowledge-base` if agent memory features are used.
