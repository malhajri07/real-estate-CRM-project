/**
 * routes/auth.ts - Authentication API Routes
 * 
 * This file defines all authentication-related API endpoints for the real estate CRM platform.
 * It handles:
 * - User login and authentication
 * - User registration and account creation
 * - User impersonation (admin feature)
 * - Current user information retrieval
 * - JWT token validation and management
 * 
 * The routes integrate with the RBAC (Role-Based Access Control) system and provide
 * secure authentication for all user types in the platform.
 * 
 * Dependencies:
 * - Express.js router for route handling
 * - Zod for request validation
 * - Authentication functions from ../auth.ts
 * - RBAC middleware from ../rbac.ts
 * 
 * API Endpoints:
 * - POST /api/auth/login - User authentication
 * - POST /api/auth/register - User registration
 * - GET /api/auth/me - Get current user info
 * - POST /api/auth/impersonate - Admin user impersonation
 * 
 * Routes affected: All authentication flows
 * Pages affected: Login page, RBAC login page, user registration, admin panel
 */

import express, { type Request } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import {
  login,
  register,
  impersonateUser,
  authenticateToken,
  hashPassword,
  UserRole
} from '../auth';
import { requireRole } from '../rbac';
import { prisma } from '../prismaClient';
import { normalizeRoleKeys } from '@shared/rbac';

const router = express.Router();

const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const LOGIN_MAX_ATTEMPTS = 20;
const USERNAME_PATTERN = /^[a-z0-9_.]{3,32}$/;
const USERNAME_MESSAGE = 'Invalid username. Use 3-32 chars: a-z, 0-9, underscore, dot.';

type LoginAttempt = { count: number; first: number };

const loginAttempts = new Map<string, LoginAttempt>();

const loginSchema = z
  .object({
    username: z.string().min(3).max(64).optional(),
    email: z.string().email().optional(),
    identifier: z.string().min(3).optional(),
    password: z.string().min(6)
  })
  .refine((value) => Boolean(value.username ?? value.email ?? value.identifier), {
    message: 'Username or email is required',
    path: ['identifier']
  });

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roles: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
  organizationId: z.string().optional(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(USERNAME_PATTERN, USERNAME_MESSAGE)
    .optional()
});

const impersonateSchema = z.object({
  targetUserId: z.string()
});

const normalizeUsername = (value?: string | null) => (value ?? '').trim().toLowerCase();

const isValidUsername = (value: string) => USERNAME_PATTERN.test(value);

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) {
    return forwarded[0] ?? req.ip ?? 'unknown';
  }
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? 'unknown';
};

const registerLoginAttempt = (ip: string): boolean => {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now - entry.first > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, first: now });
    return false;
  }

  const updated = { count: entry.count + 1, first: entry.first };
  loginAttempts.set(ip, updated);
  return updated.count > LOGIN_MAX_ATTEMPTS;
};

