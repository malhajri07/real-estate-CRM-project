# Frontend Change Log

## 2026-02-08 – Platform Pages RTL Compliance Fix (Comprehensive)

### What Changed
- Fixed all hardcoded `dir="rtl"` instances across 16 platform pages (30+ instances)
- Added `useLanguage()` hook to all affected pages
- Replaced all hardcoded directions with dynamic `dir={dir}` from context
- Ensured proper language switching support throughout platform

### Why This Change Was Made
- **RTL-First Architecture:** Hardcoded directions violate RTL-first principles
- **Language Switching:** Users couldn't switch languages properly
- **Architectural Compliance:** Frontend Architect standards require dynamic direction handling
- **User Experience:** Proper i18n support requires dynamic direction

### Impact
- **RTL Compliance:** 100% - All platform pages now respect language switching
- **User Experience:** Users can switch between Arabic and English seamlessly
- **Maintainability:** Consistent pattern across all pages
- **Architecture:** Full compliance with RTL-first standards

### Notes / Trade-offs
- All pages now properly use `useLanguage()` hook
- No performance impact (hooks are lightweight)
- Consistent pattern makes future maintenance easier

---

## 2026-02-08 – Dashboard Components RTL Compliance Fix

### What Changed
- Fixed all RTL violations across dashboard components:
  - `RevenueChart.tsx`: Changed `pl-2` → `ps-2` (padding-start)
  - `DateRangeFilter.tsx`: Changed `ml-2` → `ms-2` (margin-start)
  - `RoleBasedDashboard.tsx`: Changed all `mr-2` → `me-2` (margin-end) instances (15+ occurrences)
- Replaced mock/hardcoded data in `RevenueChart.tsx` with real API data fetching
- Added loading skeleton state using `Skeleton` component
- Implemented proper TypeScript interfaces (`RevenueChartData`)
- Added graceful fallback for empty data (zero-filled months)

### Why This Change Was Made
- **RTL-First Architecture:** Fixed all directional CSS violations to maintain RTL-first standards
- **User Requirement:** Eliminate all mock data from dashboard components
- **Consistency:** Ensures consistent RTL implementation across all dashboard components
- **UX Improvement:** Added loading states for better user experience
- **Data Integrity:** Ensures chart displays real revenue data from closed deals

### Impact
- **RTL Compliance:** All dashboard components now use logical properties exclusively
- **UX:** Better loading experience with skeleton states
- **Maintainability:** Real data ensures accuracy and eliminates sync issues
- **RTL Consistency:** Complete logical property usage aligns with design system
- **Performance:** No negative impact, uses React Query caching

### Notes / Trade-offs
- Chart library (`recharts`) requires physical coordinates (`left`, `right`) for axis positioning - this is acceptable and documented
- Chart container uses `direction: 'ltr'` which is standard practice for data visualization libraries
- Empty data fallback ensures chart always renders (12 months with zero revenue)
- All icon spacing now uses logical properties (`me-2` instead of `mr-2`) for proper RTL mirroring
