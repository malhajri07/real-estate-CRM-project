/**
 * analytics.ts - Analytics and KPI API Routes
 * 
 * Location: apps/api/ → Source/ → routes/ → analytics.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Analytics and KPI API routes. Handles:
 * - KPI data retrieval and calculation
 * - Analytics dashboard data
 * - Performance metrics and reporting
 * - Real-time analytics updates
 * 
 * API Endpoints:
 * - GET /api/analytics/overview - Overview analytics
 * - GET /api/analytics/comprehensive - Comprehensive analytics
 * - GET /api/analytics/kpis - KPI data
 * 
 * Related Files:
 * - apps/web/src/pages/admin/enhanced-dashboard.tsx - Uses analytics data
 * - apps/web/src/hooks/useDashboardData.ts - Dashboard data hook
 * 
 * Dependencies:
 * - Express.js Router for route handling
 * - Prisma-based storage for database operations
 * - Authentication middleware for security
 * 
 * API Endpoints:
 * - GET /api/analytics/overview - Get overview analytics
 * - GET /api/analytics/comprehensive - Get comprehensive analytics
 * - GET /api/analytics/kpis - Get KPI data
 * - GET /api/analytics/performance - Get performance metrics
 * 
 * Routes affected: Analytics dashboard, KPI displays
 * Pages affected: RBAC dashboard, analytics dashboard, admin panel
 */

import { Router } from 'express';
import { storage } from '../../storage-prisma'; // Updated to use Prisma-based storage
import { authenticate } from '../middleware/auth';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../prismaClient';


const router = Router();

// Apply authentication to all analytics routes
router.use(authenticate);

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

const calculatePercentChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return roundToOneDecimal(((current - previous) / previous) * 100);
};

const parseRoles = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.filter((role): role is string => typeof role === 'string');
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((role): role is string => typeof role === 'string');
      }
    } catch {}
    return raw ? [raw] : [];
  }
  return [];
};

