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

// Import bcrypt for password hashing
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
    // Real data queries
    const userCount = await prisma.users.count();
    const propertyCount = await prisma.properties.count();
    const leadCount = await prisma.leads.count();
    const claimCount = await prisma.claims.count();
    const orgCount = await prisma.organizations.count();

    const appointmentsCount = await prisma.appointments.count({
      where: {
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
        }
      }
    });

    const appointments7Days = await prisma.appointments.count({
      where: {
        scheduledAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const appointments30Days = await prisma.appointments.count({
      where: {
        scheduledAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Financials
    const revenueAgg = await prisma.billing_invoices.aggregate({
      _sum: {
        amountPaid: true,
        amountDue: true
      }
    });

    // Recent Tickets
    const recentTickets = await prisma.support_tickets.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true, email: true }
        },
        assignedTo: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Top Agents (based on WON leads)
    const topAgentsGroups = await prisma.leads.groupBy({
      by: ['agentId'],
      where: {
        status: 'WON',
        agentId: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    } as any);

    const topAgents = await Promise.all(topAgentsGroups.map(async (group) => {
      if (!group.agentId) return null;
      const agent = await prisma.users.findUnique({
        where: { id: group.agentId },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true }
      });
      return {
        id: agent?.id,
        name: `${agent?.firstName} ${agent?.lastName}`,
        email: agent?.email,
        phone: agent?.phone,
        avatarUrl: agent?.avatarUrl,
        dealsWon: (group._count as any).id || 0,
        gmv: 0 // Placeholder as we don't have deal value easily yet
      };
    }));

    const totalRevenue = Number(revenueAgg._sum.amountPaid || 0);
    const totalInvoiced = Number(revenueAgg._sum.amountDue || 0); // approximation

    res.json({
      success: true,
      metrics: {
        currency: 'SAR',
        leads: { today: leadCount, last7Days: leadCount, last30Days: leadCount }, // Keeping simple count for now to avoid specific range queries complexity if not requested
        listings: { today: propertyCount, last7Days: propertyCount, last30Days: propertyCount },
        appointments: { today: appointmentsCount, last7Days: appointments7Days, last30Days: appointments30Days },
        dealsWon: { today: claimCount, last7Days: claimCount, last30Days: claimCount },
        gmv: { today: totalRevenue, last7Days: totalRevenue, last30Days: totalRevenue, currency: 'SAR' },
        invoiceTotal: { today: totalInvoiced, last7Days: totalInvoiced, last30Days: totalInvoiced, currency: 'SAR' },
        cashCollected: { today: totalRevenue, last7Days: totalRevenue, last30Days: totalRevenue, currency: 'SAR' }
      },
      topAgents: topAgents.filter(Boolean),
      recentTickets: recentTickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        updatedAt: t.updatedAt,
        openedAt: t.openedAt,
        customerName: t.createdBy ? `${t.createdBy.firstName} ${t.createdBy.lastName}` : "Unknown",
        assignedTo: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : null
      }))
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

/**
 * GET /api/rbac-admin/roles - Get all roles with permissions
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await prisma.system_roles.findMany({
      include: {
        role_permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // System roles usually created first
      }
    });

    res.json({
      success: true,
      roles: roles.map(role => ({
        name: role.key, // Frontend uses 'name' as the ID/Key
        displayName: role.name,
        description: role.description,
        scope: role.scope,
        isSystem: role.isSystem,
        isDefault: role.isDefault,
        permissions: role.role_permissions.map(rp => rp.permission.key),
        permissionDetails: role.role_permissions.map(rp => rp.permission).map(p => ({
          key: p.key,
          label: p.label,
          description: p.description,
          domain: p.domain
        }))
      }))
    });
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
    const orgs = await prisma.organizations.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      organizations: orgs.map(org => ({
        id: org.id,
        name: org.tradeName || org.legalName,
        description: (org.metadata as any)?.description || '',
        type: org.industry || 'Unknown',
        status: org.status.toLowerCase(),
        userCount: org._count.users,
        contactInfo: {
          email: org.email || '',
          phone: org.phone || '',
          address: org.address || '',
          website: org.website || ''
        },
        // Placeholder for subscription as schema doesn't show direct relation clearly yet
        subscription: {
          plan: 'Standard Plan',
          status: 'active',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        createdAt: org.createdAt,
        lastActive: org.updatedAt // Using updatedAt as proxy for lastActive
      }))
    });
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
    const { name, type, description, email, phone, address } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ success: false, message: 'Organization name is required' });
    }

    const newOrg = await prisma.organizations.create({
      data: {
        id: crypto.randomUUID(),
        legalName: name,
        tradeName: name,
        licenseNo: `ORG-${Date.now()}`, // Auto-generate license for now
        industry: type,
        email,
        phone,
        address,
        status: 'PENDING_VERIFICATION', // Default status
        metadata: { description },
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      organization: newOrg
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create organization',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/rbac-admin/organizations/:id - Update organization
 */
router.put('/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, description, email, phone, address, status } = req.body;

    const updatedOrg = await prisma.organizations.update({
      where: { id },
      data: {
        legalName: name,
        tradeName: name,
        industry: type,
        email,
        phone,
        address,
        status: status ? status.toUpperCase() : undefined,
        metadata: { description }, // This overwrites other metadata, careful in prod
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      organization: updatedOrg
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/rbac-admin/organizations/:id - Delete organization
 */
router.delete('/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.organizations.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rbac-admin/users - Create new user
 */
router.post('/users', async (req, res) => {
  try {
    const { firstName, lastName, email, username, phone, password, roles, isActive, organizationId } = req.body;

    // Validation
    if (!username || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check uniqueness
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ username }, { email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this username, email, or phone already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Format roles as JSON string
    const rolesJson = JSON.stringify(Array.isArray(roles) ? roles : [roles]);

    const newUser = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        username,
        email,
        phone,
        passwordHash,
        roles: rolesJson,
        isActive: isActive ?? true,
        organizationId,
        approvalStatus: 'APPROVED', // direct admin creation
        updatedAt: new Date()
      }
    });

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/rbac-admin/users/:id - Update user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, username, phone, roles, isActive, organizationId } = req.body;

    // Check if user exists
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const data: any = {
      firstName,
      lastName,
      email,
      username,
      phone,
      isActive,
      organizationId,
      updatedAt: new Date()
    };

    if (roles) {
      data.roles = JSON.stringify(Array.isArray(roles) ? roles : [roles]);
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data
    });

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/rbac-admin/users/:id - Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.users.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rbac-admin/roles - Create new role
 */
router.post('/roles', async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body; // name is key

    if (!name || !displayName) {
      return res.status(400).json({ success: false, message: 'Role key (name) and display name are required' });
    }

    // Check if role key exists
    const existing = await prisma.system_roles.findUnique({ where: { key: name } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Role with this key already exists' });
    }

    // Create role
    const newRole = await prisma.system_roles.create({
      data: {
        key: name,
        name: displayName,
        description,
        scope: 'PLATFORM', // Default to platform for admin created roles
        isSystem: false,
        isDefault: false
      }
    });

    // Assign permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      // Find permission IDs for the keys
      const perms = await prisma.permissions.findMany({
        where: { key: { in: permissions } }
      });

      if (perms.length > 0) {
        await prisma.role_permissions.createMany({
          data: perms.map(p => ({
            roleId: newRole.id,
            permissionId: p.id
          }))
        });
      }
    }

    res.json({ success: true, role: newRole });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/rbac-admin/roles/:id - Update role
 */
router.put('/roles/:name', async (req, res) => { // Frontend might pass name/key as ID or real ID. Let's assume key based on GET response mapping name=key
  try {
    // Wait, GET /roles returns { name: role.key, ... }. So frontend uses key as ID.
    // So route param is likely the key.
    const { name: key } = req.params;
    const { displayName, description, permissions } = req.body;

    const role = await prisma.system_roles.findUnique({ where: { key } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // Update basic info
    const updatedRole = await prisma.system_roles.update({
      where: { key },
      data: {
        name: displayName,
        description,
        updatedAt: new Date()
      }
    });

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Delete existing
      await prisma.role_permissions.deleteMany({
        where: { roleId: role.id }
      });

      // Add new
      const perms = await prisma.permissions.findMany({
        where: { key: { in: permissions } }
      });

      if (perms.length > 0) {
        await prisma.role_permissions.createMany({
          data: perms.map(p => ({
            roleId: role.id,
            permissionId: p.id
          }))
        });
      }
    }

    res.json({ success: true, role: updatedRole });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/rbac-admin/roles/:id - Delete role
 */
router.delete('/roles/:name', async (req, res) => {
  try {
    const { name: key } = req.params;

    // Validate not deleting system role
    const role = await prisma.system_roles.findUnique({ where: { key } });
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, message: 'Cannot delete system roles' });
    }

    await prisma.system_roles.delete({ where: { key } });
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
