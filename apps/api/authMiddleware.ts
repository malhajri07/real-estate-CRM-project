/**
 * authMiddleware.ts — Type definitions for the authenticated request user.
 *
 * Defines the shape attached to `req.user` by `authenticateToken` (in `apps/api/auth.ts`)
 * after a valid JWT is verified. Every downstream route handler reads from this shape.
 *
 * @see apps/api/auth.ts — populates `req.user` with this shape
 * @see apps/api/rbac.ts — consumes `roles` for permission checks
 * @see [[Architecture/Authentication & RBAC]] for the full auth flow
 */

import { UserRole } from "@shared/rbac";

/**
 * Shape of the authenticated user attached to every protected request.
 *
 * Populated by {@link authenticateToken} after JWT verification.
 *
 * **Source:** Loaded fresh from the `users` table on every authenticated request
 * (the JWT only carries the userId; the rest is fetched from Postgres so role
 * changes take effect immediately without re-issuing the token).
 *
 * **Consumer:** Every Express route handler reads `req.user` to gate access
 * (`req.user.roles`), scope queries (`req.user.organizationId`), and attribute
 * mutations (`req.user.id` for `agentId`, `createdBy`, audit logs, etc.).
 */
export interface AuthenticatedUser {
    /** users.id (cuid). Used as `agentId`/`createdBy`/`uploadedBy` on owned records. */
    id: string;
    /** Optional — agents authenticate via mobile + OTP, not all users have an email. */
    email: string | null;
    /** Lowercased login handle. Unique within the platform. */
    username: string | null;
    /** Display name — `firstName lastName` joined, or `username`/`email` as fallback. */
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    /** Reserved for future tier-based gating; currently always `1`. */
    userLevel: number;
    /** Effective tenant key — falls back to `id` for individual agents with no org. */
    tenantId: string;
    /** Reserved for delegated access; currently always `null`. */
    accountOwnerId: string | null;
    /** Reserved for downstream display; currently always `null`. */
    companyName: string | null;
    /**
     * Normalized role array. **Source:** parsed from `users.roles` (a comma-separated
     * string in the DB) via `parseStoredRoles` → `normalizeRoleKeys`.
     * **Consumer:** RBAC middleware in `apps/api/rbac.ts` (`hasRole`, `hasPermission`,
     * `requireRole`, `requirePermission`).
     */
    roles: UserRole[];
    /**
     * Org-isolation key. `null` for INDIV_AGENT and end-customers.
     * **Consumer:** every multi-tenant route appends `where: { organizationId }`.
     */
    organizationId: string | null;
}
