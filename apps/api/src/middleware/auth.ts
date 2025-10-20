// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prismaClient';
import { JWT_SECRET as getJwtSecret } from '../../config/env';
import { normalizeRoleKeys, parseStoredRoles } from '@shared/rbac';
const JWT_SECRET = getJwtSecret();

// Real authentication middleware using Prisma
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch user from database
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        roles: true,
        organizationId: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    // Parse roles from JSON string
    const parsedRoles = parseStoredRoles(user.roles);
    const roles = normalizeRoleKeys(parsedRoles);
    const displayName = [user.firstName, user.lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(' ')
      .trim();

    // Set user in request object
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username ?? null,
      name: displayName.length ? displayName : (user.username ?? user.email ?? null),
      firstName: user.firstName,
      lastName: user.lastName,
      roles: roles,
      organizationId: user.organizationId ?? null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        username: string | null;
        name: string | null;
        firstName?: string | null;
        lastName?: string | null;
        roles: string[];
        organizationId?: string | null;
      };
    }
  }
}
