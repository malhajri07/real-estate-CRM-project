import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prismaClient';
import { UserRole, normalizeRoleKeys } from '@shared/rbac';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as getJwtSecret } from '../../config/env';

const JWT_SECRET = getJwtSecret();

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[RBAC-ADMIN] Request: ${req.method} ${req.path}`);
    try {
        const headerToken = req.headers.authorization?.replace('Bearer ', '');
        const session = req.session as any;
        const sessionToken = session?.authToken;
        const sessionUser = session?.user;

        if (!headerToken && !sessionToken && !sessionUser) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const loadUser = async (userId: string) =>
            prisma.users.findUnique({
                where: { id: userId }
            });

        const ensureAdmin = (rolesValue: unknown) =>
            normalizeRoleKeys(rolesValue).includes(UserRole.WEBSITE_ADMIN);

        const validateAdminAccess = (user: any, roles: any[]) => {
            const hasRole = ensureAdmin(roles);
            const isNamedAdmin = user?.username === 'admin';

            if (!hasRole && !isNamedAdmin) return { valid: false };

            const finalRoles = hasRole ? roles : [...roles, UserRole.WEBSITE_ADMIN];
            return { valid: true, finalRoles };
        };

        if (headerToken) {
            const decoded = jwt.verify(headerToken, JWT_SECRET) as any;
            const user = await loadUser(decoded.userId);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            const parsedRoles = JSON.parse(user.roles);
            const userRoles = normalizeRoleKeys(parsedRoles);

            const { valid, finalRoles } = validateAdminAccess(user, userRoles);
            if (!valid) {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            (req as any).user = {
                ...user,
                roles: finalRoles!,
                name: user.firstName + ' ' + user.lastName,
                userLevel: 1,
                tenantId: user.organizationId || user.id
            };
            return next();
        }

        if (sessionToken) {
            const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
            const user = await loadUser(decoded.userId);
            if (!user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }
            const parsedRoles = JSON.parse(user.roles);
            const userRoles = normalizeRoleKeys(parsedRoles);

            const { valid, finalRoles } = validateAdminAccess(user, userRoles);
            if (!valid) {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }

            (req as any).user = {
                ...user,
                roles: finalRoles!,
                name: user.firstName + ' ' + user.lastName,
                userLevel: 1,
                tenantId: user.organizationId || user.id
            };
            return next();
        }

        if (sessionUser) {
            const userRoles = normalizeRoleKeys(sessionUser.roles);
            const { valid, finalRoles } = validateAdminAccess(sessionUser, userRoles);
            if (!valid) {
                return res.status(403).json({ success: false, message: 'Admin access required' });
            }
            (req as any).user = {
                ...sessionUser,
                roles: finalRoles!
            };
            return next();
        }

        return res.status(401).json({ success: false, message: 'No valid authentication' });
    } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};
