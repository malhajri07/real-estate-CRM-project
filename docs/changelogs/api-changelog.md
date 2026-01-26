# API Change Log

## [Unreleased] - 2024-05-23

### Refactored
- **RBAC System**: Moved logic from `routes/rbac-admin.ts` to `src/services/rbac.service.ts` and `src/middleware/rbac.middleware.ts`.
- **Authentication**: Moved logic from `routes/auth.ts` and `apps/api/auth.ts` to `src/services/auth.service.ts` and `src/middleware/auth.middleware.ts`.
- **Validation**: Implemented Zod schemas with Arabic regex support in `src/validators/auth.schema.ts`.
- **Internal Structure**: Established Service/Controller/Validator pattern in `apps/api/src`.

### Added
- **i18n Support**: Added `src/middleware/locale.ts` to inject locale into request context.
- **Seeding**: Added `data/schema/prisma/seed.ts` for property categories (though blocked by schema visibility issues in some environments).
- **RTL Support**: Enforced RTL layout classes across the frontend (logical properties).

### Fixed
- **Audit Logs**: Verified indexing on `audit_logs` table.
- **Naming Conventions**: Documented `snake_case` models vs `PascalCase` convention violation.

### Deprecated
- `apps/api/auth.ts` is now superseded by `src/services/auth.service.ts` but kept for legacy compatibility.
