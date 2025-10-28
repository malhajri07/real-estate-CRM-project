import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from './prismaClient';
import { UserRole, normalizeRoleKeys } from '@shared/rbac';
import jwt from 'jsonwebtoken';
import { JWT_SECRET as getJwtSecret } from './config/env';

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
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        userLevel: 1,
        tenantId: user.organizationId || user.id,
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
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          userLevel: 1,
          tenantId: user.organizationId || user.id,
        };
        return next();
      } catch (error) {
        console.error('Admin auth error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }

    if (sessionUser) {
      const parsedRoles = JSON.parse(sessionUser.roles);
      const userRoles = normalizeRoleKeys(parsedRoles);
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
    // Get basic counts
    const userCount = await prisma.users.count();
    const propertyCount = await prisma.properties.count();
    const leadCount = await prisma.leads.count();
    const claimCount = await prisma.claims.count();

    return res.json({
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

export default router;