const toNumber = (value: any): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getAnalyticsData = async () => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalProperties,
      activeProperties,
      totalLeads,
      wonDealsAggregate,
      totalDealsCount,
      currentMonthWonDeals,
      previousMonthWonDeals,
      newUsersThisMonth,
      newUsersLastMonth,
      newPropertiesThisMonth,
      newPropertiesLastMonth,
      revenueThisMonthAggregate,
      revenueLastMonthAggregate,
      engagedUsers,
      propertyViewCount,
      firstContactByLead,
      leadsWithContact,
      leadsWithCreation,
      totalListings,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { isActive: true } }),
      prisma.properties.count(),
      prisma.properties.count({ where: { status: 'ACTIVE' as any } }),
      prisma.leads.count(),
      // Use claims table instead of deals table
      prisma.claims.aggregate({
        where: { status: 'ACTIVE' as any },
        _count: { _all: true },
      }),
      prisma.claims.count(),
      prisma.claims.count({
        where: {
          status: 'ACTIVE' as any,
          createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth },
        },
      }),
      prisma.claims.count({
        where: {
          status: 'ACTIVE' as any,
          createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
        },
      }),
      prisma.users.count({
        where: { createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth } },
      }),
      prisma.users.count({
        where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } },
      }),
      prisma.properties.count({
        where: { createdAt: { gte: startOfCurrentMonth, lt: startOfNextMonth } },
      }),
      prisma.properties.count({
        where: { createdAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth } },
      }),
      prisma.deals.aggregate({
        where: {
          stage: 'WON' as any,
          wonAt: { gte: startOfCurrentMonth, lt: startOfNextMonth },
        },
        _sum: { agreedPrice: true },
      }),
      prisma.deals.aggregate({
        where: {
          stage: 'WON' as any,
          wonAt: { gte: startOfPreviousMonth, lt: startOfCurrentMonth },
        },
        _sum: { agreedPrice: true },
      }),
      prisma.analytics_event_logs.findMany({
        where: {
          userId: { not: null },
          occurredAt: { gte: thirtyDaysAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.analytics_event_logs.count({
        where: {
          eventName: 'PROPERTY_VIEW',
          occurredAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.contact_logs.groupBy({
        by: ['leadId'],
        _min: { contactedAt: true },
      }),
      prisma.contact_logs.findMany({
        distinct: ['leadId'],
        select: { leadId: true },
      }),
      prisma.leads.findMany({
        select: { id: true, createdAt: true },
      }),
      prisma.listings.count(),
    ]);

    const wonDeals = wonDealsAggregate._count?._all ?? 0;
    const totalRevenue = toNumber(wonDealsAggregate._sum?.agreedPrice ?? 0);
    const avgDealValueRaw = wonDealsAggregate._avg?.agreedPrice;
    const avgDealValue = avgDealValueRaw ? toNumber(avgDealValueRaw) : 0;

    const leadCreatedAtMap = new Map(
      leadsWithCreation.map((lead) => [lead.id, lead.createdAt])
    );

    const responseDurations = firstContactByLead
      .map((record) => {
        const createdAt = leadCreatedAtMap.get(record.leadId);
        const contactedAt = record._min?.contactedAt;
        if (!createdAt || !contactedAt) {
          return null;
        }
        const diffHours = (contactedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return diffHours >= 0 ? diffHours : null;
      })
      .filter((value): value is number => value !== null);

    const leadResponseTime = responseDurations.length
      ? roundToOneDecimal(
          responseDurations.reduce((sum, value) => sum + value, 0) / responseDurations.length
        )
      : 0;

    const leadsWithContactCount = leadsWithContact.filter((entry) => !!entry.leadId).length;
    const revenueThisMonth = toNumber(revenueThisMonthAggregate._sum?.agreedPrice ?? 0);
    const revenueLastMonth = toNumber(revenueLastMonthAggregate._sum?.agreedPrice ?? 0);

    return {
      totalUsers,
      activeUsers,
      totalProperties,
      activeProperties,
      totalListings,
      totalLeads,
      totalDeals: wonDeals,
      totalRevenue,
      conversionRate: totalLeads > 0 ? roundToOneDecimal((wonDeals / totalLeads) * 100) : 0,
      avgDealValue,
      monthlyGrowth: calculatePercentChange(currentMonthWonDeals, previousMonthWonDeals),
      userGrowth: calculatePercentChange(newUsersThisMonth, newUsersLastMonth),
      propertyGrowth: calculatePercentChange(newPropertiesThisMonth, newPropertiesLastMonth),
      revenueGrowth: calculatePercentChange(revenueThisMonth, revenueLastMonth),
      userEngagement:
        activeUsers > 0
          ? roundToOneDecimal(Math.min(100, (engagedUsers.length / activeUsers) * 100))
          : 0,
      propertyViews: propertyViewCount,
      leadResponseTime,
      dealCloseRate: totalDealsCount > 0 ? roundToOneDecimal((wonDeals / totalDealsCount) * 100) : 0,
      leadsWithContactCount,
      newUsersThisMonth,
      newUsersLastMonth,
      newPropertiesThisMonth,
      newPropertiesLastMonth,
      revenueThisMonth,
      revenueLastMonth,
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalProperties: 0,
      activeProperties: 0,
      totalListings: 0,
      totalLeads: 0,
      totalDeals: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgDealValue: 0,
      monthlyGrowth: 0,
      userGrowth: 0,
      propertyGrowth: 0,
      revenueGrowth: 0,
      userEngagement: 0,
      propertyViews: 0,
      leadResponseTime: 0,
      dealCloseRate: 0,
      leadsWithContactCount: 0,
      newUsersThisMonth: 0,
      newUsersLastMonth: 0,
      newPropertiesThisMonth: 0,
      newPropertiesLastMonth: 0,
      revenueThisMonth: 0,
      revenueLastMonth: 0,
    };
  }
};

// Helper function to get date range based on period
const getDateRange = (period: string) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate: now };
};

const buildMonthlyRevenue = async (months = 6) => {
  const results: Array<{ month: string; revenue: number }> = [];
  const now = new Date();

  for (let index = months - 1; index >= 0; index -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - index + 1, 1);
    const aggregate = await prisma.deals.aggregate({
      where: {
        stage: 'WON' as any,
        wonAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { agreedPrice: true },
    });

    results.push({
      month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
      revenue: toNumber(aggregate._sum?.agreedPrice ?? 0),
    });
  }

  return results;
};

// Get overview analytics
router.get('/overview', async (_req, res) => {
  try {
    const analytics = await getAnalyticsData();

    res.json({
      totalUsers: analytics.totalUsers,
      activeUsers: analytics.activeUsers,
      totalProperties: analytics.totalProperties,
      totalListings: analytics.totalListings,
      totalTransactions: analytics.totalDeals,
      totalRevenue: analytics.totalRevenue,
      userGrowth: analytics.userGrowth,
      propertyGrowth: analytics.propertyGrowth,
      revenueGrowth: analytics.revenueGrowth,
      averageTransactionValue: analytics.avgDealValue
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({ error: 'Failed to fetch overview analytics' });
  }
});

// Get user statistics
router.get('/users', async (_req, res) => {
  try {
    const analytics = await getAnalyticsData();
    const users = await storage.getAllUsers();

    const byRole: Record<string, number> = {};
    users.forEach((user: any) => {
      const roles = parseRoles(user.roles);
      if (!roles.length) {
        byRole['UNSPECIFIED'] = (byRole['UNSPECIFIED'] || 0) + 1;
      } else {
        roles.forEach((role) => {
          byRole[role] = (byRole[role] || 0) + 1;
        });
      }
    });

    res.json({
      byRole,
      byStatus: {
        active: analytics.activeUsers,
        inactive: Math.max(analytics.totalUsers - analytics.activeUsers, 0)
      },
      newUsersThisMonth: analytics.newUsersThisMonth,
      newUsersLastMonth: analytics.newUsersLastMonth
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get property statistics
router.get('/properties', async (_req, res) => {
  try {
    const analytics = await getAnalyticsData();
    const properties = await storage.getAllProperties();

    const byType: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    properties.forEach((property: any) => {
      const type = property.propertyType || property.type || 'غير محدد';
      const city = property.city || 'غير محدد';
      const status = property.status || 'غير محدد';

      byType[type] = (byType[type] || 0) + 1;
      byCity[city] = (byCity[city] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    const totalPrice = properties.reduce((sum: number, property: any) => {
      return sum + toNumber(property.price);
    }, 0);

    const averagePrice = properties.length ? totalPrice / properties.length : 0;

    res.json({
      byType,
      byCity,
      byStatus,
      averagePrice,
      priceGrowth: analytics.propertyGrowth
    });
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    res.status(500).json({ error: 'Failed to fetch property analytics' });
  }
});

// Get communication statistics
router.get('/communication', async (_req, res) => {
  try {
    const analytics = await getAnalyticsData();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const channelGroups = await prisma.contact_logs.groupBy({
      by: ['channel'],
      _count: { _all: true },
    });

    const whatsappMessages = channelGroups.find((group) => group.channel === 'WHATSAPP')?._count._all ?? 0;
    const smsMessages = channelGroups.find((group) => group.channel === 'SMS')?._count._all ?? 0;
    const emailMessages = channelGroups.find((group) => group.channel === 'EMAIL')?._count._all ?? 0;

    const socialMediaShares = await prisma.analytics_event_logs.count({
      where: {
        eventName: 'SOCIAL_SHARE',
        occurredAt: { gte: thirtyDaysAgo },
      },
    });

    const responseRate = analytics.totalLeads > 0
      ? roundToOneDecimal((analytics.leadsWithContactCount / analytics.totalLeads) * 100)
      : 0;

    res.json({
      whatsappMessages,
      smsSent: smsMessages,
      emailsSent: emailMessages,
      socialMediaShares,
      responseRate
    });
  } catch (error) {
    console.error('Error fetching communication analytics:', error);
    res.status(500).json({ error: 'Failed to fetch communication analytics' });
  }
});

// Get revenue statistics
router.get('/revenue', async (_req, res) => {
  try {
    const analytics = await getAnalyticsData();
    const monthly = await buildMonthlyRevenue();

    const groupedBySource = await prisma.deals.groupBy({
      by: ['source'],
      where: { stage: 'WON' as any },
      _count: { _all: true },
    });

    const totalBySource = groupedBySource.reduce((sum, entry) => sum + entry._count._all, 0);
    const bySource: Record<string, number> = {};

    groupedBySource.forEach((entry) => {
      const key = entry.source || 'غير محدد';
      const share = totalBySource ? roundToOneDecimal((entry._count._all / totalBySource) * 100) : 0;
      bySource[key] = share;
    });

    res.json({
      monthly,
      bySource,
      averageTransactionValue: analytics.avgDealValue
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get comprehensive analytics (all data in one call)
router.get('/comprehensive', async (_req, res) => {
  try {
    const analytics = await getAnalyticsData();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      users,
      properties,
      channelGroups,
      monthlyRevenue,
      groupedBySource,
      socialMediaShares
    ] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllProperties(),
      prisma.contact_logs.groupBy({
        by: ['channel'],
        _count: { _all: true },
      }),
      buildMonthlyRevenue(),
      prisma.deals.groupBy({
        by: ['source'],
        where: { stage: 'WON' as any },
        _count: { _all: true },
      }),
      prisma.analytics_event_logs.count({
        where: {
          eventName: 'SOCIAL_SHARE',
          occurredAt: { gte: thirtyDaysAgo },
        },
      })
    ]);

    const byRole: Record<string, number> = {};
    users.forEach((user: any) => {
      const roles = parseRoles(user.roles);
      if (!roles.length) {
        byRole['UNSPECIFIED'] = (byRole['UNSPECIFIED'] || 0) + 1;
      } else {
        roles.forEach((role) => {
          byRole[role] = (byRole[role] || 0) + 1;
        });
      }
    });

    const byType: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    properties.forEach((property: any) => {
      const type = property.propertyType || property.type || 'غير محدد';
      const city = property.city || 'غير محدد';
      const status = property.status || 'غير محدد';

      byType[type] = (byType[type] || 0) + 1;
      byCity[city] = (byCity[city] || 0) + 1;
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    const totalPrice = properties.reduce((sum: number, property: any) => sum + toNumber(property.price), 0);
    const averagePrice = properties.length ? totalPrice / properties.length : 0;

    const whatsappMessages = channelGroups.find((group) => group.channel === 'WHATSAPP')?._count._all ?? 0;
    const smsMessages = channelGroups.find((group) => group.channel === 'SMS')?._count._all ?? 0;
    const emailMessages = channelGroups.find((group) => group.channel === 'EMAIL')?._count._all ?? 0;

    const totalBySource = groupedBySource.reduce((sum, entry) => sum + entry._count._all, 0);
    const revenueBySource: Record<string, number> = {};
    groupedBySource.forEach((entry) => {
      const key = entry.source || 'غير محدد';
      const share = totalBySource ? roundToOneDecimal((entry._count._all / totalBySource) * 100) : 0;
      revenueBySource[key] = share;
    });

    res.json({
      overview: {
        totalUsers: analytics.totalUsers,
        activeUsers: analytics.activeUsers,
        totalProperties: analytics.totalProperties,
        totalListings: analytics.totalListings,
        totalTransactions: analytics.totalDeals,
        totalRevenue: analytics.totalRevenue,
        userGrowth: analytics.userGrowth,
        propertyGrowth: analytics.propertyGrowth,
        revenueGrowth: analytics.revenueGrowth,
        averageTransactionValue: analytics.avgDealValue
      },
      userStats: {
        byRole,
        byStatus: {
          active: analytics.activeUsers,
          inactive: Math.max(analytics.totalUsers - analytics.activeUsers, 0)
        },
        newUsersThisMonth: analytics.newUsersThisMonth,
        newUsersLastMonth: analytics.newUsersLastMonth
      },
      propertyStats: {
        byType,
        byCity,
        byStatus,
        averagePrice,
        priceGrowth: analytics.propertyGrowth
      },
      communicationStats: {
        whatsappMessages,
        smsSent: smsMessages,
        emailsSent: emailMessages,
        socialMediaShares,
        responseRate: analytics.totalLeads > 0
          ? roundToOneDecimal((analytics.leadsWithContactCount / analytics.totalLeads) * 100)
          : 0
      },
      revenueStats: {
        monthly: monthlyRevenue,
        bySource: revenueBySource,
        averageTransactionValue: analytics.avgDealValue
      }
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive analytics' });
  }
});

export default router;

/**
 * System/Performance analytics
 * 
 * GET /api/analytics/performance
 * Returns OS, process, DB file size, and selected entity counts to surface
 * real system status in the dashboard.
 */
router.get('/performance', async (req, res) => {
  try {
    // OS/Process
    const load = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuCount = os.cpus()?.length || 0;
    const uptimeSec = os.uptime();
    const proc = process.memoryUsage();

    // DB file size (SQLite dev)
    const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
    let dbSizeBytes = 0;
    try {
      const st = fs.statSync(dbPath);
      dbSizeBytes = st.size;
    } catch {}

    // Counts (quick, using Prisma & storage)
    const [users, props, leads, orgPending, agentPending, activeClaims] = await Promise.all([
      prisma.users.count(),
      prisma.properties.count(),
      prisma.leads.count(),
      prisma.organizations.count({ where: { status: 'PENDING_VERIFICATION' as any } }),
      prisma.agent_profiles.count({ where: { status: 'PENDING_VERIFICATION' as any } }),
      prisma.claims.count({ where: { status: 'ACTIVE' as any } })
    ]);

    // Password flag: count hashes that look suspiciously short (< 20)
    const weakPasswordHashes = (await prisma.users.findMany({ select: { passwordHash: true } }))
      .filter(u => !u.passwordHash || u.passwordHash.length < 20).length;

    res.json({
      os: {
        loadAvg: { '1m': load[0], '5m': load[1], '15m': load[2] },
        totalMem,
        freeMem,
        usedMem,
        cpuCount,
        uptimeSec,
        platform: process.platform,
        nodeVersion: process.version,
      },
      process: {
        pid: process.pid,
        uptimeSec: process.uptime(),
        rss: proc.rss,
        heapUsed: proc.heapUsed,
        heapTotal: proc.heapTotal,
        external: (proc as any).external,
      },
      db: {
        path: dbPath,
        sizeBytes: dbSizeBytes,
      },
      counts: {
        users,
        properties: props,
        leads,
        organizationsPendingVerification: orgPending,
        agentsPendingVerification: agentPending,
        activeClaims,
        weakPasswordHashes,
      }
    });
  } catch (error) {
    console.error('Error fetching system performance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
});
