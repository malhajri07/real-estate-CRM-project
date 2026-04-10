/**
 * auth.ts - Authentication Utilities
 * 
 * Location: apps/api/ → Authentication & Authorization → auth.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Authentication utilities for user authentication. Provides:
 * - User login and registration
 * - JWT token generation and validation
 * - Password hashing and verification
 * - User session management
 * 
 * Related Files:
 * - apps/api/routes/auth.ts - Authentication API routes
 * - apps/api/authMiddleware.ts - Auth middleware
 * - apps/api/rbac.ts - RBAC system
 */

import { Request, Response, NextFunction } from 'express';
import './types/express-session';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { prisma } from './prismaClient';
import {
  UserRole,
  parseStoredRoles,
  serializeRoles,
  normalizeRoleKeys,
} from '@shared/rbac';
export { UserRole } from '@shared/rbac';
import { JWT_SECRET as getJwtSecret } from './config/env';
import type { AuthenticatedUser } from './authMiddleware';

// JWT secret - getJwtSecret() will throw if missing (secure behavior)
const JWT_SECRET = getJwtSecret();

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string | null;
  username?: string | null;
  roles: string; // Store as string to match database
  organizationId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Create a signed JWT carrying user identity + role string + org scope.
 *
 * @param user - Minimal user fields. Source: `users` table, loaded at login/register.
 * @returns Signed JWT string (HS256, 24 h expiry).
 *   Consumer: sent to the frontend as `{ token }`, stored in localStorage,
 *   and attached to every API call via `Authorization: Bearer <token>`.
 *
 * @sideEffect None — pure function (no DB write).
 */
export function generateToken(user: {
  id: string;
  email: string | null;
  username?: string | null;
  roles: string; // Store as string to match database
  organizationId?: string;
}): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username ?? null,
    roles: user.roles,
    organizationId: user.organizationId
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Decode and verify a JWT. Returns the payload on success, `null` on any
 * failure (expired, tampered, malformed).
 *
 * @param token - Raw JWT string. Source: `Authorization: Bearer <token>` header.
 * @returns Decoded payload or `null`.
 *   Consumer: `authenticateToken` middleware.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Express middleware — extract the Bearer token from the `Authorization` header,
 * verify it, load the user from Postgres, and attach it to `req.user`.
 *
 * The user is loaded fresh on **every request** (not cached from the JWT) so
 * role changes and deactivation take effect immediately.
 *
 * @param req - Express request. Reads `req.headers['authorization']`.
 *   Source: frontend fetch wrapper in `apps/web/src/lib/queryClient.ts` which
 *   attaches the stored JWT to every request.
 * @sideEffect Populates `req.user` (type: {@link AuthenticatedUser}) for
 *   downstream handlers.
 *
 * @throws 401 if no token provided
 * @throws 403 if token invalid/expired or user inactive
 * @throws 500 on Prisma/DB errors
 *
 * @see [[Architecture/Authentication & RBAC]]
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  try {
    // Fetch user from database to ensure they still exist and are active
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
      return res.status(403).json({ message: 'User not found or inactive' });
    }

    // Set user in request object
    const parsedRoles = parseStoredRoles(user.roles);
    const normalizedRoles = normalizeRoleKeys(parsedRoles);
    const displayName = [user.firstName, user.lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(' ')
      .trim();

    req.user = {
      id: user.id,
      email: user.email ?? null,
      username: user.username ?? null,
      name: displayName.length ? displayName : (user.username ?? user.email ?? null),
      firstName: user.firstName,
      lastName: user.lastName,
      userLevel: 1,
      tenantId: user.organizationId ?? user.id,
      accountOwnerId: null,
      companyName: null,
      roles: normalizedRoles,
      organizationId: user.organizationId ?? null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed' });
  }
}

