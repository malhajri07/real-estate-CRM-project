/**
 * apps/api/routes/simple-auth.ts - Simple Authentication Routes
 *
 * This file provides basic authentication endpoints that work with the current
 * database setup. It's a simplified version of the auth system to get the
 * website working.
 */

import { Router, type Request, type Response } from "express";
import { prisma } from "../prismaClient";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { JWT_SECRET as getJwtSecret } from "../config/env";
import {
  normalizeRoleKeys,
  parseStoredRoles,
  serializeRoles,
  UserRole,
} from "@shared/rbac";
import { authLoginSchema, authRegisterSchema } from "@shared/types";
import { z } from "zod";
import type { Session, SessionData } from "express-session";

const router = Router();

// JWT secret
const JWT_SECRET = getJwtSecret();

// Simple in-memory rate limiting for login attempts (per IP)
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const LOGIN_MAX_ATTEMPTS = 20;
const loginAttempts = new Map<string, { count: number; first: number }>();

type SessionUser = {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: UserRole[];
  organizationId: string | null;
  name?: string;
};

type AuthSession = Session & Partial<SessionData> & {
  user?: SessionUser;
  authToken?: string;
};

interface AuthTokenPayload extends jwt.JwtPayload {
  userId: string;
  email: string | null;
  username?: string | null;
  roles: string;
  organizationId?: string | null;
}

type EmptyRecord = Record<string, never>;

type LoginResponse =
  | { success: true; token: string; user: SessionUser }
  | { success: false; message: string };

type MeResponse = { success: true; user: SessionUser } | { success: false; message: string };

type RegisterResponse =
  | { success: true; token: string; user: SessionUser }
  | { error: string }
  | { success: false; message: string };

type LogoutResponse = { success: boolean };

type EnsurePrimaryAdminResponse =
  | { success: true; created: boolean; user: { id: string; username: string } }
  | { success: false; message: string };

type DbUser = NonNullable<Awaited<ReturnType<typeof prisma.users.findUnique>>>;

const ensureSession = (req: Request): AuthSession | undefined => req.session as AuthSession | undefined;

const formatZodError = (error: z.ZodError): string => {
  const messages = error.issues.map((issue) => issue.message).filter(Boolean);
  return messages.length ? Array.from(new Set(messages)).join(", ") : "Invalid request body";
};

const buildSessionUser = (user: DbUser): SessionUser => {
  const roles = parseStoredRoles(user.roles);
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    roles,
    organizationId: user.organizationId ?? null,
    name: fullName.length ? fullName : undefined,
  };
};

const storeSessionUser = (session: AuthSession | undefined, user: SessionUser, token: string): void => {
  if (!session) return;
  session.user = user;
  session.authToken = token;
};

const ensurePrimaryAdminSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  email: z.string().email().optional(),
});

const isAuthTokenPayload = (value: unknown): value is AuthTokenPayload => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<AuthTokenPayload>;
  return typeof payload.userId === "string";
};

const extractHeaderValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
};

const getRequestIp = (req: Request): string => {
  const forwarded = extractHeaderValue(req.headers["x-forwarded-for"]);
  return forwarded || req.ip || "unknown";
};

