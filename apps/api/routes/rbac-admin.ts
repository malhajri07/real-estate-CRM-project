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

/**
 * PUT /api/rbac-admin/users/:id - Update user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Explicitly handle password update if present
    if (updates.password && updates.password.trim() === '') {
      delete updates.password;
    }

    const updatedUser = await rbacService.updateUser(id, updates);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user'
    });
  }
});

/**
 * DELETE /api/rbac-admin/users/:id - Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await rbacService.deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete user'
    });
  }
});

/**
 * GET /api/rbac-admin/billing/invoices - Get all invoices (admin only)
 */
router.get('/billing/invoices', async (req, res) => {
  try {
    const { prisma } = await import('../prismaClient');
    const invoices = await prisma.billing_invoices.findMany({
      orderBy: { issueDate: 'desc' },
      include: {
        account: {
          include: {
            organization: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true
              }
            }
          }
        },
        subscription: {
          include: {
            plan: true
          }
        },
        items: true
      }
    });
    res.json({ success: true, invoices });
  } catch (error) {
    console.error('Admin invoices fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/billing/stats - Get billing statistics (admin only)
 */
router.get('/billing/stats', async (req, res) => {
  try {
    const { prisma } = await import('../prismaClient');
    const { InvoiceStatus } = await import('@prisma/client');
    
    // Total collected (sum of all paid invoices)
    const totalCollected = await prisma.billing_invoices.aggregate({
      where: { status: InvoiceStatus.PAID },
      _sum: { amountPaid: true }
    });

    // Pending invoices count (OPEN invoices that are not yet paid)
    const pendingCount = await prisma.billing_invoices.count({
      where: { status: InvoiceStatus.OPEN }
    });

    // Monthly revenue change (last 30 days vs previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const last30Revenue = await prisma.billing_invoices.aggregate({
      where: {
        status: InvoiceStatus.PAID,
        issueDate: { gte: last30Days }
      },
      _sum: { amountPaid: true }
    });

    const previous30Revenue = await prisma.billing_invoices.aggregate({
      where: {
        status: InvoiceStatus.PAID,
        issueDate: { gte: previous30Days, lt: last30Days }
      },
      _sum: { amountPaid: true }
    });

    const last30Amount = Number(last30Revenue._sum.amountPaid || 0);
    const previous30Amount = Number(previous30Revenue._sum.amountPaid || 0);
    const revenueChange = previous30Amount > 0 
      ? ((last30Amount - previous30Amount) / previous30Amount * 100).toFixed(1)
      : '0';

    res.json({
      success: true,
      stats: {
        totalCollected: Number(totalCollected._sum.amountPaid || 0),
        pendingInvoices: pendingCount,
        revenueChange: revenueChange
      }
    });
  } catch (error) {
    console.error('Billing stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/analytics/overview - Get analytics overview (admin only)
 */
router.get('/analytics/overview', async (req, res) => {
  try {
    const { prisma } = await import('../prismaClient');
    const { timeRange = '7d' } = req.query;

    const now = new Date();
    let startDate: Date;
    if (timeRange === '24h') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get visitor and user counts from analytics_event_logs
    const events = await prisma.analytics_event_logs.findMany({
      where: {
        occurredAt: { gte: startDate },
        eventName: { in: ['page_view', 'user_session', 'user_login'] }
      }
    });

    // Count unique users
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId));
    
    // Get daily breakdown for last 7 days
    const dailyData: Record<string, { visits: number; users: Set<string> }> = {};
    const dayNames = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayName = dayNames[date.getDay()];
      dailyData[dayName] = { visits: 0, users: new Set() };
    }

    events.forEach(event => {
      const eventDate = new Date(event.occurredAt);
      const dayName = dayNames[eventDate.getDay()];
      if (dailyData[dayName]) {
        dailyData[dayName].visits++;
        if (event.userId) {
          dailyData[dayName].users.add(event.userId);
        }
      }
    });

    const visitorData = Object.entries(dailyData).map(([name, data]) => ({
      name,
      visits: data.visits,
      users: data.users.size
    }));

    // Device distribution (mock for now - would need device info in payload)
    const deviceData = [
      { name: "جوال", value: 65, color: "#3b82f6" },
      { name: "حاسوب", value: 30, color: "#10b981" },
      { name: "تابلت", value: 5, color: "#f59e0b" },
    ];

    // Page views from event logs
    const pageViewEvents = events.filter(e => e.eventName === 'page_view');
    const pageViewsMap: Record<string, number> = {};
    pageViewEvents.forEach(event => {
      const path = (event.payload as any)?.path || '/';
      pageViewsMap[path] = (pageViewsMap[path] || 0) + 1;
    });

    const pageViews = Object.entries(pageViewsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([page, views]) => ({
        page,
        views: views.toLocaleString('ar-SA'),
        change: '+0%', // Would need historical comparison
        status: 'up' as const
      }));

    // Calculate metrics
    const totalVisits = events.filter(e => e.eventName === 'page_view').length;
    const activeUsers = uniqueUsers.size;
    const conversionRate = activeUsers > 0 ? ((events.filter(e => e.eventName === 'user_login').length / activeUsers) * 100).toFixed(1) : '0';
    
    // Average session time (mock for now - would need session tracking)
    const avgSessionTime = '4:20';

    res.json({
      success: true,
      metrics: {
        totalVisits: totalVisits.toLocaleString('ar-SA'),
        activeUsers: activeUsers.toLocaleString('ar-SA'),
        conversionRate: `${conversionRate}%`,
        avgSessionTime
      },
      visitorData,
      deviceData,
      pageViews
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/notifications/templates - Get notification templates (admin only)
 */
router.get('/notifications/templates', async (req, res) => {
  try {
    const { prisma } = await import('../prismaClient');
    const templates = await prisma.support_templates.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    // Map to notification template format
    const mappedTemplates = templates.map(t => ({
      id: t.id,
      name: t.title,
      channels: ['Email'], // Default - would need to track channels separately
      status: t.isActive ? 'Active' : 'Draft',
      lastUpdated: formatRelativeTime(t.updatedAt),
      category: 'System' // Default category
    }));

    res.json({ success: true, templates: mappedTemplates });
  } catch (error) {
    console.error('Notification templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification templates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rbac-admin/notifications/stats - Get notification statistics (admin only)
 */
router.get('/notifications/stats', async (req, res) => {
  try {
    const { prisma } = await import('../prismaClient');
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    // Count notifications sent today (using support_tickets as proxy)
    const ticketsToday = await prisma.support_tickets.count({
      where: {
        openedAt: { gte: todayStart }
      }
    });

    // Calculate delivery rate (mock for now - would need actual notification tracking)
    const deliveryRate = '99.8%';
    const errors = 5; // Mock
    const avgDeliveryTime = '1.2 ث'; // Mock

    res.json({
      success: true,
      stats: {
        notificationsToday: ticketsToday.toLocaleString('ar-SA'),
        deliveryRate,
        errors,
        avgDeliveryTime
      }
    });
  } catch (error) {
    console.error('Notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `منذ ${diffMins} دقيقة`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ساعة`;
  } else if (diffDays === 1) {
    return 'منذ يوم';
  } else if (diffDays < 7) {
    return `منذ ${diffDays} أيام`;
  } else {
    return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
  }
}

/**
 * GET /api/rbac-admin/features/plans - Get pricing plans with features (admin only)
 */
router.get('/features/plans', async (req, res) => {
  try {
    const { prisma } = await import('../prismaClient');
    const plans = await prisma.pricing_plans.findMany({
      where: { isArchived: false },
      include: {
        pricing_plan_features: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, plans });
  } catch (error) {
    console.error('Features plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing plans',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
