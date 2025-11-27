/**
 * routes/rbac-admin.ts - RBAC Admin API Routes
 * 
 * Location: apps/api/ → Routes/ → rbac-admin.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for RBAC (Role-Based Access Control) administration. Handles:
 * - User management (CRUD operations)
 * - Organization management
 * - Role and permission management
 * - System statistics and activities
 * 
 * API Endpoints:
 * - GET /api/rbac-admin/stats - System statistics
 * - GET /api/rbac-admin/activities - Recent activities
 * - GET /api/rbac-admin/users - User management
 * - POST /api/rbac-admin/users - Create user
 * - PUT /api/rbac-admin/users/:id - Update user
 * - DELETE /api/rbac-admin/users/:id - Delete user
 * - GET /api/rbac-admin/organizations - Organizations
 * - GET /api/rbac-admin/roles - Roles and permissions
 * 
 * Related Files:
 * - apps/api/rbac.ts - RBAC system
 * - apps/web/src/pages/admin/user-management.tsx - User management UI
 * - apps/web/src/pages/admin/role-management.tsx - Role management UI
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prismaClient';
import { UserRole, normalizeRoleKeys } from '@shared/rbac';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as getJwtSecret } from '../config/env';

const router = Router();
const JWT_SECRET = getJwtSecret();

// Middleware to verify admin access
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const session = req.session as any;
    const sessionToken = session?.authToken;
    const sessionUser = session?.user;
    
    if (!headerToken && !sessionToken && !sessionUser) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const loadUser = async (userId: string) =>
      prisma.users.findUnique({
        where: { id: userId }
      });

    const ensureAdmin = (rolesValue: unknown) =>
      normalizeRoleKeys(rolesValue).includes(UserRole.WEBSITE_ADMIN);

    if (headerToken) {
      const decoded = jwt.verify(headerToken, JWT_SECRET) as any;
      const user = await loadUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      const parsedRoles = JSON.parse(user.roles);
      const userRoles = normalizeRoleKeys(parsedRoles);
      if (!ensureAdmin(userRoles)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      req.user = { 
        ...user, 
        roles: userRoles,
        name: user.firstName + ' ' + user.lastName,
        userLevel: 1,
        tenantId: user.organizationId || user.id
      };
      return next();
    }

    if (sessionToken) {
      try {
        const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
        const user = await loadUser(decoded.userId);
        if (!user) {
          return res.status(401).json({ success: false, message: 'User not found' });
        }
        const parsedRoles = JSON.parse(user.roles);
        const userRoles = normalizeRoleKeys(parsedRoles);
        if (!ensureAdmin(userRoles)) {
          return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        req.user = { 
        ...user, 
        roles: userRoles,
        name: user.firstName + ' ' + user.lastName,
        userLevel: 1,
        tenantId: user.organizationId || user.id
      };
        return next();
      } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }

    if (sessionUser) {
      // sessionUser.roles is already an array, no need to parse
      const userRoles = normalizeRoleKeys(sessionUser.roles);
      if (!ensureAdmin(userRoles)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      req.user = sessionUser;
      return next();
    }

    return res.status(401).json({ success: false, message: 'No valid authentication' });
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// Apply authentication to all routes
router.use(requireAdmin);

// Debug route to check session
router.get('/debug-session', (req, res) => {
  res.json({
    success: true,
    session: !!req.session,
    sessionUser: req.session?.user,
    sessionAuthToken: req.session?.authToken,
    reqUser: req.user,
    headers: req.headers
  });
});

/**
 * GET /api/rbac-admin/dashboard - Aggregated analytics for overview
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Simple dashboard with basic data
    const userCount = await prisma.users.count();
    const propertyCount = await prisma.properties.count();
    const leadCount = await prisma.leads.count();
    const claimCount = await prisma.claims.count();
    const orgCount = await prisma.organizations.count();

    res.json({
      success: true,
      metrics: {
        currency: 'SAR',
        leads: { today: leadCount, last7Days: leadCount, last30Days: leadCount },
        listings: { today: propertyCount, last7Days: propertyCount, last30Days: propertyCount },
        appointments: { today: 0, last7Days: 0, last30Days: 0 },
        dealsWon: { today: claimCount, last7Days: claimCount, last30Days: claimCount },
        gmv: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' },
        invoiceTotal: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' },
        cashCollected: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' }
      },
      topAgents: [],
      recentTickets: []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/users - Get all users for admin management
 */
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      include: {
        organization: true,
        agent_profiles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      users: users.map(user => {
        // Parse roles from JSON string to array
        let parsedRoles = [];
        try {
          parsedRoles = JSON.parse(user.roles);
        } catch (e) {
          parsedRoles = [user.roles];
        }
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          phone: user.phone,
          roles: parsedRoles,
          isActive: user.isActive,
          organizationId: user.organizationId,
          organization: user.organization,
          agent_profiles: user.agent_profiles,
          approvalStatus: null, // Add default approval status
          lastLoginAt: null, // Add default last login
          licenseNumber: null, // Add default license number
          memberships: [], // Add default memberships
          primaryMembership: null, // Add default primary membership
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      })
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/users/all-users - Alternative endpoint for all users
 */
router.get('/users/all-users', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      include: {
        organization: true,
        agent_profiles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      users: users.map(user => {
        // Parse roles from JSON string to array
        let parsedRoles = [];
        try {
          parsedRoles = JSON.parse(user.roles);
        } catch (e) {
          parsedRoles = [user.roles];
        }
        
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          phone: user.phone,
          roles: parsedRoles,
          isActive: user.isActive,
          organizationId: user.organizationId,
          organization: user.organization,
          agent_profiles: user.agent_profiles,
          approvalStatus: null, // Add default approval status
          lastLoginAt: null, // Add default last login
          licenseNumber: null, // Add default license number
          memberships: [], // Add default memberships
          primaryMembership: null, // Add default primary membership
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      })
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
