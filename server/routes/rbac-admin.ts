/**
 * server/routes/rbac-admin.ts - RBAC Admin API Routes
 * 
 * This file provides comprehensive API endpoints for the RBAC dashboard,
 * including user management, organization management, role management,
 * and system analytics.
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Parse roles
    let parsedRoles = [];
    try {
      parsedRoles = JSON.parse(user.roles);
    } catch (e) {
      parsedRoles = [user.roles];
    }

    // Check if user has admin role
    if (!parsedRoles.includes('WEBSITE_ADMIN')) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

/**
 * GET /api/rbac-admin/stats - Get system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalOrganizations,
      activeOrganizations,
      totalRoles,
      recentLogins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.user.groupBy({ by: ['roles'] }).then((result: any[]) => result.length),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalOrganizations,
        activeOrganizations,
        totalRoles,
        recentLogins,
        systemHealth: 'excellent'
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/rbac-admin/activities - Get recent activities
 */
router.get('/activities', async (req, res) => {
  try {
    const activities = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        }
      }
    });

    const formattedActivities = activities.map((activity: any) => ({
      id: activity.id,
      action: getActionDescription(activity.action),
      user: `${activity.user?.firstName || ''} ${activity.user?.lastName || ''}`.trim() || activity.user?.username || 'Unknown',
      time: getTimeAgo(activity.createdAt),
      type: getActivityType(activity.action)
    }));

    res.json({
      success: true,
      activities: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
});

/**
 * GET /api/rbac-admin/users - Get all users with pagination
 */
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.roles = { contains: role };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: {
              id: true,
              legalName: true,
              tradeName: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const formattedUsers = users.map((user: any) => {
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
        name: `${user.firstName} ${user.lastName}`,
        roles: parsedRoles,
        organization: user.organization,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      };
    });

    res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

/**
 * POST /api/rbac-admin/users - Create new user
 */
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, roles, organizationId } = req.body;

    if (!username || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        roles: JSON.stringify(roles || ['BUYER']),
        organizationId,
        isActive: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'unknown',
        action: 'CREATE_USER',
        entity: 'USER',
        entityId: user.id,
        afterJson: JSON.stringify({ username: user.username, roles: user.roles }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: JSON.parse(user.roles),
        organizationId: user.organizationId,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

/**
 * PUT /api/rbac-admin/users/:id - Update user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, phone, roles, organizationId, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: username.toLowerCase().trim() }
      });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }
    }

    const updateData: any = {};
    if (username) updateData.username = username.toLowerCase().trim();
    if (email !== undefined) updateData.email = email;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (roles) updateData.roles = JSON.stringify(roles);
    if (organizationId !== undefined) updateData.organizationId = organizationId;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'unknown',
        action: 'UPDATE_USER',
        entity: 'USER',
        entityId: id,
        beforeJson: JSON.stringify({
          username: existingUser.username,
          roles: existingUser.roles,
          isActive: existingUser.isActive
        }),
        afterJson: JSON.stringify({
          username: updatedUser.username,
          roles: updatedUser.roles,
          isActive: updatedUser.isActive
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        roles: JSON.parse(updatedUser.roles),
        organizationId: updatedUser.organizationId,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

/**
 * DELETE /api/rbac-admin/users/:id - Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow deleting the current admin user
    if (id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'unknown',
        action: 'DELETE_USER',
        entity: 'USER',
        entityId: id,
        beforeJson: JSON.stringify({ username: user.username, roles: user.roles }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

/**
 * GET /api/rbac-admin/organizations - Get all organizations
 */
router.get('/organizations', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradeName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true }
          }
        }
      }),
      prisma.organization.count({ where })
    ]);

    res.json({
      success: true,
      organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch organizations' });
  }
});

/**
 * POST /api/rbac-admin/organizations - Create new organization
 */
router.post('/organizations', async (req, res) => {
  try {
    const { legalName, tradeName, licenseNumber, address, phone, email, isActive = true } = req.body;

    if (!legalName || !tradeName) {
      return res.status(400).json({ success: false, message: 'Legal name and trade name are required' });
    }

    const organization = await prisma.organization.create({
      data: {
        legalName,
        tradeName,
        licenseNumber,
        address,
        phone,
        email,
        isActive
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'unknown',
        action: 'CREATE_ORGANIZATION',
        entity: 'ORGANIZATION',
        entityId: organization.id,
        afterJson: JSON.stringify({ legalName, tradeName }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ success: false, message: 'Failed to create organization' });
  }
});

/**
 * GET /api/rbac-admin/roles - Get all available roles and permissions
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = [
      {
        name: 'WEBSITE_ADMIN',
        displayName: 'مدير الموقع',
        description: 'مدير النظام مع صلاحيات كاملة',
        permissions: [
          'manage_users',
          'manage_organizations',
          'manage_roles',
          'view_all_data',
          'impersonate_users',
          'manage_site_settings',
          'view_audit_logs'
        ]
      },
      {
        name: 'CORP_OWNER',
        displayName: 'مالك الشركة',
        description: 'مالك أو مدير حساب شركة',
        permissions: [
          'manage_org_profile',
          'manage_org_agents',
          'view_org_data',
          'search_buyer_pool',
          'reassign_leads',
          'view_org_reports'
        ]
      },
      {
        name: 'CORP_AGENT',
        displayName: 'وكيل شركة',
        description: 'وكيل مرخص تحت منظمة شركة',
        permissions: [
          'manage_own_properties',
          'view_org_properties',
          'search_buyer_pool',
          'claim_buyer_requests',
          'manage_own_leads',
          'view_org_leads'
        ]
      },
      {
        name: 'INDIV_AGENT',
        displayName: 'وكيل مستقل',
        description: 'وكيل مرخص مستقل',
        permissions: [
          'manage_own_properties',
          'search_buyer_pool',
          'claim_buyer_requests',
          'manage_own_leads'
        ]
      },
      {
        name: 'SELLER',
        displayName: 'بائع',
        description: 'عميل فردي يبيع عقار',
        permissions: [
          'manage_own_submissions',
          'view_own_leads'
        ]
      },
      {
        name: 'BUYER',
        displayName: 'مشتري',
        description: 'عميل فردي يبحث عن عقار',
        permissions: [
          'manage_own_requests',
          'view_own_claims'
        ]
      }
    ];

    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch roles' });
  }
});

// Helper functions
function getActionDescription(action: string): string {
  const descriptions: { [key: string]: string } = {
    'LOGIN': 'تم تسجيل الدخول',
    'LOGOUT': 'تم تسجيل الخروج',
    'CREATE_USER': 'تم إنشاء مستخدم جديد',
    'UPDATE_USER': 'تم تحديث مستخدم',
    'DELETE_USER': 'تم حذف مستخدم',
    'CREATE_ORGANIZATION': 'تم إنشاء منظمة جديدة',
    'UPDATE_ORGANIZATION': 'تم تحديث منظمة',
    'DELETE_ORGANIZATION': 'تم حذف منظمة',
    'CLAIM_BUYER_REQUEST': 'تم المطالبة بطلب مشتري',
    'RELEASE_CLAIM': 'تم إلغاء المطالبة',
    'CREATE_LEAD': 'تم إنشاء عميل محتمل',
    'UPDATE_LEAD': 'تم تحديث عميل محتمل'
  };
  return descriptions[action] || action;
}

function getActivityType(action: string): string {
  if (action.includes('CREATE') || action.includes('LOGIN')) return 'success';
  if (action.includes('DELETE') || action.includes('LOGOUT')) return 'warning';
  return 'info';
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'منذ لحظات';
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
}

export default router;
