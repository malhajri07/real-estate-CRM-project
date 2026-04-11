/**
 * routes/auth.ts — Authentication & user-profile API routes.
 *
 * Mounted at `/api/auth` in `apps/api/index.ts`.
 *
 * Endpoints:
 * | Method | Path                  | Auth? | Purpose                                    |
 * |--------|-----------------------|-------|--------------------------------------------|
 * | POST   | /login                | No    | Admin login (username/email + password)     |
 * | POST   | /send-otp             | No    | Send 4-digit OTP to Saudi mobile            |
 * | POST   | /verify-otp           | No    | Verify OTP → JWT (primary agent login)      |
 * | POST   | /register             | No    | Create account + auto-login                 |
 * | GET    | /me                   | Yes   | Return `req.user` (lightweight)             |
 * | GET    | /user                 | Yes   | Full user + org + agent_profile from DB     |
 * | POST   | /impersonate          | Admin | Generate token for another user             |
 * | PUT    | /user                 | Yes   | Update own profile fields                   |
 * | PUT    | /agent-profile        | Yes   | Update agent FAL license + professional     |
 * | PUT    | /password             | Yes   | Change own password                         |
 * | PUT    | /preferences          | Yes   | Save notification prefs in user.metadata    |
 * | GET    | /preferences          | Yes   | Load notification prefs                     |
 * | POST   | /logout               | Yes   | Client-side token removal                   |
 * | POST   | /ensure-primary-admin | Dev   | Idempotent admin seed (setup-token gated)   |
 *
 * Consumer: frontend `useAuth` hook in `apps/web/src/hooks/use-auth.ts` and the
 * settings page at `apps/web/src/pages/platform/settings/`.
 *
 * @see [[Architecture/Authentication & RBAC]]
 * @see [[Features/REGA Compliance]] for FAL license fields
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

/**
 * @route POST /api/auth/login
 * @auth  Not required
 * @param req.body.identifier - Username or email. Source: admin login form.
 * @param req.body.password - Plaintext password.
 * @returns `{ success, token, user }`.
 *   Consumer: frontend `useAuth.login()`, stored in localStorage.
 * @sideEffect Sets express-session (`req.session.user`, `req.session.authToken`).
 */
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

    // Record login event for activity log (E13)
    if (result.user?.id) {
      prisma.login_history.create({
        data: { userId: result.user.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] },
      }).catch(() => {});
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

// ── OTP-based Login Flow ─────────────────────────────────────────────────────

/** In-memory OTP store keyed by normalized phone. Dev-only — production uses SMS. */
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

