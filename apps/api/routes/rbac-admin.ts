// @ts-nocheck
/**
 * apps/api/routes/rbac-admin.ts - RBAC Admin API Routes
 * 
 * This file provides comprehensive API endpoints for the RBAC dashboard,
 * including user management, organization management, role management,
 * and system analytics.
 */

import { Router } from "express";
import { Prisma } from "@prisma/client";
import { startOfDay, endOfDay, subDays, addDays } from "date-fns";
import { prisma } from "../prismaClient";
import jwt from "jsonwebtoken";

const router = Router();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const DEFAULT_USER_ROLE = 'BUYER';

const ROLE_DISPLAY_TRANSLATIONS: Record<string, string> = {
  WEBSITE_ADMIN: 'مدير النظام',
  CORP_OWNER: 'مالك الشركة',
  CORP_AGENT: 'وكيل شركة',
  INDIV_AGENT: 'وكيل مستقل',
  SELLER: 'بائع',
  BUYER: 'مشتري'
};

const normalizeRoleKeys = (input?: unknown): string[] => {
  if (!input) return [DEFAULT_USER_ROLE];
  if (Array.isArray(input)) {
    const cleaned = input
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim().toUpperCase());
    return cleaned.length ? Array.from(new Set(cleaned)) : [DEFAULT_USER_ROLE];
  }
  if (typeof input === 'string' && input.trim().length > 0) {
    return [input.trim().toUpperCase()];
  }
  return [DEFAULT_USER_ROLE];
};

const syncUserRoleAssignments = async (
  client: Prisma.TransactionClient,
  userId: string,
  requestedRoles: string[],
  actorId?: string
): Promise<string[]> => {
  const normalized = normalizeRoleKeys(requestedRoles);

  const roles = await client.system_roles.findMany({
    where: { key: { in: normalized } }
  });

  if (!roles.length) {
    return [];
  }

  const validRoleIds = roles.map((role) => role.id);

  await client.user_roles.deleteMany({
    where: {
      userId,
      NOT: { roleId: { in: validRoleIds } }
    }
  });

  await client.user_roles.createMany({
    data: roles.map((role) => ({
      userId,
      roleId: role.id,
      assignedBy: actorId ?? null
    })),
    skipDuplicates: true
  });

  return roles.map((role) => role.key);
};

const syncOrganizationMembership = async (
  client: Prisma.TransactionClient,
  userId: string,
  organizationId: string | null | undefined,
  roleKeys: string[]
) => {
  // Remove memberships for other organizations first
  await client.organization_memberships.deleteMany({
    where: {
      userId,
      ...(organizationId ? { NOT: { organizationId: organizationId } } : {})
    }
  });

  if (!organizationId) {
    return;
  }

  const orgRole = roleKeys.length
    ? await client.system_roles.findFirst({
        where: {
          key: { in: roleKeys },
          scope: 'ORGANIZATION'
        },
        orderBy: { isDefault: 'desc' }
      })
    : null;

  await client.organization_memberships.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId
      }
    },
    create: {
      organizationId,
      userId,
      roleId: orgRole?.id ?? null,
      status: 'ACTIVE',
      isPrimary: true,
      joinedAt: new Date()
    },
    update: {
      roleId: orgRole?.id ?? null,
      status: 'ACTIVE'
    }
  });
};

const serializeRolesForUser = (roles: string[]) => JSON.stringify(roles.length ? roles : [DEFAULT_USER_ROLE]);

const mapUserRoles = (user: any): string[] => {
  if (user?.user_roles?.length) {
    const keys = user.user_roles
      .map((assignment: any) => assignment.role?.key)
      .filter((key: unknown): key is string => typeof key === 'string' && key.length);
    if (keys.length) {
      return Array.from(new Set(keys));
    }
  }

  if (user?.roles) {
    try {
      const parsed = JSON.parse(user.roles ?? '[]');
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.filter((value): value is string => typeof value === 'string');
      }
    } catch (error) {
      return [user.roles];
    }
  }

  return [DEFAULT_USER_ROLE];
};

const appendApprovalHistory = (existingMetadata: any, entry: { action: string; adminId: string; note?: string }) => {
  const metadata = existingMetadata && typeof existingMetadata === 'object' ? { ...existingMetadata } : {};
  const history = Array.isArray(metadata.approvalHistory) ? [...metadata.approvalHistory] : [];
  history.push({ ...entry, at: new Date().toISOString() });
  metadata.approvalHistory = history;
  return metadata;
};

