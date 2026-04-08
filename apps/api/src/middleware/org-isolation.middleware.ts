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

    // Global admins always pass
    const roles = user.roles ?? [];
    if (roles.includes(UserRole.WEBSITE_ADMIN)) {
        return next();
    }

    // Individual agents without an org are allowed through — they get user-scoped access
    if (!user.organizationId && roles.includes(UserRole.INDIV_AGENT)) {
        logger.debug({ userId: user.id, path: req.path }, 'Individual agent accessing org-scoped route (user-scoped)');
        return next();
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
    } else if (user && roles.includes(UserRole.INDIV_AGENT)) {
        // Individual agents without org see their own data only
        (req as any).orgFilter = { userId: user.id };
    } else {
        // Unauthenticated or missing org — return empty results, not an error
        (req as any).orgFilter = { organizationId: '__none__' };
    }

    next();
};

/**
 * injectWriteFilter — Restricts write operations for CORP_AGENT to own records only.
 *
 * CORP_AGENT can VIEW all org data (via injectOrgFilter) but can only
 * WRITE (create/edit/delete) their own records.
 *
 * CORP_OWNER and WEBSITE_ADMIN can write any org record.
 * INDIV_AGENT writes are always self-scoped (already handled by injectOrgFilter).
 *
 * Usage:
 *   router.put("/:id", authenticateToken, injectOrgFilter, injectWriteFilter, handler);
 *   // In handler: use req.writeFilter for Prisma where clause on mutations
 */
export const injectWriteFilter = (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    const roles = user?.roles ?? [];

    if (roles.includes(UserRole.WEBSITE_ADMIN) || roles.includes(UserRole.CORP_OWNER)) {
        // Admin and owner can write any record in their org
        (req as any).writeFilter = (req as any).orgFilter || {};
    } else if (user && roles.includes(UserRole.CORP_AGENT)) {
        // Corp agent can only write their own records
        (req as any).writeFilter = { agentId: user.id };
    } else if (user && roles.includes(UserRole.INDIV_AGENT)) {
        // Individual agent — own records only
        (req as any).writeFilter = { agentId: user.id };
    } else {
        (req as any).writeFilter = { agentId: '__none__' };
    }

    next();
};

/**
 * guardWriteAccess — Validates that the authenticated user can write to a specific resource.
 * CORP_AGENT can only write records where agentId matches their own.
 * CORP_OWNER can write any record in their org.
 *
 * Usage:
 *   const record = await prisma.leads.findUnique(...);
 *   if (!guardWriteAccess(req, record)) {
 *     return res.status(403).json({ error: 'FORBIDDEN', message: 'يمكنك تعديل سجلاتك فقط' });
 *   }
 */
export function guardWriteAccess(req: Request, resource: { agentId?: string | null; organizationId?: string | null } | null): boolean {
    if (!resource) return false;
    const user = req.user;
    if (!user) return false;

    const roles = user.roles ?? [];
    if (roles.includes(UserRole.WEBSITE_ADMIN)) return true;
    if (roles.includes(UserRole.CORP_OWNER) && user.organizationId === resource.organizationId) return true;
    if (roles.includes(UserRole.INDIV_AGENT) && resource.agentId === user.id) return true;
    if (roles.includes(UserRole.CORP_AGENT) && resource.agentId === user.id) return true;

    return false;
}

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
    if (roles.includes(UserRole.WEBSITE_ADMIN)) return true;

    if (!resourceOrgId) return false;
    return user.organizationId === resourceOrgId;
}