/**
 * Like `authenticateToken` but **never rejects** — if the token is missing
 * or invalid, `req.user` stays `undefined` and the request continues.
 *
 * Used on routes that work for both anonymous and authenticated users
 * (e.g. public property listing + "is this favorited?" for logged-in).
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without authentication
  }

  const payload = verifyToken(token);
  if (!payload) {
    return next(); // Continue without authentication
  }

  try {
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

    if (user && user.isActive) {
      const parsedRoles = parseStoredRoles(user.roles);
      const normalizedRoles = normalizeRoleKeys(parsedRoles);
      const displayName = [user.firstName, user.lastName]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(' ')
        .trim();

      req.user = {
        id: user.id,
        email: user.email ?? null,
        username: user.username ?? null,
        name: displayName.length ? displayName : (user.username ?? user.email ?? null),
        firstName: user.firstName,
        lastName: user.lastName,
        userLevel: 1,
        tenantId: user.organizationId ?? user.id,
        accountOwnerId: null,
        companyName: null,
        roles: normalizedRoles,
        organizationId: user.organizationId ?? null
      };
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue even if authentication fails
  }
}

import bcrypt from 'bcryptjs';

/**
 * Hash a plaintext password with bcrypt (12 salt rounds).
 *
 * @param password - Plaintext. Source: register form or admin reset.
 * @returns bcrypt hash. Consumer: stored in `users.passwordHash`.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Constant-time comparison of a plaintext password against a bcrypt hash.
 *
 * @param password - Candidate plaintext. Source: login form.
 * @param hash - Stored bcrypt hash. Source: `users.passwordHash`.
 * @returns `true` if they match.
 *   Consumer: `login()` below.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    if (!password || !hash) {
      console.error('comparePassword: Missing password or hash', { 
        hasPassword: !!password, 
        hasHash: !!hash,
        passwordLength: password?.length,
        hashLength: hash?.length 
      });
      return false;
    }
    const result = await bcrypt.compare(password, hash);
    return result;
  } catch (error) {
    console.error('comparePassword error:', error);
    return false;
  }
}

/**
 * Authenticate a user by username or email + password. This is the
 * **admin login** flow; agent login uses OTP via `/api/auth/send-otp`.
 *
 * @param identifier - Username or email. Source: admin login form.
 * @param password - Plaintext password. Source: admin login form.
 * @returns `{ success, user?, token?, message? }`.
 *   Consumer: `POST /api/auth/login` handler in `routes/auth.ts`.
 *
 * @sideEffect Updates `users.lastLoginAt` on success.
 */
