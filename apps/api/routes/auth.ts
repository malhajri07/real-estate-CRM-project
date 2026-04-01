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
import { logger } from '../logger';

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
    const locale = (req as any).locale || 'ar';
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', locale, error.errors));
    }
    logger.error({ err: error }, 'Login Error');
    const message = error instanceof Error ? error.message : 'Login failed';
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
    const locale = (req as any).locale || 'ar';
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', locale, error.errors));
    }
    logger.error({ err: error }, 'Registration Error');
    res.status(400).json(getErrorResponse('CREATE_FAILED', locale, { originalError: error instanceof Error ? error.message : 'Registration failed' }));
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

    logger.info({ adminId: req.user.id, targetUserId }, 'Admin impersonated user');

    await prisma.audit_logs.create({
      data: {
        userId: req.user.id,
        action: 'IMPERSONATE',
        entity: 'USER',
        entityId: targetUserId,
        afterJson: JSON.stringify({ adminId: req.user.id, targetUserId }),
        ipAddress: req.ip,
      },
    });

    res.json({ success: true, ...result });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation Error', errors: error.errors });
    }
    logger.error({ err: error }, 'Impersonate Error');
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Impersonation failed' });
  }
});

// PUT /api/auth/user — update current user's profile
router.put('/user', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      jobTitle: z.string().optional(),
      department: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const updated = await prisma.users.update({
      where: { id: req.user!.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle || null }),
        ...(data.department !== undefined && { department: data.department || null }),
      },
    });
    res.json({ success: true, user: updated });
  } catch (error) {
    const locale = (req as any).locale || 'ar';
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', locale, error.errors));
    }
    logger.error({ err: error }, 'Profile update error');
    res.status(500).json(getErrorResponse('UPDATE_FAILED', locale));
  }
});

// PUT /api/auth/password — change current user's password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      const locale = (req as any).locale || 'ar';
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    const passwordHash = await AuthService.hashPassword(newPassword);
    await prisma.users.update({
      where: { id: req.user!.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    const locale = (req as any).locale || 'ar';
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', locale, error.errors));
    }
    logger.error({ err: error }, 'Password change error');
    res.status(500).json(getErrorResponse('UPDATE_FAILED', locale));
  }
});

// PUT /api/auth/preferences — save notification preferences in user metadata
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      newLeads: z.boolean().optional(),
      taskUpdates: z.boolean().optional(),
      newDeals: z.boolean().optional(),
    });
    const prefs = schema.parse(req.body);

    const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
    const existingMeta = (user?.metadata as Record<string, unknown>) || {};
    const updatedMeta = { ...existingMeta, notificationPreferences: prefs };

    await prisma.users.update({
      where: { id: req.user!.id },
      data: { metadata: updatedMeta },
    });

    res.json({ success: true, preferences: prefs });
  } catch (error) {
    const locale = (req as any).locale || 'ar';
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', locale, error.errors));
    }
    logger.error({ err: error }, 'Preferences update error');
    res.status(500).json(getErrorResponse('UPDATE_FAILED', locale));
  }
});

// GET /api/auth/preferences — load notification preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
    const meta = (user?.metadata as Record<string, unknown>) || {};
    const prefs = (meta.notificationPreferences as Record<string, boolean>) || {
      newLeads: true,
      taskUpdates: true,
      newDeals: true,
    };
    res.json({ success: true, preferences: prefs });
  } catch (error) {
    const locale = (req as any).locale || 'ar';
    logger.error({ err: error }, 'Preferences fetch error');
    res.status(500).json(getErrorResponse('FETCH_FAILED', locale));
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
      return res.status(403).json({ message: "This endpoint is disabled in production" });
    }

    // Verify admin setup token is properly configured
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    if (!setupToken || setupToken.length < 32) {
      return res.status(403).json({ message: "Admin setup token not configured or too weak" });
    }

    const token = req.headers['x-setup-token'] as string | undefined;
    if (!token || token !== setupToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { username, password, email } = req.body || {};
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'username, password, and email are required' });
    }
    const normalized = username.trim().toLowerCase();

    // Hash using bcrypt directly or via service
    const passwordHash = await AuthService.hashPassword(password);
    const roles = JSON.stringify(['WEBSITE_ADMIN']);

    let user = await prisma.users.findUnique({ where: { username: normalized } });

    if (!user) {
      user = await prisma.users.create({
        data: {
          username: normalized,
          email,
          firstName: 'Primary',
          lastName: 'Admin',
          passwordHash,
          roles,
          isActive: true,
          updatedAt: new Date(),
        },
      });
      await prisma.audit_logs.create({
        data: {
          userId: user.id,
          action: 'ENSURE_PRIMARY_ADMIN_CREATE',
          entity: 'USER',
          entityId: user.id,
          afterJson: JSON.stringify({ username: normalized }),
          ipAddress: req.ip,
        },
      });
      return res.json({ success: true, created: true, user: { id: user.id, username: user.username } });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: {
        passwordHash,
        roles,
        isActive: true,
        email: email || user.email,
      },
    });
    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: 'ENSURE_PRIMARY_ADMIN_UPDATE',
        entity: 'USER',
        entityId: user.id,
        afterJson: JSON.stringify({ username: normalized }),
        ipAddress: req.ip,
      },
    });
    return res.json({ success: true, created: false, user: { id: user.id, username: user.username } });

  } catch (e: any) {
    logger.error('ensure-primary-admin error:', e?.message || e);
    return res.status(500).json({ success: false, message: 'failed to ensure primary admin' });
  }
});


export default router;
