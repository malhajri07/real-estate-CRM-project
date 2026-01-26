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

const router = Router();
const authService = new AuthService();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const credentials = authSchemas.login.parse(req.body);
    const identifier = credentials.identifier || credentials.email || credentials.username;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Identifier required' });
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
    res.status(401).json({ success: false, message });
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
    const { storage } = await import('../storage-prisma');
    const user = await storage.getUser(req.user!.id);
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// POST /api/auth/impersonate
router.post('/impersonate', authenticateToken, async (req, res) => {
  try {
    // Enforce admin check inline or via middleware (AuthService also checks, but good to check here too if desired)
    if (!req.user?.roles.includes(UserRole.WEBSITE_ADMIN)) {
      return res.status(403).json({ message: 'Forbidden' });
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
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
