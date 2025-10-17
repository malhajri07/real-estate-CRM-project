// @ts-nocheck
/**
 * apps/api/routes/simple-auth.ts - Simple Authentication Routes
 * 
 * This file provides basic authentication endpoints that work with the current
 * database setup. It's a simplified version of the auth system to get the
 * website working.
 */

import { Router } from "express";
import { prisma } from "../prismaClient";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Simple in-memory rate limiting for login attempts (per IP)
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const LOGIN_MAX_ATTEMPTS = 20;
const loginAttempts = new Map<string, { count: number; first: number }>();

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

function validateUsername(u: string): boolean {
  // allow a-z, 0-9, underscore, dot; 3-32 chars
  return /^[a-z0-9_.]{3,32}$/.test(u);
}

/**
 * POST /api/auth/login - User login (username-only)
 */
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body || {};
    const normalized = normalizeUsername(username);
    if (!normalized || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Rate limiting per IP
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    if (tooManyAttempts(ip)) {
      return res.status(429).json({ success: false, message: 'Too many login attempts. Please try again later.' });
    }

    // Username-only authentication
    const user = await prisma.users.findUnique({ where: { username: normalized } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account active
    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false, 
        message: 'حسابك في انتظار الموافقة من الإدارة. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        organizationId: user.organizationId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Audit log: successful login
    try {
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '';
      const ua = req.headers['user-agent'] || '';
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'USER',
          entityId: user.id,
          afterJson: JSON.stringify({ username: user.username }),
          ipAddress: Array.isArray(ip) ? ip[0] : ip,
          userAgent: Array.isArray(ua) ? ua[0] : ua,
        }
      });
    } catch (e) {
      console.warn('audit log (login) failed');
    }

    // Parse roles from string to array
    let parsedRoles = [];
    try {
      parsedRoles = JSON.parse(user.roles);
    } catch (e) {
      parsedRoles = [user.roles]; // Fallback to single role
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: parsedRoles,
      organizationId: user.organizationId,
    };

    req.session.user = sessionUser; // Store the active user in the session to allow parallel user sessions
    req.session.authToken = token; // Keep the JWT handy for session-authenticated API calls

    res.json({
      success: true,
      token,
      user: sessionUser
    });
  } catch (error) {
    console.error('Login error:', error);
    // Provide a consistent error shape
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me - Get current user
 */
router.get('/me', async (req, res) => {
  try {
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const token = headerToken || req.session?.authToken;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Parse roles from string to array
    let parsedRoles = [];
    try {
      parsedRoles = JSON.parse(user.roles);
    } catch (e) {
      parsedRoles = [user.roles]; // Fallback to single role
    }

    const sessionUser = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: parsedRoles,
        organizationId: user.organizationId
      }
    };

    req.session.user = sessionUser.user; // Refresh session data on token validation so the session stays authoritative
    req.session.authToken = token;

    res.json(sessionUser);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

/**
 * GET /api/auth/ping - Health check for auth routes
 */
router.get('/ping', (_req, res) => {
  res.json({ success: true, message: 'auth ok' });
});

/**
 * POST /api/auth/register - User registration (username required, email optional)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, roles, organizationId } = req.body || {};

    const normalized = normalizeUsername(username);
    if (!normalized || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (!validateUsername(normalized)) {
      return res.status(400).json({ error: 'Invalid username. Use 3-32 chars: a-z, 0-9, underscore, dot.' });
    }

    // Check if username already exists
    const existingUsername = await prisma.users.findUnique({
      where: { username: normalized }
    });

    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Optionally also check email if provided
    if (email) {
      const existingEmail = await prisma.users.findUnique({
        where: { email }
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Determine if user needs approval
    const needsApproval = roles && (roles.includes('AGENT') || roles.includes('CORP_OWNER'));
    
    // Create user
    const user = await prisma.users.create({
      data: {
        username: normalized,
        email,
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        roles: roles || 'BUYER',
        organizationId: organizationId || null,
        isActive: !needsApproval // Set to false if needs approval
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        organizationId: user.organizationId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Parse roles for client consistency
    let parsedRoles: string[] = [];
    try {
      parsedRoles = JSON.parse(user.roles);
    } catch {
      parsedRoles = [user.roles];
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: parsedRoles,
      organizationId: user.organizationId
    };

    req.session.user = {
      ...sessionUser,
      name: `${user.firstName} ${user.lastName}`,
    }; // Capture the new account in the session immediately for instant access on other tabs
    req.session.authToken = token;

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: parsedRoles,
        organizationId: user.organizationId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout - Destroy the current session
 */
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      // We intentionally respond after destroying to confirm the session is gone
      res.json({ success: true });
    });
  } else {
    res.json({ success: true });
  }
});

export default router;
 
// Dev-only helper to ensure a primary admin exists
router.post('/ensure-primary-admin', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Not allowed in production' });
    }
    const token = req.headers['x-setup-token'] as string | undefined;
    const expected = process.env.ADMIN_SETUP_TOKEN || 'dev';
    if (!token || token !== expected) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { username = 'admin', password = 'admin123', email = 'admin@aqaraty.com' } = req.body || {};
    const normalized = (username || '').trim().toLowerCase();
    if (!normalized || !password) {
      return res.status(400).json({ success: false, message: 'username and password required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
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
        },
      });
      return res.json({ success: true, created: true, user: { id: user.id, username: user.username } });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { passwordHash, roles, isActive: true, email: email || user.email },
    });
    return res.json({ success: true, created: false, user: { id: user.id, username: user.username } });
  } catch (e: any) {
    console.error('ensure-primary-admin error:', e?.message || e);
    return res.status(500).json({ success: false, message: 'failed to ensure primary admin' });
  }
});
