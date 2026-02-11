# API Change Log

## 2026-02-08 – Error Handler Middleware Localization

### What Changed
- Updated centralized error handler middleware to use i18n system
- All error messages now localized based on `Accept-Language` header or `req.locale`
- Validation errors, unknown errors, and AppError instances now use localized messages
- Added proper locale detection with fallback to Arabic

### Why This Change Was Made
- **API Architect Standards:** APIs must own localization, not return hardcoded English
- **User Experience:** Users see errors in their preferred language
- **Consistency:** Aligns with existing i18n infrastructure
- **Architectural Compliance:** Required by API Architect skill requirements

### Impact
- **Localization:** All API errors now respect user's language preference
- **Consistency:** Unified error response format across all endpoints
- **User Experience:** Better error messaging for Arabic-speaking users
- **Maintainability:** Centralized error handling with i18n support

### Notes / Trade-offs
- Uses existing `getErrorResponse()` function from i18n module
- Falls back gracefully if error code not found in i18n files
- Maintains backward compatibility with existing error codes

---

## 2026-02-08 – Revenue Chart Endpoint (`/api/reports/dashboard/revenue-chart`)

### What Changed
- Created new GET endpoint `/api/reports/dashboard/revenue-chart` in `apps/api/routes/reports.ts`
- Endpoint fetches monthly revenue breakdown from closed deals (last 12 months)
- Supports Arabic and English month names based on `Accept-Language` header
- Implements localized error messages (Arabic/English)
- Uses `req.locale` from `localeMiddleware` when available, falls back to manual parsing

### Why This Change Was Made
- **User Requirement:** Replace mock data with real database queries
- **i18n Compliance:** Ensures API-level localization as per API Architect standards
- **Data Accuracy:** Provides real-time revenue data from actual closed deals
- **Consistency:** Aligns with existing API patterns and middleware usage

### Impact
- **API Consumers:** Frontend can now fetch real revenue chart data
- **Localization:** Error messages properly localized (Arabic/English)
- **Performance:** Current implementation acceptable for MVP, may need optimization for large datasets
- **Backward Compatibility:** New endpoint, no breaking changes

### Notes / Trade-offs
- **Performance:** Currently loads all deals then filters in JavaScript - acceptable for MVP but may need database-level filtering for scale
- **Commission Calculation:** Falls back to `agreedPrice * 0.03` if commission field missing - business logic should be documented
- **Locale Detection:** Uses `req.locale` from middleware when available, manual parsing as fallback for compatibility
- **Error Handling:** Properly localized error messages maintain API Architect standards
