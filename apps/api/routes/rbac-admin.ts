/**
 * routes/rbac-admin.ts - RBAC Admin API Routes
 * Refactored to use RbacService and rbac.middleware.ts
 * 
 * Location: apps/api/ → Routes/ → rbac-admin.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 */

import { Router } from 'express';
import { RbacService } from '../src/services/rbac.service';
import { requireAdmin } from '../src/middleware/rbac.middleware';

const router = Router();
const rbacService = new RbacService();

// Apply authentication to all routes
router.use(requireAdmin);

// Debug route to check session
router.get('/debug-session', (req, res) => {
  res.json({
    success: true,
    session: !!req.session,
    sessionUser: req.session?.user,
    sessionAuthToken: req.session?.authToken,
    reqUser: (req as any).user,
    headers: req.headers
  });
});

/**
 * GET /api/rbac-admin/activities - Audit logs
 */
router.get('/activities', async (req, res) => {
  try {
    const formattedLogs = await rbacService.getActivities();
    res.json(formattedLogs);
  } catch (error) {
    console.error('Activities fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/dashboard - Aggregated analytics for overview
 */
router.get('/dashboard', async (req, res) => {
  console.log('[RBAC-ADMIN] Dashboard route hit');
  try {
    // Default 30 days
    const result = await rbacService.getDashboardMetrics(30);
    res.json({
      success: true,
      ...result,
      // empty recent tickets placeholder as service implementation handled it differently
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
 * GET /api/rbac-admin/users - Get all users
 */
router.get(['/users', '/users/all-users'], async (req, res) => {
  try {
    const users = await rbacService.getAllUsers();
    res.json({
      success: true,
      users,
      pagination: {
        page: 1,
        limit: users.length,
        total: users.length,
        pages: 1
      }
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
 * GET /api/rbac-admin/roles - Get all roles
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await rbacService.getRoles();
    res.json({ success: true, roles });
  } catch (error) {
    console.error('Roles fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/organizations - List all organizations
 */
router.get('/organizations', async (req, res) => {
  try {
    const organizations = await rbacService.getAllOrganizations();
    res.json({ success: true, organizations });
  } catch (error) {
    console.error('Organizations fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rbac-admin/organizations - Create new organization
 */
router.post('/organizations', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Organization name is required' });
    }
    const newOrg = await rbacService.createOrganization(req.body);
    res.json({ success: true, organization: newOrg });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ success: false, message: 'Failed to create organization' });
  }
});

/**
 * DELETE /api/rbac-admin/organizations/:id - Delete organization
 */
router.delete('/organizations/:id', async (req, res) => {
  try {
    await rbacService.deleteOrganization(req.params.id);
    res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete organization' });
  }
});

/**
 * POST /api/rbac-admin/users - Create new user
 */
router.post('/users', async (req, res) => {
  try {
    const { username, password, firstName, lastName } = req.body;
    if (!username || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // In service we handle creation
    const user = await rbacService.createUser(req.body, (req as any).user?.id);
    res.json({ success: true, user });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create user'
    });
  }
});

export default router;
