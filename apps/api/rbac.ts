/**
 * rbac.ts - Role-Based Access Control
 * 
 * Location: apps/api/ → Authentication & Authorization → rbac.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Role-Based Access Control (RBAC) system. Provides:
 * - Role and permission checking
 * - Role-based route protection
 * - Permission validation
 * - User role management
 * 
 * Related Files:
 * - apps/api/rbac-policy.ts - RBAC policy definitions
 * - apps/api/routes/rbac-admin.ts - RBAC admin routes
 * - packages/shared/rbac.ts - Shared RBAC types
 */

import { Request, Response, NextFunction } from 'express';
import {
  UserRole,
  normalizeRoleKeys,
  hasPermission as rolesHavePermission,
} from '@shared/rbac';

export { UserRole } from '@shared/rbac';

/**
 * Check if a user's roles grant a specific permission.
 *
 * @param userRoles - Raw role value (string | string[] | unknown) from `req.user.roles`
 *   or the DB. Normalized internally before checking.
 *   Source: `req.user.roles` / `users.roles`.
 * @param permission - Permission key (e.g. `'listings:manage:corporate'`).
 *   Source: hard-coded at the call site in route middlewares.
 * @returns `true` if any role grants the permission.
 *   Consumer: `requirePermission` middleware, route-level `if` guards.
 */
export function hasPermission(userRoles: unknown, permission: string): boolean {
  const roles = normalizeRoleKeys(userRoles);
  return rolesHavePermission(roles, permission);
}

/**
 * Check if the user holds **any** of the specified roles.
 *
 * @param userRoles - Normalized role array from `req.user.roles`.
 * @param requiredRoles - At least one of these must be present.
 * @returns `true` if there is an intersection.
 *   Consumer: `requireRole` middleware, inline guards across route handlers.
 */
export function hasRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/* ── Role predicate helpers ─────────────────────────────────────────────────
 * One-liner checkers used across route handlers. All take `req.user.roles`
 * (normalized UserRole[]) and return boolean.
 *
 * Consumer: route handlers, maskContact, canClaimBuyerRequest, canReleaseClaim.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Platform super-admin — bypasses org isolation. */
export function isWebsiteAdmin(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.WEBSITE_ADMIN);
}

/** Owns an organization — sees all org data, manages members. */
export function isCorpOwner(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.CORP_OWNER);
}

/** Any broker (corporate or independent) — can list, claim, deal. */
export function isAgent(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, [UserRole.CORP_AGENT, UserRole.INDIV_AGENT]);
}

/** Agent inside an organization — sees org-scoped data. */
export function isCorpAgent(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.CORP_AGENT);
}

/** Independent agent — no organization, self-scoped only. */
export function isIndivAgent(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.INDIV_AGENT);
}

/** Property seller (client portal). */
export function isSeller(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.SELLER);
}

/** Property buyer (client portal). */
export function isBuyer(userRoles: UserRole[]): boolean {
  return userRoles.includes(UserRole.BUYER);
}

/**
 * Express middleware — reject the request with 401 if `req.user` is not set.
 * Should be placed after `authenticateToken` as a secondary guard.
 *
 * Consumer: rarely used directly — most routes use `authenticateToken` which
 * already returns 401 if the token is missing. This is a fallback for routes
 * where optional auth was used upstream.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

/**
 * Express middleware factory — reject the request with 403 unless the user
 * holds **at least one** of the given roles.
 *
 * @param roles - Accepted role(s).
 *   Source: hard-coded at the route level, e.g.
 *   `requireRole([UserRole.CORP_OWNER, UserRole.WEBSITE_ADMIN])`.
 * @returns Middleware that reads `req.user.roles` and either calls `next()`
 *   or returns 403 with the `required` vs `current` roles for debug.
 *
 * @example
 * router.delete('/lead/:id', authenticateToken, requireRole([UserRole.CORP_OWNER]), handler);
 */
export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);
    
    if (!hasRole(userRoles, roles)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: roles,
        current: userRoles
      });
    }
    
    next();
  };
}

/**
 * Express middleware factory — reject with 403 unless the user has the exact
 * permission, resolved via the role → permissions matrix in `rbac-policy.ts`.
 *
 * @param permission - Permission key.
 *   Source: hard-coded at the route level, e.g.
 *   `requirePermission('listings:manage:corporate')`.
 * @returns Middleware that reads `req.user.roles`, normalizes, and checks.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);

    if (!hasPermission(userRoles, permission)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permission,
        current: userRoles
      });
    }
    
    next();
  };
}

/**
 * Express middleware — reject with 403 unless the user belongs to an
 * organization (`req.user.organizationId` is non-null).
 *
 * Use before org-scoped routes that make no sense for INDIV_AGENT users.
 */
