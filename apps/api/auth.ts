import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from './prismaClient';
import {
  UserRole,
  parseStoredRoles,
  serializeRoles,
  normalizeRoleKeys,
} from '@shared/rbac';
export { UserRole } from '@shared/rbac';
import { JWT_SECRET as getJwtSecret } from './config/env';

// JWT secret (should be in environment variables)
const JWT_SECRET = getJwtSecret();

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string | null;
  roles: string; // Store as string to match database
  organizationId?: string;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export function generateToken(user: {
  id: string;
  email: string | null;
  roles: string; // Store as string to match database
  organizationId?: string;
}): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    roles: user.roles,
    organizationId: user.organizationId
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];

  if (Array.isArray(authHeader)) {
    for (const value of authHeader) {
      if (typeof value === 'string' && value.startsWith('Bearer ')) {
        const token = value.slice('Bearer '.length).trim();
        if (token) {
          return token;
        }
      }
    }
  } else if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token) {
        return token;
      }
    }
  }

  return req.session?.authToken ?? null;
}

function persistSessionSnapshot(
  req: Request,
  token: string,
  user: {
    id: string;
    email: string | null;
    username?: string | null;
    firstName: string;
    lastName: string;
    roles: ReturnType<typeof parseStoredRoles>;
    organizationId?: string | null;
  }
) {
  if (!req.session) return;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

  req.session.user = {
    id: user.id,
    email: user.email,
    username: user.username ?? null,
    name: fullName.length ? fullName : null,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    organizationId: user.organizationId ?? null
  };
  req.session.authToken = token;
}

function clearSessionSnapshot(req: Request) {
  if (!req.session) return;
  delete req.session.user;
  delete req.session.authToken;
}

async function attachUserFromToken(req: Request, token: string) {
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: { id: payload.userId },
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
    return null;
  }

  const parsedRoles = parseStoredRoles(user.roles);

  req.user = {
    id: user.id,
    email: user.email ?? null,
    roles: parsedRoles,
    organizationId: user.organizationId || undefined
  };

  persistSessionSnapshot(req, token, {
    id: user.id,
    email: user.email ?? null,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: parsedRoles,
    organizationId: user.organizationId ?? null
  });

  return req.user;
}

// Authentication middleware
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    clearSessionSnapshot(req);
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = await attachUserFromToken(req, token);
    if (!user) {
      clearSessionSnapshot(req);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    clearSessionSnapshot(req);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const user = await attachUserFromToken(req, token);
    if (!user) {
      clearSessionSnapshot(req);
    }
  } catch (error) {
    console.error('Optional authentication error:', error);
    clearSessionSnapshot(req);
  }

  next();
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Login function
// Updated to support username-based login (email kept for compatibility if used elsewhere)
export async function login(identifier: string, password: string): Promise<{
  success: boolean;
  user?: any;
  token?: string;
  message?: string;
}> {
  try {
    const trimmedIdentifier = identifier.trim();
    const normalizedIdentifier = trimmedIdentifier.toLowerCase();
    // Try to find by username first, then by email for compatibility
    const user =
      (await prisma.users.findUnique({
        where: { username: normalizedIdentifier }
      })) ??
      (await prisma.users.findUnique({
        where: { email: trimmedIdentifier }
      }));

    if (!user || !user.isActive) {
      return { success: false, message: 'Invalid credentials' };
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), updatedAt: new Date() }
    });

    const parsedRoles = parseStoredRoles(user.roles);
    const token = generateToken({
      id: user.id,
      email: user.email ?? null,
      roles: user.roles,
      organizationId: user.organizationId || undefined
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email ?? null,
        username: (user as any).username,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        roles: parsedRoles,
        organizationId: user.organizationId
      },
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Login failed' };
  }
}

// Register function
export async function register(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: string | string[];
  organizationId?: string;
  username?: string;
}): Promise<{
  success: boolean;
  user?: any;
  token?: string;
  message?: string;
}> {
  try {
    const normalizedEmail = userData.email.trim().toLowerCase();

    if (normalizedEmail) {
      const existingUser = await prisma.users.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        return { success: false, message: 'User already exists' };
      }
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    const normalizedRoles = serializeRoles(normalizeRoleKeys(userData.roles));

    // Create user
    const now = new Date();
    const username = (userData.username ?? normalizedEmail ?? `user-${Date.now()}`)
      .trim()
      .toLowerCase();
    const existingUsername = await prisma.users.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return { success: false, message: 'Username already exists' };
    }
    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        username,
        email: normalizedEmail,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        roles: normalizedRoles,
        organizationId: userData.organizationId ?? null,
        updatedAt: now
      }
    });

    const token = generateToken({
      id: user.id,
      email: user.email ?? null,
      roles: user.roles,
      organizationId: user.organizationId || undefined
    });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email ?? null,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          roles: parseStoredRoles(user.roles),
          organizationId: user.organizationId
        },
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

// Impersonation function (for website admin)
export async function impersonateUser(adminUserId: string, targetUserId: string): Promise<{
  success: boolean;
  token?: string;
  message?: string;
}> {
  try {
    // Check if admin user has WEBSITE_ADMIN role
    const adminUser = await prisma.users.findUnique({
      where: { id: adminUserId },
      select: { roles: true }
    });

    if (!adminUser) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const adminRoles = parseStoredRoles(adminUser.roles);
    if (!adminRoles.includes(UserRole.WEBSITE_ADMIN)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    // Get target user
    const targetUser = await prisma.users.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return { success: false, message: 'Target user not found' };
    }

    // Generate token for target user
    const token = generateToken({
      id: targetUser.id,
      email: targetUser.email ?? null,
      roles: targetUser.roles,
      organizationId: targetUser.organizationId || undefined
    });

    // Log impersonation
    await prisma.audit_logs.create({
      data: {
        id: randomUUID(),
        userId: adminUserId,
        action: 'IMPERSONATE',
        entity: 'USER',
        entityId: targetUserId,
        afterJson: JSON.stringify({ impersonatedUser: targetUser.email })
      }
    });

    return { success: true, token };
  } catch (error) {
    console.error('Impersonation error:', error);
    return { success: false, message: 'Impersonation failed' };
  }
}
