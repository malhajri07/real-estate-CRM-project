/**
 * routes/auth.ts - Authentication API Routes
 * Refactored to use AuthService, AuthValidator, and AuthMiddleware
 */

import { Router } from 'express';
import { AuthService } from '../src/services/auth.service';
import { authSchemas } from '../src/validators/auth.schema';
import { authenticateToken } from '../src/middleware/auth.middleware';
import { z } from 'zod';
import { UserRole } from '@shared/rbac';
import { prisma } from '../prismaClient';
import bcrypt from 'bcryptjs';
import { getErrorResponse } from '../i18n';

const router = Router();
const authService = new AuthService();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const credentials = authSchemas.login.parse(req.body);
    const identifier = credentials.identifier || credentials.email || credentials.username;

    if (!identifier) {
      const locale = (req as any).locale || 'ar';
      return res.status(400).json(getErrorResponse('IDENTIFIER_REQUIRED', locale));
    }

    const result = await authService.login(identifier, credentials.password);

    if (req.session) {
      req.session.user = result.user as any;
      req.session.authToken = result.token;
    }

    res.json({ success: true, ...result });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    console.error('Login Error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    // If it's a known service error, we might want to map it, but for now fallback to general
    const locale = (req as any).locale || 'ar';
    res.status(401).json(getErrorResponse('LOGIN_FAILED', locale, { originalError: message }));
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const data = authSchemas.register.parse(req.body);
    const result = await authService.register(data);

    if (req.session) {
      req.session.user = result.user as any;
      req.session.authToken = result.token;
    }

    res.status(201).json({ success: true, ...result });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    console.error('Registration Error:', error);
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// GET /api/auth/user
// Keeping this signature as it was in original file (returns user directly)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user!.id },
      include: {
        organization: true,
        agent_profiles: true,
      },
    });
    res.json(user);
  } catch (e) {
    const locale = (req as any).locale || 'ar';
    res.status(500).json(getErrorResponse('SERVER_ERROR', locale));
  }
});

// POST /api/auth/impersonate
router.post('/impersonate', authenticateToken, async (req, res) => {
  try {
    // Enforce admin check inline or via middleware (AuthService also checks, but good to check here too if desired)
    if (!req.user?.roles.includes(UserRole.WEBSITE_ADMIN)) {
      return res.status(403).json(getErrorResponse('FORBIDDEN', (req as any).locale));
    }

    const { targetUserId } = authSchemas.impersonate.parse(req.body);
    const result = await authService.impersonate(req.user.id, targetUserId);

    res.json({ success: true, ...result });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    console.error('Impersonate Error:', error);
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Impersonation failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  // Client-side token removal mostly
  const locale = (req as any).locale || 'ar';
  res.json({ success: true, message: (req as any).t('LOGOUT_SUCCESS') || 'Logged out successfully' });
});

// Dev-only helper to ensure a primary admin exists
router.post('/ensure-primary-admin', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_RESET !== 'true') {
      return res.status(403).json({ success: false, message: 'Not allowed in production' });
    }
    const token = req.headers['x-setup-token'] as string | undefined;
    const expected = process.env.ADMIN_SETUP_TOKEN || 'dev';
    if (!token || token !== expected) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { username = 'admin', password = 'admin123', email = 'admin@realestateInfo.com' } = req.body || {};
    const normalized = (username || '').trim().toLowerCase();

    // Hash using bcrypt directly or via service
    const passwordHash = await AuthService.hashPassword(password);
    const roles = JSON.stringify(['WEBSITE_ADMIN']);

    let user = await prisma.users.findUnique({ where: { username: normalized } });

    if (!user) {
      user = await prisma.users.create({
        data: {
          username: normalized,
          email, // Use provided email
          firstName: 'Primary',
          lastName: 'Admin',
          passwordHash,
          roles,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      return res.json({ success: true, created: true, user: { id: user.id, username: user.username } });
    }

    // Update existing user
    await prisma.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        roles,
        isActive: true,
        email: email || user.email // Keep existing email if none provided, or update
      },
    });
    return res.json({ success: true, created: false, user: { id: user.id, username: user.username } });

  } catch (e: any) {
    console.error('ensure-primary-admin error:', e?.message || e);
    return res.status(500).json({ success: false, message: 'failed to ensure primary admin' });
  }
});


export default router;