function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) {
    loginAttempts.set(ip, { count: 1, first: now });
    return false;
  }
  if (now - entry.first > LOGIN_WINDOW_MS) {
    // reset window
    loginAttempts.set(ip, { count: 1, first: now });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

/** Utility: normalize username to lowercase trimmed */
function normalizeUsername(u?: string) {
  return (u || "").trim().toLowerCase();
}

/**
 * POST /api/auth/login - User login (username-only)
 */
router.post(
  '/login',
  async (req: Request<EmptyRecord, LoginResponse, unknown>, res: Response<LoginResponse>) => {
    try {
      const parsed = authLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
      }

      const { username, password } = parsed.data;

      const ip = getRequestIp(req);
      if (tooManyAttempts(ip)) {
        return res
          .status(429)
          .json({ success: false, message: 'Too many login attempts. Please try again later.' });
      }

      const user = await prisma.users.findUnique({ where: { username } });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message:
            'حسابك في انتظار الموافقة من الإدارة. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.',
        });
      }

      const tokenPayload: AuthTokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        organizationId: user.organizationId ?? null,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

      await prisma.users.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      try {
        await prisma.audit_logs.create({
          data: {
            id: randomUUID(),
            userId: user.id,
            action: 'LOGIN',
            entity: 'USER',
            entityId: user.id,
            afterJson: JSON.stringify({ username: user.username }),
            ipAddress: ip,
            userAgent: extractHeaderValue(req.headers['user-agent']),
          },
        });
      } catch (auditError) {
        console.warn('audit log (login) failed', auditError);
      }

      const sessionUser = buildSessionUser(user as DbUser);
      const session = ensureSession(req);
      storeSessionUser(session, sessionUser, token);

      return res.json({
        success: true,
        token,
        user: sessionUser,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

/**
 * GET /api/auth/me - Get current user
 */
router.get(
  '/me',
  async (req: Request<EmptyRecord, MeResponse>, res: Response<MeResponse>) => {
    try {
      const headerToken = req.headers.authorization?.replace('Bearer ', '');
      const session = ensureSession(req);
      const token = headerToken || session?.authToken;

      if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      if (!isAuthTokenPayload(decoded)) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      const sessionUser = buildSessionUser(user as DbUser);
      storeSessionUser(session, sessionUser, token);

      return res.json({ success: true, user: sessionUser });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  },
);

/**
 * GET /api/auth/ping - Health check for auth routes
 */
router.get('/ping', (_req, res) => {
  res.json({ success: true, message: 'auth ok' });
});

/**
 * POST /api/auth/register - User registration (username required, email optional)
 */
router.post(
  '/register',
  async (req: Request<EmptyRecord, RegisterResponse, unknown>, res: Response<RegisterResponse>) => {
    try {
      const parsed = authRegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }

      const { username, email, password, firstName, lastName, phone, roles, organizationId } = parsed.data;

      const existingUsername = await prisma.users.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      if (email) {
        const existingEmail = await prisma.users.findUnique({
          where: { email },
        });
        if (existingEmail) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const rawRoles = Array.isArray(roles)
        ? roles
        : typeof roles === 'string' && roles.length > 0
          ? [roles]
          : [];
      const normalizedInput = rawRoles.map((role) => role.trim().toUpperCase());
      const normalizedRoles = normalizeRoleKeys(rawRoles.length ? rawRoles : undefined);
      const storedRoles = serializeRoles(normalizedRoles);

      const approvalRoles = new Set<string>(['AGENT', UserRole.CORP_OWNER, UserRole.CORP_AGENT, UserRole.INDIV_AGENT]);
      const needsApproval = normalizedInput.some((role) => approvalRoles.has(role));

      const userId = randomUUID();

      const user = await prisma.users.create({
        data: {
          id: userId,
          username,
          email,
          passwordHash,
          firstName,
          lastName,
          phone: phone ?? null,
          roles: storedRoles,
          organizationId: organizationId ?? null,
          isActive: !needsApproval,
        },
      });

      const tokenPayload: AuthTokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        organizationId: user.organizationId ?? null,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

      const sessionUser = buildSessionUser(user as DbUser);
      const session = ensureSession(req);
      storeSessionUser(session, sessionUser, token);

      return res.status(201).json({
        success: true,
        token,
        user: sessionUser,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
);

/**
 * POST /api/auth/logout - Destroy the current session
 */
router.post(
  '/logout',
  (req: Request<EmptyRecord, LogoutResponse>, res: Response<LogoutResponse>) => {
    const session = ensureSession(req);
    if (!session) {
      return res.json({ success: true });
    }

    session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false });
      }

      return res.json({ success: true });
    });
  },
);

export default router;

// Dev-only helper to ensure a primary admin exists
router.post(
  '/ensure-primary-admin',
  async (
    req: Request<EmptyRecord, EnsurePrimaryAdminResponse, unknown>,
    res: Response<EnsurePrimaryAdminResponse>,
  ) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Not allowed in production' });
      }

      const token = extractHeaderValue(req.headers['x-setup-token']);
      const expected = process.env.ADMIN_SETUP_TOKEN || 'dev';
      if (!token || token !== expected) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const parsed = ensurePrimaryAdminSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
      }

      const candidateUsername = parsed.data.username ?? 'admin';
      const normalizedUsername = normalizeUsername(candidateUsername);
      const candidatePassword = parsed.data.password ?? 'admin123';
      const candidateEmail = parsed.data.email ?? 'admin@aqaraty.com';

      if (!normalizedUsername || candidatePassword.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'username and password required' });
      }

      const passwordHash = await bcrypt.hash(candidatePassword, 12);
      const roles = serializeRoles([UserRole.WEBSITE_ADMIN]);

      const existingUser = await prisma.users.findUnique({ where: { username: normalizedUsername } });
      if (!existingUser) {
        const created = await prisma.users.create({
          data: {
            id: randomUUID(),
            username: normalizedUsername,
            email: candidateEmail,
            firstName: 'Primary',
            lastName: 'Admin',
            passwordHash,
            roles,
            isActive: true,
          },
        });
        return res.json({
          success: true,
          created: true,
          user: { id: created.id, username: created.username },
        });
      }

      await prisma.users.update({
        where: { id: existingUser.id },
        data: { passwordHash, roles, isActive: true, email: candidateEmail || existingUser.email },
      });
      return res.json({
        success: true,
        created: false,
        user: { id: existingUser.id, username: existingUser.username },
      });
    } catch (error) {
      console.error('ensure-primary-admin error:', error);
      return res.status(500).json({ success: false, message: 'failed to ensure primary admin' });
    }
  },
);