export function requireOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.organizationId) {
    return res.status(403).json({ message: 'Organization membership required' });
  }
  
  next();
}

/**
 * Express middleware factory — restrict access to a specific organization.
 * WEBSITE_ADMIN bypasses; all others must match `req.user.organizationId`.
 *
 * @param organizationId - The org to check against.
 *   Source: typically `req.params.orgId` or the value on the resource being accessed.
 */
export function canAccessOrganization(organizationId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);

    // Website admin can access any organization
    if (isWebsiteAdmin(userRoles)) {
      return next();
    }
    
    // User must be in the same organization
    if (req.user.organizationId !== organizationId) {
      return res.status(403).json({ message: 'Cannot access organization data' });
    }
    
    next();
  };
}

// Middleware to check if user can access resource
export function canAccessResource(resourceType: 'property' | 'listing' | 'lead' | 'claim') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRoles = normalizeRoleKeys(req.user.roles);
    
    // Website admin can access any resource
    if (isWebsiteAdmin(userRoles)) {
      return next();
    }
    
    // For now, let the specific route handlers implement detailed access control
    // This is a placeholder for more complex ABAC logic
    next();
  };
}

/**
 * Mask phone/email for users who haven't claimed a buyer request.
 *
 * Admin and agents with an active claim see full contact;
 * everyone else gets `05***1234` / `ab***@domain.com`.
 *
 * @param contact - Object with `phone` and `email` fields.
 *   Source: `buyer_requests.fullContactJson` (parsed) or the customer record.
 * @param userRoles - From `req.user.roles`.
 * @param hasActiveClaim - `true` if the current agent has an active `claims` row
 *   for this buyer request. Source: looked up by the route handler before calling.
 * @returns Same-shape object with masked or unmasked contact.
 *   Consumer: returned to the frontend in the Pool list/detail response.
 */
export function maskContact(contact: any, userRoles: UserRole[], hasActiveClaim: boolean = false): any {
  // Website admin sees full contact
  if (isWebsiteAdmin(userRoles)) {
    return contact;
  }
  
  // Agents with active claim see full contact
  if (isAgent(userRoles) && hasActiveClaim) {
    return contact;
  }
  
  // Otherwise, return masked contact
  return {
    phone: contact.phone ? contact.phone.replace(/(\d{2})\d{3}(\d{4})/, '$1***$2') : null,
    email: contact.email ? contact.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null
  };
}

/** Only agents (CORP_AGENT | INDIV_AGENT) can claim buyer requests. */
export function canClaimBuyerRequest(userRoles: UserRole[], organizationId?: string): boolean {
  return isAgent(userRoles);
}

/**
 * Can the current user release (give up) a claim?
 * Admin: any. Agent: own claims only. CORP_OWNER: their org's agents (simplified).
 */
export function canReleaseClaim(userRoles: UserRole[], claimAgentId: string, userId: string): boolean {
  // Website admin can release any claim
  if (isWebsiteAdmin(userRoles)) {
    return true;
  }
  
  // Agent can release their own claim
  if (isAgent(userRoles) && claimAgentId === userId) {
    return true;
  }
  
  // Corp owner can release claims by their agents
  if (isCorpOwner(userRoles)) {
    // This would need additional logic to check if claimAgentId belongs to the same organization
    return true; // Simplified for now
  }
  
  return false;
}

/** `true` if admin OR agent with an active claim — controls contact unmasking. */
export function canViewFullContact(userRoles: UserRole[], hasActiveClaim: boolean = false): boolean {
  return isWebsiteAdmin(userRoles) || (isAgent(userRoles) && hasActiveClaim);
}

/**
 * Hard-coded claim rate-limit constants.
 * Consumer: `checkClaimRateLimit` below and `routes/buyer-pool.ts`.
 */
export const CLAIM_RATE_LIMITS = {
  MAX_ACTIVE_CLAIMS_PER_AGENT: 5,
  MAX_CLAIMS_PER_BUYER_PER_DAY: 3,
  CLAIM_EXPIRY_HOURS: 72,
  COOLDOWN_HOURS: 24
};

/**
 * Check if the agent has exceeded claim rate limits. Currently a **stub**
 * (always returns `canClaim: true`) — the actual DB check is TODO.
 *
 * @param agentId - The agent attempting to claim.
 * @param buyerRequestId - The target buyer request.
 * @returns `{ canClaim: boolean, reason?, waitTime? }`.
 */
export function checkClaimRateLimit(agentId: string, buyerRequestId: string): {
  canClaim: boolean;
  reason?: string;
  waitTime?: number;
} {
  // This would need to query the database to check current claims
  // For now, return a simplified check
  return {
    canClaim: true
  };
}
