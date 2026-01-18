/**
 * authUtils.ts - Authentication Utilities
 * 
 * Location: apps/web/src/ → Lib/ → authUtils.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Authentication utility functions. Provides:
 * - Error checking utilities
 * - Auth-related helpers
 * 
 * Related Files:
 * - apps/web/src/components/auth/AuthProvider.tsx - Auth context
 * - apps/api/routes/auth.ts - Authentication API routes
 */

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}