/**
 * org-isolation.middleware.ts — Organization Isolation Middleware (A-010)
 *
 * Enforces that every authenticated request operates within the user's
 * organization context. Prevents cross-tenant data access by injecting
 * orgId into the request and verifying it matches path/body params.
 *
 * Usage:
 *   import { requireOrg, injectOrgFilter } from './org-isolation.middleware';
 *   router.use(authenticateToken, requireOrg);           // blocks requests with no org
 *   router.use(authenticateToken, injectOrgFilter);      // allows admins to bypass
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@shared/rbac';
import { logger } from '../../logger';

/**
 * requireOrg — Hard block: user MUST belong to an organization.
 * Use on routes that are always org-scoped (leads, listings, pool, etc.)
 */
export const requireOrg = (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
        res.status(401).json({ error: 'UNAUTHENTICATED', message: 'Authentication required' });
        return;
    }

    if (!user.organizationId) {
        logger.warn({ userId: user.id, path: req.path }, 'Org-isolated route accessed without organizationId');
        res.status(403).json({
            error: 'NO_ORGANIZATION',
            message: 'This action requires an organization context'
        });
        return;
    }

    next();
};

/**
 * injectOrgFilter — Soft inject: adds req.orgFilter for use in Prisma where clauses.
 * WEBSITE_ADMIN and CORP_OWNER get no filter (can see all).
 * All other roles are scoped to their own organization.
 *
 * Usage in route handler:
 *   const listings = await prisma.listings.findMany({ where: req.orgFilter });
 */
export const injectOrgFilter = (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    const roles = user?.roles ?? [];

    const isGlobalAdmin = roles.includes(UserRole.WEBSITE_ADMIN);

    if (isGlobalAdmin) {
        // Admin can query all orgs; no filter applied
        (req as any).orgFilter = {};
    } else if (user?.organizationId) {
        (req as any).orgFilter = { organizationId: user.organizationId };
    } else {
        // Unauthenticated or missing org — return empty results, not an error
        (req as any).orgFilter = { organizationId: '__none__' };
    }

    next();
};

/**
 * guardOrgParam — Validates that a resource's organizationId in the DB
 * matches the authenticated user's org. Used in GET/:id / PUT/:id / DELETE/:id
 * after fetching the resource from the database.
 *
 * Usage:
 *   const record = await prisma.leads.findUnique(...);
 *   if (!guardOrgAccess(req, record?.organizationId)) {
 *     return res.status(403).json({ error: 'FORBIDDEN' });
 *   }
 */
export function guardOrgAccess(req: Request, resourceOrgId: string | null | undefined): boolean {
    const user = req.user;
    if (!user) return false;

    const roles = user.roles ?? [];
    if (roles.includes(UserRole.WEBSITE_ADMIN)) return true; // Admin bypasses all org checks

    if (!resourceOrgId) return false; // Resource has no org — deny by default
    return user.organizationId === resourceOrgId;
}