const resolveAccessibleOrganizationIds = async (user: any): Promise<string[]> => {
  const roles = mapUserRoles(user);

  if (roles.includes('WEBSITE_ADMIN')) {
    const all = await prisma.organizations.findMany({ select: { id: true } });
    return all.map((org) => org.id);
  }

  const memberships = await prisma.organization_memberships.findMany({
    where: { userId: user.id },
    select: { organizationId: true }
  });

  return memberships.map((membership) => membership.organizationId);
};

// Middleware to verify admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const headerToken = req.headers.authorization?.replace('Bearer ', '');
    const sessionToken = req.session?.authToken as string | undefined;
    const sessionUser = req.session?.user;

    if (!headerToken && !sessionToken && !sessionUser) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const loadUser = async (userId: string) => {
      return prisma.users.findUnique({
        where: { id: userId }
      });
    };

    const ensureAdmin = (rolesValue: string | string[]) => {
      let roles: string[] = [];
      if (Array.isArray(rolesValue)) {
        roles = rolesValue;
      } else {
        try {
          roles = JSON.parse(rolesValue);
        } catch {
          roles = [rolesValue];
        }
      }
      return roles.includes('WEBSITE_ADMIN');
    };

    if (headerToken) {
      const decoded = jwt.verify(headerToken, JWT_SECRET) as any;
      const user = await loadUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      if (!ensureAdmin(user.roles)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      req.user = user;
      return next();
    }

    if (sessionToken) {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
      const user = await loadUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      if (!ensureAdmin(user.roles)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      req.user = user;
      return next();
    }

    if (sessionUser) {
      if (!ensureAdmin(sessionUser.roles)) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      req.user = sessionUser;
      return next();
    }

    return res.status(401).json({ success: false, message: 'No token provided' });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Apply admin middleware to all routes
router.use(requireAdmin);

/**
 * GET /api/rbac-admin/dashboard - Aggregated analytics for overview
 */
router.get('/dashboard', async (req, res) => {
  try {
    const organizationIds = await resolveAccessibleOrganizationIds(req.user);

    if (!organizationIds.length) {
      return res.json({
        success: true,
        metrics: {
          currency: 'SAR',
          leads: { today: 0, last7Days: 0, last30Days: 0 },
          listings: { today: 0, last7Days: 0, last30Days: 0 },
          appointments: { today: 0, last7Days: 0, last30Days: 0 },
          dealsWon: { today: 0, last7Days: 0, last30Days: 0 },
          gmv: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' },
          invoiceTotal: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' },
          cashCollected: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' }
        },
        topAgents: [],
        recentTickets: []
      });
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(todayStart);
    const last7Start = startOfDay(subDays(todayStart, 6));
    const last30Start = startOfDay(subDays(todayStart, 29));

    const analyticsRows = await prisma.analytics_daily_metrics.findMany({
      where: {
        metric: {
          in: [
            'LEADS_CREATED',
            'LISTINGS_CREATED',
            'APPOINTMENTS_CREATED',
            'DEALS_WON',
            'GMV',
            'INVOICE_TOTAL',
            'CASH_COLLECTED'
          ]
        },
        dimension: 'organization',
        dimensionValue: { in: organizationIds },
        recordedFor: { gte: last30Start }
      }
    });

    const metrics = {
      currency: 'SAR',
      leads: { today: 0, last7Days: 0, last30Days: 0 },
      listings: { today: 0, last7Days: 0, last30Days: 0 },
      appointments: { today: 0, last7Days: 0, last30Days: 0 },
      dealsWon: { today: 0, last7Days: 0, last30Days: 0 },
      gmv: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' },
      invoiceTotal: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' },
      cashCollected: { today: 0, last7Days: 0, last30Days: 0, currency: 'SAR' }
    } as const;

    const countMetrics = new Set(['LEADS_CREATED', 'LISTINGS_CREATED', 'APPOINTMENTS_CREATED', 'DEALS_WON']);

    analyticsRows.forEach((row) => {
      const recordedAt = startOfDay(row.recordedFor);
      const isToday = recordedAt >= todayStart && recordedAt <= todayEnd;
      const inLast7 = recordedAt >= last7Start && recordedAt <= todayEnd;
      const inLast30 = recordedAt >= last30Start && recordedAt <= todayEnd;

      const metricKey = row.metric;
      let bucket:
        | typeof metrics.leads
        | typeof metrics.listings
        | typeof metrics.appointments
        | typeof metrics.dealsWon
        | typeof metrics.gmv
        | typeof metrics.invoiceTotal
        | typeof metrics.cashCollected
        | undefined;

      switch (metricKey) {
        case 'LEADS_CREATED':
          bucket = metrics.leads;
          break;
        case 'LISTINGS_CREATED':
          bucket = metrics.listings;
          break;
        case 'APPOINTMENTS_CREATED':
          bucket = metrics.appointments;
          break;
        case 'DEALS_WON':
          bucket = metrics.dealsWon;
          break;
        case 'GMV':
          bucket = metrics.gmv;
          break;
        case 'INVOICE_TOTAL':
          bucket = metrics.invoiceTotal;
          break;
        case 'CASH_COLLECTED':
          bucket = metrics.cashCollected;
          break;
        default:
          break;
      }

      if (!bucket) return;

      const value = countMetrics.has(metricKey)
        ? row.count ?? 0
        : Number(row.total ?? 0);

      if (isToday) bucket.today += value;
      if (inLast7) bucket.last7Days += value;
      if (inLast30) bucket.last30Days += value;
    });

    const ninetyDaysAgo = subDays(todayStart, 89);
    const groupedAgents = await prisma.deals.groupBy({
      by: ['agentId'],
      where: {
        agentId: { not: null },
        organizationId: { in: organizationIds },
        stage: 'WON',
        wonAt: { not: null, gte: ninetyDaysAgo }
      },
      _count: { _all: true },
      _sum: { agreedPrice: true },
      orderBy: {
        _sum: {
          agreedPrice: 'desc'
        }
      },
      take: 5
    });

    const agentIds = groupedAgents
      .map((entry) => entry.agentId)
      .filter((id): id is string => Boolean(id));

    const agentMap = new Map(
      agentIds.length
        ? (
            await prisma.users.findMany({
              where: { id: { in: agentIds } },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true
              }
            })
          ).map((user) => [user.id, user])
        : []
    );

    const topAgents = groupedAgents
      .map((entry) => {
        if (!entry.agentId) return null;
        const agent = agentMap.get(entry.agentId);
        if (!agent) return null;
        return {
          id: entry.agentId,
          name: `${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim() || agent.email,
          email: agent.email,
          phone: agent.phone,
          avatarUrl: agent.avatarUrl,
          dealsWon: entry._count._all,
          gmv: Number(entry._sum.agreedPrice ?? 0)
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));

    const recentTicketsRaw = await prisma.support_tickets.findMany({
      where: {
        organizationId: { in: organizationIds }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        channel: true,
        openedAt: true,
        updatedAt: true,
        organizationId: true,
        customer: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const recentTickets = recentTicketsRaw.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      channel: ticket.channel,
      updatedAt: ticket.updatedAt,
      openedAt: ticket.openedAt,
      customerName: ticket.customer
        ? `${ticket.customer.firstName ?? ''} ${ticket.customer.lastName ?? ''}`.trim()
        : null,
      assignedTo: ticket.assignedTo
        ? `${ticket.assignedTo.firstName ?? ''} ${ticket.assignedTo.lastName ?? ''}`.trim()
        : null
    }));

    res.json({
      success: true,
      metrics,
      topAgents,
      recentTickets
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard metrics' });
  }
});

/**
 * GET /api/rbac-admin/stats - Get system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const [
      totalUsers,
      activeUsers,
      totalOrganizations,
      activeOrganizations,
      totalRoles,
      recentLogins,
      billingAccounts,
      activeSubscriptions,
      openInvoices,
      latestMrrSnapshot,
      analyticsMetricCount
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { isActive: true } }),
      prisma.organizations.count(),
      prisma.organizations.count({ where: { status: 'ACTIVE' } }),
      prisma.system_roles.count(),
      prisma.users.count({
        where: {
          lastLoginAt: {
            gte: oneDayAgo
          }
        }
      }),
      prisma.billing_accounts.count(),
      prisma.billing_subscriptions.count({ where: { status: 'ACTIVE' } }),
      prisma.billing_invoices.count({ where: { status: { in: ['OPEN', 'PAST_DUE'] } } }),
      prisma.revenue_snapshots.findFirst({
        where: { metric: 'MRR' },
        orderBy: { snapshotDate: 'desc' }
      }),
      prisma.analytics_daily_metrics.count()
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
        billingAccounts,
        activeSubscriptions,
        openInvoices,
        latestMrr: latestMrrSnapshot ? Number(latestMrrSnapshot.value) : 0,
        analyticsRecords: analyticsMetricCount,
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
    const activities = await prisma.audit_logs.findMany({
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
      const roleFilter = {
        OR: [
          { roles: { contains: role } },
          { user_roles: { some: { role: { key: role } } } }
        ]
      };
      if (where.AND) {
        where.AND.push(roleFilter);
      } else {
        where.AND = [roleFilter];
      }
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
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
          },
          user_roles: {
            include: {
              role: {
                select: {
                  key: true,
                  name: true,
                  scope: true
                }
              }
            }
          },
          organization_memberships: {
            include: {
              organization: {
                select: {
                  id: true,
                  legalName: true,
                  tradeName: true
                }
              },
              role: {
                select: {
                  key: true,
                  name: true
                }
              }
            }
          },
          agentProfile: {
            select: {
              licenseNo: true
            }
          }
        }
      }),
      prisma.users.count({ where })
    ]);

    const formattedUsers = users.map((user: any) => {
      const resolvedRoles = mapUserRoles(user);
      const primaryMembership = user.organization_memberships?.find((membership: any) => membership.isPrimary) ??
        user.organization_memberships?.[0];

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        roles: resolvedRoles,
        organization: user.organization,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        licenseNumber: user.agentProfile?.licenseNo || null,
        memberships: (user.organization_memberships || []).map((membership: any) => ({
          id: membership.id,
          organizationId: membership.organizationId,
          roleKey: membership.role?.key ?? null,
          roleName: membership.role?.name ?? null,
          status: membership.status,
          isPrimary: membership.isPrimary,
          joinedAt: membership.joinedAt,
          organization: membership.organization
        })),
        primaryMembership: primaryMembership
          ? {
              id: primaryMembership.id,
              organizationId: primaryMembership.organizationId,
              roleKey: primaryMembership.role?.key ?? null,
              roleName: primaryMembership.role?.name ?? null,
              status: primaryMembership.status,
              isPrimary: primaryMembership.isPrimary,
              joinedAt: primaryMembership.joinedAt,
              organization: primaryMembership.organization
            }
          : null
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
    const existingUser = await prisma.users.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const normalizedRoles = normalizeRoleKeys(roles);

    const result = await prisma.$transaction(async (tx) => {
      // Hash password inside the transaction scope to keep secrets contained
      const bcrypt = require('bcrypt');
      const passwordHash = await bcrypt.hash(password, 12);

      const createdUser = await tx.users.create({
        data: {
          username: username.toLowerCase().trim(),
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          roles: serializeRolesForUser(normalizedRoles),
          organizationId: organizationId || null,
          isActive: true,
          approvalStatus: 'PENDING'
        }
      });

      const assignedRoles = await syncUserRoleAssignments(tx, createdUser.id, normalizedRoles, req.user?.id);

      // Persist the canonical role list on the user record
      await tx.users.update({
        where: { id: createdUser.id },
        data: { roles: serializeRolesForUser(assignedRoles.length ? assignedRoles : normalizedRoles) }
      });

      await syncOrganizationMembership(tx, createdUser.id, organizationId || null, assignedRoles);

      await tx.audit_logs.create({
        data: {
          userId: req.user?.id || 'unknown',
          action: 'CREATE_USER',
          entity: 'USER',
          entityId: createdUser.id,
          afterJson: JSON.stringify({ username: createdUser.username, roles: assignedRoles }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      const enrichedUser = await tx.users.findUnique({
        where: { id: createdUser.id },
        include: {
          organization: {
            select: {
              id: true,
              legalName: true,
              tradeName: true
            }
          },
          agentProfile: {
            select: {
              licenseNo: true
            }
          },
          user_roles: {
            include: {
              role: {
                select: { key: true, name: true, scope: true }
              }
            }
          },
          organization_memberships: {
            include: {
              organization: {
                select: { id: true, legalName: true, tradeName: true }
              },
              role: {
                select: { key: true, name: true }
              }
            }
          }
        }
      });

      return {
        user: enrichedUser,
        roles: assignedRoles.length ? assignedRoles : normalizedRoles
      };
    });

    if (!result.user) {
      throw new Error('Failed to load created user');
    }

    const formattedRoles = mapUserRoles(result.user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        roles: formattedRoles,
        organizationId: result.user.organizationId,
        isActive: result.user.isActive,
        approvalStatus: result.user.approvalStatus
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

    const existingUser = await prisma.users.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.users.findUnique({
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
    if (organizationId !== undefined) updateData.organizationId = organizationId || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const normalizedRoles = roles !== undefined ? normalizeRoleKeys(roles) : null;

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.users.update({
        where: { id },
        data: updateData
      });

      let effectiveRoles: string[] = [];
      if (normalizedRoles) {
        const assigned = await syncUserRoleAssignments(tx, updatedUser.id, normalizedRoles, req.user?.id);
        effectiveRoles = assigned.length ? assigned : normalizedRoles;
        await tx.users.update({
          where: { id: updatedUser.id },
          data: { roles: serializeRolesForUser(effectiveRoles) }
        });
      } else {
        const currentAssignments = await tx.user_roles.findMany({
          where: { userId: updatedUser.id },
          include: { role: { select: { key: true } } }
        });
        effectiveRoles = currentAssignments.length
          ? Array.from(
              new Set(
                currentAssignments
                  .map((assignment) => assignment.role?.key)
                  .filter((key): key is string => typeof key === 'string' && key.length)
              )
            )
          : mapUserRoles(updatedUser);
      }

      await syncOrganizationMembership(
        tx,
        updatedUser.id,
        updateData.organizationId !== undefined ? updateData.organizationId : updatedUser.organizationId,
        effectiveRoles
      );

      await tx.audit_logs.create({
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
            roles: effectiveRoles,
            isActive: updateData.isActive ?? updatedUser.isActive
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      const enrichedUser = await tx.users.findUnique({
        where: { id: updatedUser.id },
        include: {
          organization: {
            select: {
              id: true,
              legalName: true,
              tradeName: true
            }
          },
          agentProfile: {
            select: {
              licenseNo: true
            }
          },
          user_roles: {
            include: {
              role: {
                select: {
                  key: true,
                  name: true,
                  scope: true
                }
              }
            }
          }
        }
      });

      return {
        user: enrichedUser,
        roles: effectiveRoles
      };
    });

    if (!result.user) {
      throw new Error('Failed to load updated user');
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        roles: result.roles,
        organizationId: result.user.organizationId,
        isActive: result.user.isActive,
        approvalStatus: result.user.approvalStatus
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

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Don't allow deleting the current admin user
    if (id === req.user?.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await prisma.users.delete({ where: { id } });

    // Audit log
    await prisma.audit_logs.create({
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
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          primaryContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          settings: true,
          billing_accounts: {
            select: {
              id: true,
              status: true,
              currency: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              users: true,
              memberships: true
            }
          }
        }
      }),
      prisma.organizations.count({ where })
    ]);

    const enrichedOrganizations = organizations.map((organization: any) => ({
      ...organization,
      userCount: organization._count?.users ?? 0,
      memberCount: organization._count?.memberships ?? 0,
      billingAccounts: organization.billing_accounts,
      settings: organization.settings,
      primaryContact: organization.primaryContact
    }));

    enrichedOrganizations.forEach((org: any) => {
      delete org._count;
      delete org.billing_accounts;
    });

    res.json({
      success: true,
      organizations: enrichedOrganizations,
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
    const { legalName, tradeName, licenseNumber, address, phone, email } = req.body;

    if (!legalName || !tradeName) {
      return res.status(400).json({ success: false, message: 'Legal name and trade name are required' });
    }

    if (!licenseNumber) {
      return res.status(400).json({ success: false, message: 'License number is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organizations.create({
        data: {
          legalName,
          tradeName,
          licenseNo: licenseNumber,
          address,
          phone,
          email,
          status: 'PENDING_VERIFICATION'
        }
      });

      await tx.organization_settings.create({
        data: {
          organizationId: createdOrganization.id
        }
      });

      await tx.billing_accounts.create({
        data: {
          organizationId: createdOrganization.id,
          status: 'ACTIVE',
          currency: 'SAR',
          billingEmail: email ?? null,
          billingPhone: phone ?? null
        }
      });

      await tx.audit_logs.create({
        data: {
          userId: req.user?.id || 'unknown',
          action: 'CREATE_ORGANIZATION',
          entity: 'ORGANIZATION',
          entityId: createdOrganization.id,
          afterJson: JSON.stringify({ legalName, tradeName }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      const enrichedOrganization = await tx.organizations.findUnique({
        where: { id: createdOrganization.id },
        include: {
          settings: true,
          billing_accounts: {
            select: {
              id: true,
              status: true,
              currency: true,
              createdAt: true
            }
          }
        }
      });

      return enrichedOrganization;
    });

    if (result) {
      const organizationResponse: any = {
        ...result,
        billingAccounts: result.billing_accounts ?? []
      };
      delete organizationResponse.billing_accounts;

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        organization: organizationResponse
      });
      return;
    }

    throw new Error('Unable to create organization');
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
    const roles = await prisma.system_roles.findMany({
      orderBy: [
        { scope: 'asc' },
        { name: 'asc' }
      ],
      include: {
        role_permissions: {
          include: {
            permission: {
              select: {
                key: true,
                label: true,
                description: true,
                domain: true
              }
            }
          }
        }
      }
    });

    const payload = roles.map((role) => ({
      name: role.key,
      displayName: ROLE_DISPLAY_TRANSLATIONS[role.key] ?? role.name,
      description: role.description,
      scope: role.scope,
      isSystem: role.isSystem,
      isDefault: role.isDefault,
      permissions: role.role_permissions.map((assignment) => assignment.permission.key),
      permissionDetails: role.role_permissions.map((assignment) => ({
        key: assignment.permission.key,
        label: assignment.permission.label,
        description: assignment.permission.description,
        domain: assignment.permission.domain
      }))
    }));

    res.json({
      success: true,
      roles: payload
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

// User approval endpoints
router.post('/users/:userId/approve', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Admin user not found' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.users.findUnique({ where: { id: userId } });
      if (!currentUser) {
        throw new Error('User not found');
      }

      const metadata = appendApprovalHistory(currentUser.metadata, { action: 'APPROVED', adminId });

      const approvedUser = await tx.users.update({
        where: { id: userId },
        data: {
          isActive: true,
          approvalStatus: 'APPROVED',
          metadata
        }
      });

      await tx.audit_logs.create({
        data: {
          userId: adminId,
          action: 'UPDATE_USER',
          entity: 'USER',
          entityId: userId,
          beforeJson: JSON.stringify({ approvalStatus: currentUser.approvalStatus, isActive: currentUser.isActive }),
          afterJson: JSON.stringify({ approvalStatus: approvedUser.approvalStatus, isActive: approvedUser.isActive }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      return approvedUser;
    });

    res.json({
      success: true,
      message: 'User approved successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error approving user:', error);
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to approve user' });
  }
});

router.post('/users/:userId/reject', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Admin user not found' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.users.findUnique({ where: { id: userId } });
      if (!currentUser) {
        throw new Error('User not found');
      }

      const metadata = appendApprovalHistory(currentUser.metadata, { action: 'REJECTED', adminId, note: reason });

      const rejectedUser = await tx.users.update({
        where: { id: userId },
        data: {
          isActive: false,
          approvalStatus: 'REJECTED',
          metadata
        }
      });

      await tx.audit_logs.create({
        data: {
          userId: adminId,
          action: 'UPDATE_USER',
          entity: 'USER',
          entityId: userId,
          beforeJson: JSON.stringify({ approvalStatus: currentUser.approvalStatus, isActive: currentUser.isActive }),
          afterJson: JSON.stringify({ approvalStatus: rejectedUser.approvalStatus, isActive: rejectedUser.isActive }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      return rejectedUser;
    });

    res.json({
      success: true,
      message: 'User rejected successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to reject user' });
  }
});

router.post('/users/:userId/request-info', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Admin user not found' });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const currentUser = await tx.users.findUnique({ where: { id: userId } });
      if (!currentUser) {
        throw new Error('User not found');
      }

      const metadata = appendApprovalHistory(currentUser.metadata, { action: 'NEEDS_INFO', adminId, note: message });

      const needsInfoUser = await tx.users.update({
        where: { id: userId },
        data: {
          isActive: false,
          approvalStatus: 'NEEDS_INFO',
          metadata
        }
      });

      await tx.audit_logs.create({
        data: {
          userId: adminId,
          action: 'UPDATE_USER',
          entity: 'USER',
          entityId: userId,
          beforeJson: JSON.stringify({ approvalStatus: currentUser.approvalStatus, isActive: currentUser.isActive }),
          afterJson: JSON.stringify({ approvalStatus: needsInfoUser.approvalStatus, isActive: needsInfoUser.isActive }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        }
      });

      return needsInfoUser;
    });

    res.json({
      success: true,
      message: 'Information request sent successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error requesting more info:', error);
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Failed to request more information' });
  }
});

export default router;
