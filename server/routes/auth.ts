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

import express from 'express';
import { z } from 'zod';
import { login, register, impersonateUser, authenticateToken } from '../auth';
import { requireRole } from '../rbac';

/**
 * UserRole Enum - Local definition for route validation
 * 
 * Defines the 6 user roles in the RBAC system:
 * - WEBSITE_ADMIN: Platform owner with full system access
 * - CORP_OWNER: Corporate account owner/manager
 * - CORP_AGENT: Licensed agent under a corporate organization
 * - INDIV_AGENT: Licensed independent agent (no corporate affiliation)
 * - SELLER: Individual customer selling property
 * - BUYER: Individual customer looking to buy property
 * 
 * Used in: Request validation, role-based access control
 * Pages affected: All pages with role-based access
 */
enum UserRole {
  WEBSITE_ADMIN = 'WEBSITE_ADMIN',
  CORP_OWNER = 'CORP_OWNER',
  CORP_AGENT = 'CORP_AGENT',
  INDIV_AGENT = 'INDIV_AGENT',
  SELLER = 'SELLER',
  BUYER = 'BUYER'
}

const router = express.Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  roles: z.array(z.nativeEnum(UserRole)).min(1),
  organizationId: z.string().optional()
});

const impersonateSchema = z.object({
  targetUserId: z.string()
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const result = await login(email, password);
    
    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }
    
    res.json({
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
    
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
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