/**
 * @route POST /api/auth/send-otp
 * @auth  Not required
 * @param req.body.phone - Saudi mobile number (`05XXXXXXXX` or `+9665XXXXXXXX`).
 *   Source: OTP login form in `apps/web/src/pages/platform/auth/login.tsx`.
 * @returns `{ success, message, otp? }` — OTP exposed in response only in dev mode.
 *   Consumer: frontend OTP form auto-fills in dev mode for testing.
 * @sideEffect Stores the 4-digit OTP in `otpStore` (expires after 5 min).
 *   In production: would send SMS via Unifonic / Twilio.
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = z.object({ phone: z.string().min(10).max(15) }).parse(req.body);

    // Normalize: remove +966, spaces, dashes
    const normalized = phone.replace(/[\s\-\+]/g, '').replace(/^966/, '0');

    // Check if user exists with this phone
    const user = await prisma.users.findFirst({
      where: { phone: normalized },
      select: { id: true, phone: true, firstName: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "رقم الجوال غير مسجّل في النظام" });
    }

    // Generate 4-digit OTP
    const code = String(Math.floor(1000 + Math.random() * 9000));
    otpStore.set(normalized, { code, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 });

    // In production: send SMS via Twilio/Unifonic/etc.
    // For dev: return the OTP in the response so the frontend can show it
    logger.info({ phone: normalized }, `OTP generated: ${code}`);

    res.json({
      success: true,
      message: "تم إرسال رمز التحقق",
      // DEV ONLY: expose OTP for testing — remove in production
      ...(process.env.NODE_ENV !== "production" && { otp: code }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "رقم جوال غير صالح" });
    }
    logger.error({ err: error }, 'Send OTP Error');
    res.status(500).json({ success: false, message: "فشل إرسال رمز التحقق" });
  }
});

/**
 * @route POST /api/auth/verify-otp
 * @auth  Not required
 * @param req.body.phone - Same normalized phone used in send-otp.
 * @param req.body.otp - 4-digit code. Source: OTP input in the login form.
 * @returns `{ success, token, user }` — JWT for the matched user.
 *   Consumer: frontend stores token and navigates to `/home/platform`.
 * @throws 429 after 5 failed attempts per phone.
 * @sideEffect Deletes the OTP from the store; sets express-session.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = z.object({
      phone: z.string().min(10).max(15),
      otp: z.string().length(4),
    }).parse(req.body);

    const normalized = phone.replace(/[\s\-\+]/g, '').replace(/^966/, '0');
    const stored = otpStore.get(normalized);

    if (!stored) {
      return res.status(400).json({ success: false, message: "لم يتم إرسال رمز تحقق لهذا الرقم" });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalized);
      return res.status(400).json({ success: false, message: "انتهت صلاحية رمز التحقق. أعد الإرسال." });
    }

    stored.attempts += 1;
    if (stored.attempts > 5) {
      otpStore.delete(normalized);
      return res.status(429).json({ success: false, message: "تم تجاوز عدد المحاولات. أعد إرسال الرمز." });
    }

    if (stored.code !== otp) {
      return res.status(400).json({ success: false, message: "رمز التحقق غير صحيح" });
    }

    // OTP valid — find user and generate JWT
    otpStore.delete(normalized);

    const user = await prisma.users.findFirst({
      where: { phone: normalized },
      include: { organization: true, agent_profiles: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "الحساب غير نشط" });
    }

    const token = AuthService.generateToken({
      id: user.id,
      email: user.email ?? null,
      username: user.username ?? null,
      roles: user.roles,
      organizationId: user.organizationId || undefined,
    });

    if (req.session) {
      req.session.user = user as any;
      req.session.authToken = token;
    }

    // Record login event for activity log (E13)
    prisma.login_history.create({
      data: { userId: user.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] },
    }).catch(() => {});

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        roles: typeof user.roles === "string" ? JSON.parse(user.roles) : user.roles,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "بيانات غير صالحة" });
    }
    logger.error({ err: error }, 'Verify OTP Error');
    res.status(500).json({ success: false, message: "فشل التحقق" });
  }
});

// POST /api/auth/register
/** POST /register */
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
/** GET /me */
router.get('/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// GET /api/auth/user
// Keeping this signature as it was in original file (returns user directly)
/** GET /user */
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
/** POST /impersonate */
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
/** PUT /user */
router.put('/user', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      jobTitle: z.string().optional(),
      department: z.string().optional(),
      whatsapp: z.string().optional(),
      timezone: z.string().optional(),
    });
    const data = schema.parse(req.body);

    // Store whatsapp in metadata
    let metaUpdate: Record<string, unknown> | undefined;
    if (data.whatsapp !== undefined) {
      const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
      const existing = (user?.metadata as Record<string, unknown>) || {};
      metaUpdate = { ...existing, whatsapp: data.whatsapp || null };
    }

    const updated = await prisma.users.update({
      where: { id: req.user!.id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle || null }),
        ...(data.department !== undefined && { department: data.department || null }),
        ...(data.timezone !== undefined && { timezone: data.timezone || null }),
        ...(metaUpdate && { metadata: metaUpdate as any }),
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

// PUT /api/auth/agent-profile — update agent professional profile + FAL license
/** PUT /agent-profile */
router.put('/agent-profile', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      bio: z.string().max(1000).optional(),
      specialties: z.string().optional(),
      territories: z.string().optional(),
      experience: z.coerce.number().int().min(0).max(60).optional(),
      falLicenseNumber: z.string().optional(),
      falLicenseType: z.enum(["BROKERAGE_MARKETING", "PROPERTY_MANAGEMENT", "FACILITY_MANAGEMENT", "AUCTION", "CONSULTING", "ADVERTISING"]).optional(),
      falIssuedAt: z.string().datetime().optional().or(z.literal("")),
      falExpiresAt: z.string().datetime().optional().or(z.literal("")),
      nationalIdNumber: z.string().optional(),
      sreiCertified: z.boolean().optional(),
      workingHours: z.string().optional(),
      iban: z.string().optional(),
      bankName: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const existing = await prisma.agent_profiles.findUnique({ where: { userId: req.user!.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "لا يوجد ملف وسيط مرتبط بحسابك" });
    }

    // Store workingHours, iban, bankName in user metadata
    let metaUpdate: Record<string, unknown> | undefined;
    if (data.workingHours !== undefined || data.iban !== undefined || data.bankName !== undefined) {
      const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
      const existingMeta = (user?.metadata as Record<string, unknown>) || {};
      metaUpdate = {
        ...existingMeta,
        ...(data.workingHours !== undefined && { workingHours: data.workingHours }),
        ...(data.iban !== undefined && { iban: data.iban }),
        ...(data.bankName !== undefined && { bankName: data.bankName }),
      };
      await prisma.users.update({ where: { id: req.user!.id }, data: { metadata: metaUpdate as any } });
    }

    const updated = await prisma.agent_profiles.update({
      where: { userId: req.user!.id },
      data: {
        ...(data.bio !== undefined && { bio: data.bio || null }),
        ...(data.specialties !== undefined && { specialties: data.specialties || "" }),
        ...(data.territories !== undefined && { territories: data.territories || "" }),
        ...(data.experience !== undefined && { experience: data.experience }),
        ...(data.falLicenseNumber !== undefined && { falLicenseNumber: data.falLicenseNumber || null }),
        ...(data.falLicenseType !== undefined && { falLicenseType: data.falLicenseType }),
        ...(data.falIssuedAt !== undefined && { falIssuedAt: data.falIssuedAt ? new Date(data.falIssuedAt) : null }),
        ...(data.falExpiresAt !== undefined && { falExpiresAt: data.falExpiresAt ? new Date(data.falExpiresAt) : null }),
        ...(data.nationalIdNumber !== undefined && { nationalIdNumber: data.nationalIdNumber || null }),
        ...(data.sreiCertified !== undefined && { sreiCertified: data.sreiCertified }),
      },
    });

    res.json({ success: true, profile: updated });
  } catch (error) {
    const locale = (req as any).locale || 'ar';
    if (error instanceof z.ZodError) {
      return res.status(400).json(getErrorResponse('VALIDATION_ERROR', locale, error.errors));
    }
    logger.error({ err: error }, 'Agent profile update error');
    res.status(500).json(getErrorResponse('UPDATE_FAILED', locale));
  }
});

