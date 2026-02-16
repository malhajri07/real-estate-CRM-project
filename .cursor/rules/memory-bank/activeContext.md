# Active Context

## Current Work Focus

### Recent Completed Work

1. **Customer Pool Page** (Completed - Feb 8, 2026)
   - Pool at `/home/platform/pool` shows customer requests (`properties_seeker`) + buyer requests, sorted by latest first
   - Table layout: Type, City, Region, Budget, Bedrooms, Bathrooms, Living Rooms, Notes, Source, Date, Actions (ID column removed)
   - Send SMS for customer requests (Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
   - Claim flow for both sources (customer_request → creates buyer_request + lead)
   - Legacy "AGENT" role mapped to INDIV_AGENT in normalizeRoleKeys + parseStoredRoles (sidebar & API)
   - WEBSITE_ADMIN can access pool; pool requires PLATFORM_CORE_ROLES
   - **Fix:** useQuery must destructure `error, isError` when rendering error state (was causing ReferenceError crash)
   - **API/DB fix:** buyer_requests relation is `users` not `createdBy`; use `basePrisma.buyer_requests` with `include: { users: {...} }`; wrap both queries in try/catch so one failing doesn't break the pool
   - **Removed:** "My Matches" button, "Check data" button, ID column, GET /api/pool/buyers/my-claims API

2. **Numeric Display Convention** (Completed - Feb 8, 2026)
   - All numeric values (prices, amounts, counts, pagination) use `en-US` locale for Western digits (0-9) across the application
   - Pattern: `toLocaleString("en-US")` or `Intl.NumberFormat("en-US", {...})`
   - Export: `NUMERIC_LOCALE = "en-US"` in `lib/formatters.ts`
   - Date formatting remains language-specific (ar-SA for Arabic)

3. **Centered Main Content Layout** (Completed - Feb 8, 2026)
   - Admin: `AdminLayout` main section uses `flex flex-col items-center` + inner `max-w-7xl` wrapper
   - Platform: `PlatformShell` main section same pattern—content floats centered, max 1280px
   - Both layouts: main area gets sidebar margin; content block centered in remaining space
   - Applies to all admin pages and all platform pages (dashboard, pool, leads, properties, etc.)

4. **Platform Design Unification** (Completed - Feb 8, 2026)
   - 8-phase design audit across all platform pages
   - Phase 1: platform-theme.ts tokens (ICON_CONTAINER, getIconSpacing, EMPTY_STATE_BASELINE)
   - Phase 2: gray/muted → slate palette across activities, calendar, clients, leads, pipeline, properties, notifications, etc.
   - Phase 3: Centralized badge status (getLeadStatusBadge, getPropertyStatusBadge, getNotificationStatusBadge)
   - Phase 4: Icon containers standardization (Calendar, Clients, Forum)
   - Phase 5: RTL fixes with getIconSpacing in activities, leads, calendar, reports
   - Phases 6–8: Cards, tables, remaining pages aligned to baseline

2. **RBAC Login Redesign** (Completed - Feb 8, 2026)
   - Redesigned /rbac-login page with modern centered layout
   - LoginForm updated with platform-theme (INPUT_STYLES, BUTTON_PRIMARY_CLASSES)
   - Clean background pattern, RTL support

6. **Dashboard Arabic Labels Fix** (Completed - Feb 8, 2026)
   - Added dashboard.active_stages and dashboard.total_deals to LanguageContext
   - Fixed PipelineFlow showing raw keys instead of "المراحل النشطة" / "إجمالي الصفقات"

7. **Leads Page Fix** (Completed - Feb 8, 2026)
   - Added missing getIconSpacing import (was causing runtime error)

8. **Comprehensive Codebase Fixes** (Completed - Feb 8, 2026)
   - Fixed all hardcoded RTL directions across 16 platform pages (30+ instances)
   - Localized error handler middleware for proper i18n support
   - All platform pages now respect language switching
   - All API errors now localized (Arabic/English)
   - 100% RTL compliance achieved
   - Full compliance with Frontend Architect and API Architect standards
   - Updated agent memory with comprehensive fixes log

9. **Revenue Chart Real Data Integration & RTL Compliance** (Completed - Feb 8, 2026)
   - Replaced mock data in RevenueChart with real PostgreSQL data
   - Created new API endpoint `/api/reports/dashboard/revenue-chart`
   - Fixed all RTL violations across dashboard components (20+ instances)
   - Implemented localized error messages (Arabic/English)
   - Added loading states and proper error handling
   - All agent validations passed (Frontend, Database, API, QA, Planner, System Design)
   - Created comprehensive validation reports and change logs
   - Updated agent memory with integration log

10. **Platform Dashboard Redesign** (Completed - Feb 2026)
   - Redesigned `/home/platform` dashboard with modern UI/UX
   - Created 5 new enhanced components (MetricCard, PipelineFlow, LeadCard, ActionCard, TaskCard)
   - Implemented glass morphism effects and animations
   - All components use real data from PostgreSQL (no mock data)
   - Enhanced visual hierarchy and RTL-first layout
   - Updated agent memory with comprehensive redesign log

11. **Landing Page Redesign** (Completed)
   - Redesigned all landing page components with modern UI/UX
   - Implemented RTL-first architecture with glass morphism effects
   - Added Framer Motion animations
   - Made all content CMS-controlled with default fallback content
   - Fixed rendering issues (white page, missing content)
   - Created seed script for default landing page content
   - Updated agent memory with comprehensive redesign log

12. **Admin Dashboard Audit** (Completed)
   - Removed all mock data from admin pages
   - Replaced with real PostgreSQL database queries
   - Created 7 new admin API endpoints
   - Added loading states and error handling
   - Updated agent memory with audit completion log

13. **Agent Memory System** (Completed)
   - Created `agent_memory` table in database
   - Implemented `KnowledgeBaseService` for memory operations
   - Created scripts to log work to database
   - Memory entries stored with tags, details, and status

### Current Status

**Platform Dashboard & Pages:**
- ✅ Fully redesigned with modern UI/UX
- ✅ 5 new enhanced components created
- ✅ Design unification complete (slate palette, BADGE_STYLES, icon containers)
- ✅ RTL fixes with getIconSpacing across platform pages
- ✅ Dashboard Arabic labels fixed (dashboard.active_stages, dashboard.total_deals)
- ✅ All data from real PostgreSQL APIs (no mock data)

**Landing Page:**
- ✅ Fully redesigned with modern UI
- ✅ All content CMS-controlled
- ✅ Default fallback content implemented
- ✅ Error boundary added
- ✅ All sections render correctly
- ⚠️ Seed script needs manual execution to populate default content

**CMS System:**
- ✅ Draft/publish workflow implemented
- ✅ Version control and audit logging
- ✅ All landing page sections editable via CMS
- ✅ Badge text support added for all sections

**Memory Bank:**
- ✅ Initialized with core files
- ✅ Project context documented
- ✅ System patterns documented
- ✅ Technical context documented

## Next Steps

### Immediate Priorities

1. **Platform Dashboard Testing**
   - Test dashboard on different screen sizes
   - Verify all animations work correctly
   - Test RTL layout thoroughly
   - Gather user feedback

2. **Memory Bank Completion**
   - Review and update `progress.md` with current status
   - Document any missing patterns or context
   - Ensure all files are accurate and up-to-date

3. **Landing Page Content**
   - Run seed script: `npx tsx apps/api/scripts/seed-landing-page.ts`
   - Verify content displays correctly
   - Test CMS editing workflow

3. **Testing & Quality Assurance**
   - Test landing page on different screen sizes
   - Verify RTL layout correctness
   - Test CMS publish workflow
   - Verify error handling

### Short-Term Goals

1. **Documentation**
   - Keep memory bank updated
   - Document new patterns as they emerge
   - Update progress.md regularly

2. **Code Quality**
   - Review and refactor as needed
   - Ensure consistent patterns
   - Maintain RTL-first architecture

3. **Feature Enhancements**
   - Continue improving CMS functionality
   - Enhance analytics capabilities
   - Improve user experience

## Active Decisions & Considerations

### 1. Memory Bank Structure

**Decision**: Using `.cursor/rules/memory-bank/` directory
**Rationale**: Follows Cursor's memory bank pattern, keeps documentation organized
**Status**: Implemented

### 2. Agent Memory Storage

**Decision**: Storing agent memory in `public.agent_memory` table
**Rationale**: Persistent storage, queryable, integrates with existing database
**Status**: Implemented

### 3. Landing Page Default Content

**Decision**: Comprehensive default content in code as fallback
**Rationale**: Ensures page always displays content, even if CMS is empty
**Status**: Implemented

### 4. RTL-First Architecture

**Decision**: Strict RTL-first with logical properties only
**Rationale**: Ensures perfect Arabic UX, no conditional RTL/LTR hacks
**Status**: Enforced throughout codebase

## Known Issues

### Minor Issues

1. **Seed Script Execution**
   - Script requires manual execution (sandbox limitations)
   - Should be run to populate default CMS content

2. **Documentation Gaps**
   - Some API endpoints may need better documentation
   - Some components may need inline comments

### Resolved Issues

- **Pool page crash:** useQuery was missing `error` and `isError` destructuring; component referenced them for error UI → ReferenceError. Fixed.

### No Critical Issues

- Landing page renders correctly
- CMS system functional
- Database connections stable

## Recent Changes Summary

### Code Changes

- **Design unification:** platform-theme.ts (getLeadStatusBadge, getPropertyStatusBadge, getIconSpacing), slate palette across platform pages
- **RBAC login:** Redesigned login.tsx and LoginForm.tsx with platform-theme tokens
- **LanguageContext:** Added dashboard.active_stages, dashboard.total_deals (Arabic/English)
- **Leads page:** Added missing getIconSpacing import
- Previously: Fixed `stat.value` → `stat.number`, `cn` import in ContactSection, default landing content, error boundary

### Database Changes

- Agent memory entries created for:
  - Platform dashboard redesign (Memory ID: 280bfe4e-7e05-4583-8b31-451f0787db01)
  - Landing page redesign
  - Admin dashboard audit

### Documentation Changes

- Created memory bank core files
- Documented project context
- Documented system patterns
- Documented technical stack

## Context for Next Session

When continuing work:

1. **Read Memory Bank First**
   - Start with `projectbrief.md` for overview
   - Review `activeContext.md` for current state
   - Check `progress.md` for what's done/remaining

2. **Check Recent Work**
   - Platform design unification complete (platform-theme.ts, slate palette)
   - RBAC login redesigned
   - Dashboard Arabic labels fixed
   - Review any open issues or TODOs

3. **Understand Current Focus**
   - Platform dashboard and pages: design-unified, RTL-compliant
   - RBAC login: redesigned with platform-theme
   - Focus: testing, documentation, or new features

4. **Maintain Patterns**
   - RTL-first architecture (getIconSpacing, logical properties)
   - platform-theme.ts for shared tokens (BADGE_STYLES, INPUT_STYLES, etc.)
   - Centralized status helpers (getLeadStatusBadge, getPropertyStatusBadge)
   - CMS draft/publish workflow
   - **Numeric values:** Always use `en-US` locale (Western digits 0-9) - never `ar-SA` for numbers