export async function login(identifier: string, password: string): Promise<{
  success: boolean;
  user?: any;
  token?: string;
  message?: string;
}> {
  try {
    
    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier) {
      return { success: false, message: 'Invalid credentials' };
    }

    const lookupIdentifier = normalizedIdentifier.toLowerCase();

    // Try to find by username first, then by email for compatibility
    let user = null;
    
    try {
      user = await prisma.users.findUnique({
        where: { username: lookupIdentifier }
      });
    } catch (error) {
      console.error('Error querying by username:', error);
    }

    if (!user) {
      try {
        // Only query by email if the identifier looks like an email
        if (lookupIdentifier.includes('@')) {
          user = await prisma.users.findUnique({
            where: { email: lookupIdentifier }
          });
        }
      } catch (error) {
        console.error('Error querying by email:', error);
      }
    }

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isActive) {
      return { success: false, message: 'Account is not active' };
    }

    
    const isValidPassword = await comparePassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      return { success: false, message: 'Invalid credentials' };
    }


    // Update last login
    try {
      await prisma.users.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), updatedAt: new Date() }
      });
    } catch (updateError) {
      console.error('Failed to update last login (non-critical):', updateError);
      // Continue anyway - this is not critical for login
    }

    // Parse roles safely
    let parsedRoles: any[] = [];
    let normalizedRoles: any[] = [];
    try {
      parsedRoles = parseStoredRoles(user.roles);
      normalizedRoles = normalizeRoleKeys(parsedRoles);
    } catch (roleError) {
      console.error('Error parsing roles:', roleError);
      // Default to empty roles array if parsing fails
      normalizedRoles = [];
    }

    const displayName = [user.firstName, user.lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(' ')
      .trim();
    
    // Generate token safely
    let token: string;
    try {
      token = generateToken({
        id: user.id,
        email: user.email ?? null,
        username: (user as any).username ?? null,
        roles: user.roles,
        organizationId: user.organizationId || undefined
      });
    } catch (tokenError) {
      console.error('Error generating token:', tokenError);
      throw new Error(`Failed to generate authentication token: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`);
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email ?? null,
        username: (user as any).username ?? null,
        name: displayName.length ? displayName : ((user as any).username ?? user.email ?? null),
        firstName: user.firstName,
        lastName: user.lastName,
        roles: normalizedRoles,
        organizationId: user.organizationId
      },
      token
    };
  } catch (error) {
    console.error('=== LOGIN FUNCTION ERROR ===');
    console.error('Login error:', error);
    // Provide more specific error messages
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // Check for database connection errors
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED') || error.message.includes('P1001')) {
        return { success: false, message: 'Database connection failed. Please try again later.' };
      }
      // Check for Prisma errors
      if (error.message.includes('prisma') || error.message.includes('Prisma') || error.message.includes('P')) {
        return { success: false, message: `Database error: ${error.message}` };
      }
      // Check for JWT errors
      if (error.message.includes('JWT') || error.message.includes('secret')) {
        return { success: false, message: `Authentication configuration error: ${error.message}` };
      }
      return { success: false, message: error.message || 'Login failed' };
    }
    console.error('=== LOGIN FUNCTION ERROR END ===');
    return { success: false, message: 'Login failed. Please try again.' };
  }
}

/**
 * Create a new user account + return a signed JWT.
 *
 * @param userData - Registration payload.
 *   Source: `POST /api/auth/register` handler in `routes/auth.ts`.
 * @returns `{ success, user?, token?, message? }`.
 *   Consumer: same route handler — responds with the token so the
 *   frontend can auto-login after signup.
 *
 * @sideEffect Creates a row in `users`.
 */
export async function register(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string; // Store as string to match database
  organizationId?: string;
  username?: string;
}): Promise<{
  success: boolean;
  user?: any;
  token?: string;
  message?: string;
}> {
  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    const normalizedRolesArray = normalizeRoleKeys(userData.roles);
    const normalizedRoles = serializeRoles(normalizedRolesArray);

    // Create user
    const now = new Date();
    const username = (userData.username ?? userData.email ?? `user-${Date.now()}`)
      .trim()
      .toLowerCase();
    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        username,
        email: userData.email,
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
      username: user.username ?? null,
      roles: user.roles,
      organizationId: user.organizationId || undefined
    });

    const parsedRoles = parseStoredRoles(user.roles);
    const normalizedRolesForResponse = normalizeRoleKeys(parsedRoles);
    const displayName = [user.firstName, user.lastName]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join(' ')
      .trim();

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email ?? null,
        username: user.username ?? null,
        name: displayName.length ? displayName : (user.username ?? user.email ?? null),
        firstName: user.firstName,
        lastName: user.lastName,
        roles: normalizedRolesForResponse,
        organizationId: user.organizationId
      },
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Registration failed' };
  }
}

/**
 * Generate a JWT for another user, allowing admin to "log in as" them.
 * Restricted to WEBSITE_ADMIN. Writes an audit log entry.
 *
 * @param adminUserId - The admin performing the impersonation.
 *   Source: `req.user.id` from the calling route handler.
 * @param targetUserId - The user to impersonate.
 *   Source: `POST /api/auth/impersonate` body (`targetUserId` field).
 * @returns `{ success, token?, message? }`.
 *   Consumer: frontend stores the new token and navigates to the platform
 *   as the impersonated user.
 *
 * @sideEffect Creates an `audit_logs` row with action `IMPERSONATE`.
 */
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
      username: targetUser.username ?? null,
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

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
    }
  }
}
