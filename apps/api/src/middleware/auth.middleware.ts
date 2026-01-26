import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { prisma } from '../../prismaClient';
import { parseStoredRoles, normalizeRoleKeys } from '@shared/rbac';

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

    if (!token) return res.status(401).json({ message: 'Access token required' });

    const payload = AuthService.verifyToken(token);
    if (!payload) return res.status(403).json({ message: 'Invalid or expired token' });

    try {
        const user = await prisma.users.findUnique({
            where: { id: payload.userId },
            select: {
                id: true, email: true, username: true, firstName: true, lastName: true,
                roles: true, organizationId: true, isActive: true
            }
        });

        if (!user || !user.isActive) return res.status(403).json({ message: 'User inactive' });

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
        res.status(500).json({ message: 'Authentication failed' });
    }
};
