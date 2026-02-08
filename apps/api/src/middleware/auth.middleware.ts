import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { prisma } from '../../prismaClient';
import { parseStoredRoles, normalizeRoleKeys } from '@shared/rbac';
import { getErrorResponse } from '../../i18n';

export interface AuthenticatedUser {
    id: string;
    email: string | null;
    username: string | null;
    name: string | null;
    firstName: string;
    lastName: string;
    userLevel: number;
    tenantId: string;
    accountOwnerId: string | null;
    companyName: string | null;
    roles: string[];
    organizationId: string | null;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const locale = (req as any).locale || 'ar'; // locale middleware should run before this

    if (!token) return res.status(401).json(getErrorResponse('ACCESS_TOKEN_REQUIRED', locale));

    const payload = AuthService.verifyToken(token);
    if (!payload) return res.status(403).json(getErrorResponse('INVALID_TOKEN', locale));

    try {
        const user = await prisma.users.findUnique({
            where: { id: payload.userId },
            select: {
                id: true, email: true, username: true, firstName: true, lastName: true,
                roles: true, organizationId: true, isActive: true
            }
        });

        if (!user || !user.isActive) return res.status(403).json(getErrorResponse('USER_INACTIVE', locale));

        const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

        req.user = {
            id: user.id,
            email: user.email ?? null,
            username: user.username ?? null,
            name: displayName || user.username || null,
            firstName: user.firstName,
            lastName: user.lastName,
            userLevel: 1,
            tenantId: user.organizationId || user.id,
            accountOwnerId: null,
            companyName: null,
            roles: normalizeRoleKeys(parseStoredRoles(user.roles)),
            organizationId: user.organizationId
        };
        next();
    } catch (e) {
        console.error('Auth Middleware Error', e);
        res.status(500).json(getErrorResponse('AUTH_FAILED', (req as any).locale || 'ar'));
    }
};
