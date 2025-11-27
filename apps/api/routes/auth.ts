/**
 * routes/auth.ts - Authentication API Routes
 * 
 * Location: apps/api/ → Routes/ → auth.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
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
 * API Endpoints:
 * - POST /api/auth/login - User authentication
 * - POST /api/auth/register - User registration
 * - GET /api/auth/me - Get current user info
 * - POST /api/auth/impersonate - Admin user impersonation
 * 
 * Related Files:
 * - apps/api/auth.ts - Authentication utilities
 * - apps/api/authMiddleware.ts - Auth middleware
 * - apps/api/rbac.ts - RBAC system
 * - apps/web/src/pages/rbac-login.tsx - Login page
 * - apps/web/src/components/auth/ - Auth components
 */

import * as express from 'express';
import '../types/express-session';
import { z } from 'zod';
import { login, register, impersonateUser, authenticateToken, UserRole } from '../auth';
import { requireRole } from '../rbac';

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required').optional(),
  email: z.string().email().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1, 'Password is required')
}).refine((data) => Boolean(data.identifier || data.email || data.username), {
  message: 'Email or username is required',
  path: ['identifier']
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roles: z.string().min(1), // Store as string to match database
  organizationId: z.string().optional()
});

const impersonateSchema = z.object({
  targetUserId: z.string()
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  // Wrap everything in a try-catch to ensure errors are caught
  try {
    console.log('=== LOGIN REQUEST START ===');
    console.log('Login request received:', {
      body: { ...req.body, password: req.body.password ? '***' : undefined },
      sessionId: req.sessionID,
      ip: req.ip,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    });
    
    // Validate request body
    let validatedData;
    try {
      validatedData = loginSchema.parse(req.body);
      console.log('Validation passed:', { 
        hasIdentifier: !!validatedData.identifier,
        hasEmail: !!validatedData.email,
        hasUsername: !!validatedData.username,
        hasPassword: !!validatedData.password
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid input',
          errors: validationError.errors 
        });
      }
      throw validationError;
    }
    
    const { identifier, email, username, password } = validatedData;

    const loginIdentifier = (identifier ?? email ?? username ?? '').trim();
    console.log('Login identifier:', loginIdentifier);

    if (!loginIdentifier || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ 
        success: false,
        message: 'Username/email and password are required' 
      });
    }

    // Call login function with error handling
    let result;
    try {
      result = await login(loginIdentifier, password);
      console.log('Login result:', { 
        success: result.success, 
        hasUser: !!result.user, 
        hasToken: !!result.token,
        message: result.message 
      });
    } catch (loginError) {
      console.error('Error in login function:', loginError);
      return res.status(500).json({ 
        success: false,
        message: loginError instanceof Error ? loginError.message : 'Login function failed' 
      });
    }
    
    if (!result.success) {
      console.log('Login failed:', result.message);
      return res.status(401).json({ 
        success: false,
        message: result.message || 'Invalid credentials' 
      });
    }

    // Ensure we have a user and token
    if (!result.user || !result.token) {
      console.error('Login succeeded but missing user or token:', { 
        hasUser: !!result.user, 
        hasToken: !!result.token 
      });
      return res.status(500).json({ 
        success: false,
        message: 'Login succeeded but authentication data is missing' 
      });
    }

    // Save session data (non-blocking - don't fail login if session save fails)
    if (req.session) {
      try {
        req.session.user = result.user;
        req.session.authToken = result.token;
        // Try to save session, but don't wait for it
        req.session.save((err) => {
          if (err) {
            console.error('Session save error (non-critical):', err);
          } else {
            console.log('Session saved successfully');
          }
        });
      } catch (sessionError) {
        console.error('Failed to set session (non-critical):', sessionError);
        // Continue anyway - session might not be critical for login
      }
    }

    console.log('Login successful, sending response');
    console.log('=== LOGIN REQUEST END ===');
    
    // Ensure response is sent properly
    try {
      res.json({
        success: true,
        user: result.user,
        token: result.token
      });
    } catch (responseError) {
      console.error('Error sending response:', responseError);
      // Response might already be sent, but log the error
    }
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Login route error:', error);
    
    // Make sure we haven't already sent a response
    if (res.headersSent) {
      console.error('Response already sent, cannot send error response');
      return;
    }
    
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid input',
        errors: error.errors 
      });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    console.error('=== LOGIN ERROR END ===');
    res.status(500).json({ 
      success: false,
      message: errorMessage 
    });
  }
});


// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    const result = await register(userData);
    
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    if (req.session) {
      req.session.user = result.user;
      req.session.authToken = result.token;
    }

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: error.errors 
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user info' });
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
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. We could implement token blacklisting here
    // if needed for enhanced security.
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

export default router;