const resetLoginAttempts = (ip: string) => {
  loginAttempts.delete(ip);
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const credentials = loginSchema.parse(req.body ?? {});
    const ip = getClientIp(req);

    if (registerLoginAttempt(ip)) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
    }

    const normalizedUsername = normalizeUsername(credentials.username ?? credentials.identifier);
    const fallback = credentials.email ?? credentials.identifier ?? '';
    const identifier = normalizedUsername.length ? normalizedUsername : fallback.trim().toLowerCase();

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Username or email is required' });
    }

    const result = await login(identifier, credentials.password);

    if (!result.success || !result.user || !result.token) {
      return res.status(401).json({ success: false, message: result.message ?? 'Invalid credentials' });
    }

    resetLoginAttempts(ip);

    const normalizedRoles = normalizeRoleKeys(result.user.roles);

    if (req.session) {
      const fullName = result.user.name ?? `${result.user.firstName ?? ''} ${result.user.lastName ?? ''}`.trim();
      req.session.user = {
        id: result.user.id,
        email: result.user.email ?? null,
        username: result.user.username ?? null,
        name: fullName.length ? fullName : null,
        firstName: result.user.firstName ?? null,
        lastName: result.user.lastName ?? null,
        roles: normalizedRoles,
        organizationId: result.user.organizationId ?? null
      };
      req.session.authToken = result.token;
    }

    req.user = {
      id: result.user.id,
      email: result.user.email ?? null,
      roles: normalizedRoles,
      organizationId: result.user.organizationId ?? undefined
    };

    res.json({
      success: true,
      user: { ...result.user, roles: normalizedRoles },
      token: result.token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: error.errors
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body ?? {});

    if (payload.username && !isValidUsername(payload.username)) {
      return res.status(400).json({ success: false, message: USERNAME_MESSAGE });
    }

    const normalizedUsername = payload.username ? normalizeUsername(payload.username) : undefined;

    const result = await register({
      ...payload,
      username: normalizedUsername,
      roles: payload.roles
    });

    if (!result.success || !result.user || !result.token) {
      return res.status(400).json({ success: false, message: result.message ?? 'Registration failed' });
    }

    const normalizedRoles = normalizeRoleKeys(result.user.roles);

    if (req.session) {
      const fullName = result.user.name ?? `${result.user.firstName ?? ''} ${result.user.lastName ?? ''}`.trim();
      req.session.user = {
        id: result.user.id,
        email: result.user.email ?? null,
        username: result.user.username ?? null,
        name: fullName.length ? fullName : null,
        firstName: result.user.firstName ?? null,
        lastName: result.user.lastName ?? null,
        roles: normalizedRoles,
        organizationId: result.user.organizationId ?? null
      };
      req.session.authToken = result.token;
    }

    req.user = {
      id: result.user.id,
      email: result.user.email ?? null,
      roles: normalizedRoles,
      organizationId: result.user.organizationId ?? undefined
    };

    res.status(201).json({
      success: true,
      user: { ...result.user, roles: normalizedRoles },
      token: result.token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: error.errors
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const sessionUser = req.session?.user;

    if (sessionUser) {
      return res.json({
        success: true,
        user: { ...sessionUser, roles: normalizeRoleKeys(sessionUser.roles ?? []) }
      });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const normalizedRoles = normalizeRoleKeys(req.user.roles ?? []);

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email ?? null,
        username: null,
        name: null,
        firstName: null,
        lastName: null,
        organizationId: req.user.organizationId ?? null,
        roles: normalizedRoles
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
});

// POST /api/auth/impersonate (admin only)
router.post('/impersonate', 
  authenticateToken, 
  requireRole([UserRole.WEBSITE_ADMIN]), 
  async (req, res) => {
    try {
      const { targetUserId } = impersonateSchema.parse(req.body);
      
      const result = await impersonateUser(req.user!.id, targetUserId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json({
        success: true,
        token: result.token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid input',
          errors: error.errors 
        });
      }
      
      console.error('Impersonation error:', error);
      res.status(500).json({ message: 'Impersonation failed' });
    }
  }
);

// POST /api/auth/logout (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (req.session) {
      await new Promise<void>((resolve, reject) => {
        req.session!.destroy((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// Dev helper to ensure a primary admin account exists
router.post('/ensure-primary-admin', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not allowed in production' });
    }

    const setupToken = req.headers['x-setup-token'] as string | undefined;
    const expected = process.env.ADMIN_SETUP_TOKEN || 'dev';

    if (!setupToken || setupToken !== expected) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      username = 'admin',
      password = 'admin123',
      email = 'admin@aqaraty.com'
    } = (req.body ?? {}) as { username?: string; password?: string; email?: string };

    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername || !password) {
      return res.status(400).json({ success: false, message: 'username and password required' });
    }

    if (!isValidUsername(normalizedUsername)) {
      return res.status(400).json({ success: false, message: USERNAME_MESSAGE });
    }

    const passwordHash = await hashPassword(password);
    const roles = JSON.stringify([UserRole.WEBSITE_ADMIN]);

    let user = await prisma.users.findUnique({ where: { username: normalizedUsername } });

    if (!user) {
      user = await prisma.users.create({
        data: {
          id: randomUUID(),
          username: normalizedUsername,
          email,
          firstName: 'Primary',
          lastName: 'Admin',
          passwordHash,
          roles,
          isActive: true
        }
      });

      return res.json({ success: true, created: true, user: { id: user.id, username: user.username } });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        roles,
        isActive: true,
        email: email || user.email
      }
    });

    return res.json({ success: true, created: false, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('ensure-primary-admin error:', error instanceof Error ? error.message : error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export const __authTestHooks = {
  resetLoginAttempts: () => loginAttempts.clear()
};

export default router;