// PUT /api/auth/password — change current user's password
/** PUT /password */
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
/** PUT /preferences */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const schema = z.object({
      newLeads: z.boolean().optional(),
      taskUpdates: z.boolean().optional(),
      newDeals: z.boolean().optional(),
      brokerRequests: z.boolean().optional(),
      agreementSigned: z.boolean().optional(),
      appointmentReminders: z.boolean().optional(),
      propertyInquiries: z.boolean().optional(),
      listingExpiry: z.boolean().optional(),
      commissionPayouts: z.boolean().optional(),
    });
    const prefs = schema.parse(req.body);

    const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
    const existingMeta = (user?.metadata as Record<string, unknown>) || {};
    const existingPrefs = (existingMeta.notificationPreferences as Record<string, boolean>) || {};
    const mergedPrefs = { ...existingPrefs, ...prefs };
    const updatedMeta = { ...existingMeta, notificationPreferences: mergedPrefs };

    await prisma.users.update({
      where: { id: req.user!.id },
      data: { metadata: updatedMeta },
    });

    res.json({ success: true, preferences: mergedPrefs });
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
/** GET /preferences */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user!.id } });
    const meta = (user?.metadata as Record<string, unknown>) || {};
    const prefs = {
      newLeads: true,
      taskUpdates: true,
      newDeals: true,
      brokerRequests: true,
      agreementSigned: true,
      appointmentReminders: true,
      propertyInquiries: true,
      listingExpiry: true,
      commissionPayouts: true,
      ...((meta.notificationPreferences as Record<string, boolean>) || {}),
    };
    res.json({ success: true, preferences: prefs });
  } catch (error) {
    const locale = (req as any).locale || 'ar';
    logger.error({ err: error }, 'Preferences fetch error');
    res.status(500).json(getErrorResponse('FETCH_FAILED', locale));
  }
});

/**
 * @route GET /api/auth/login-history
 * @auth  Required
 * @returns Last 10 login events with device + IP.
 *   Consumer: "Activity Log" section in settings page (E13).
 */
router.get('/login-history', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.login_history.findMany({
      where: { userId: req.user!.id },
      orderBy: { loginAt: 'desc' },
      take: 10,
    });
    res.json(history.map((h) => ({
      id: h.id,
      loginAt: h.loginAt,
      ipAddress: h.ipAddress,
      device: parseUserAgent(h.userAgent),
    })));
  } catch (error) {
    res.json([]);
  }
});

/** Simple user-agent parser for display in activity log (E13). */
function parseUserAgent(ua: string | null): string {
  if (!ua) return "غير معروف";
  if (ua.includes("Mobile")) return "جوال";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "متصفح";
}

// POST /api/auth/logout
/** POST /logout */
router.post('/logout', authenticateToken, async (req, res) => {
  // Client-side token removal mostly
  const locale = (req as any).locale || 'ar';
  res.json({ success: true, message: (req as any).t('LOGOUT_SUCCESS') || 'Logged out successfully' });
});

// Dev-only helper to ensure a primary admin exists
/** POST /ensure-primary-admin */
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
