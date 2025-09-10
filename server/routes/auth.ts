import express from 'express';
import { z } from 'zod';
import { login, register, impersonateUser } from '../auth';
import { authenticateToken, requireRole } from '../rbac';
import { UserRole } from '@prisma/client';

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
