# Ultra Audit & Enhancement Design

> **Date:** 2025-03-07  
> **Status:** Design approved for implementation  
> **Objective:** Seamless, efficient application and codebase

---

## 1. Executive Summary

A comprehensive audit of the Real Estate CRM application (apps/web, apps/api) identified **Critical**, **High**, **Medium**, and **Low** severity issues across structure, frontend, backend, performance, and quality. This design proposes a phased enhancement plan aligned with the six agent skills: Frontend Architect, Database Engineer, API Architect, Planner, QA/DevOps, and System Design.

---

## 2. Audit Findings Summary

### Critical
- **Test script broken** — `package.json` test points to non-existent `analytics.test.ts`
- **ESLint ignores TypeScript** — Only `.js`/`.jsx` linted; `.ts`/`.tsx` excluded

### High
- **80+ `any` usages** — storage-prisma, useDashboardData, landing, unverified-listing, pool, articles-management, etc.
- **Property types missing** — `areaSqm`, `livingRooms` cast as `any` across PropertiesGrid, PropertiesTable

### Medium
- **Vite chunk path mismatch** — Manual chunks reference `/pages/dashboard`, `/pages/rbac-dashboard` but actual paths are `pages/platform/dashboard`, `pages/admin/dashboard`
- **RTL violations** — `left`/`right`, `ml-`/`mr-` in photo-carousel, ListingCard, map, carousel, dropdown-menu, RichTextEditor
- **N+1 query risk** — getPropertiesPaginated, agencies, buyer-pool nested queries
- **Image lazy loading** — Missing `loading="lazy"` on ListingCard, photo-carousel, forum
- **Auth extraction scattered** — Inline `getAuth`/`decodeAuth` in many routes instead of shared middleware
- **N+1 query risk** — getPropertiesPaginated, agencies, buyer-pool nested queries

### Low
- **Orphaned features/ folder** — README describes unused architecture
- **API structure** — Dual routes/ vs src/ layout
- **No circular dependency check** — No madge/dependency-cruiser in CI

---

## 3. Proposed Approach

### Approach A: Phased by Severity (Recommended)
Fix Critical → High → Medium → Low. Each phase is shippable. Enables incremental value.

### Approach B: Phased by Domain
Frontend → Backend → Infrastructure. Domain-focused but may delay cross-cutting fixes.

### Approach C: Big Bang
Single large PR. High risk, hard to review.

**Recommendation:** Approach A — severity-first ensures production blockers are fixed first.

---

## 4. Architecture Alignment

| Agent Skill | Audit Area | Key Actions |
|-------------|------------|-------------|
| **Frontend Architect** | TypeScript, RTL, components, bundle | Fix `any`, RTL logical props, Vite chunks |
| **Database Engineer** | Prisma, indexes, N+1 | Add property types, review includes |
| **API Architect** | i18n, validation, auth | Centralize auth middleware, Zod schemas |
| **Planner** | Product/UX consistency | Terminology, RTL UX audit |
| **QA/DevOps** | Tests, lint, CI | Fix test script, enable ESLint for TS |
| **System Design** | Structure, observability | Add dep-cruiser, logging |

---

## 5. Design Sections

### 5.1 Test & Lint Infrastructure
- Create minimal `analytics.test.ts` or point test to existing E2E
- Extend ESLint to `.ts`/`.tsx` with TypeScript parser; start with `no-explicit-any` warn
- Add `dependency-cruiser` or `madge` for circular dependency detection in CI

### 5.2 Type Safety
- Define `Property`, `Listing` types in `shared` or `apps/web/src/types`
- Replace `(property as any).areaSqm` with typed access
- Reduce `any` in storage-prisma, useDashboardData, landing, pool (prioritized files)

### 5.3 Vite Chunk Configuration
- Align `adminManualChunkGroups` and `publicLandingChunkIdentifiers` with actual `pages/` paths
- Map: `dashboard` → `admin/dashboard`, `rbac-dashboard` → `admin/rbac-dashboard`, etc.

### 5.4 RTL Cleanup
- Replace `left`/`right`, `ml-`/`mr-` with `start`/`end`, `ms-`/`me-` in photo-carousel, ListingCard, map, carousel, dropdown-menu, RichTextEditor, corporate

### 5.5 Performance
- Add `loading="lazy"` to images in ListingCard, photo-carousel, forum
- Consider dynamic import for Recharts/Tremor in report pages

### 5.6 API & Auth
- Extract `getAuth`/`decodeAuth` into shared middleware; apply to protected routes
- Ensure Zod validation on all public inputs

### 5.7 Cursor Rules
- Create `.cursor/rules/` entries from agent skills for persistent AI guidance

---

## 6. Success Criteria

- [ ] `pnpm test` runs without error
- [ ] ESLint runs on `.ts`/`.tsx` with no critical violations
- [ ] Zero `any` in storage-prisma, useDashboardData, property components
- [ ] Vite chunks match actual page paths (verify via bundle analyzer)
- [ ] No RTL violations in audited components
- [ ] Images use `loading="lazy"` where appropriate
- [ ] Auth middleware centralized

---

## 7. Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Severity-first | Some medium items (RTL) may wait; critical/high fixed first |
| ESLint for TS | May surface many issues; start with warn, migrate to error |
| Centralized auth | Requires touching many routes; do incrementally |

---

## 8. Next Step

Invoke **writing-plans** skill to produce the implementation plan (`docs/plans/2025-03-07-ultra-audit-enhancement-plan.md`).
