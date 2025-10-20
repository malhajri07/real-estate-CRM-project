/**
 * routes/analytics.ts - Analytics and KPI API Routes
 * 
 * This file defines all analytics-related API endpoints for the real estate CRM platform.
 * It handles:
 * - KPI data retrieval and calculation
 * - Analytics dashboard data
 * - Performance metrics and reporting
 * - Real-time analytics updates
 * 
 * The routes use Prisma-based storage for database operations and provide
 * comprehensive analytics functionality for the RBAC dashboard.
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
import type { Request, Response } from 'express';
import { storage } from '../../storage-prisma'; // Updated to use Prisma-based storage
import { authenticate } from '../middleware/auth';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../prismaClient';

const router = Router();

interface AnalyticsSnapshot {
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  activeProperties: number;
  totalDeals: number;
  totalLeads: number;
  conversionRate: number;
  avgDealValue: number;
  monthlyGrowth: number;
  userEngagement: number;
  propertyViews: number;
  leadResponseTime: number;
  dealCloseRate: number;
}

const DEFAULT_ANALYTICS: AnalyticsSnapshot = {
  totalUsers: 1250,
  activeUsers: 980,
  totalProperties: 450,
  activeProperties: 380,
  totalDeals: 120,
  totalLeads: 890,
  conversionRate: 13.5,
  avgDealValue: 850000,
  monthlyGrowth: 8.2,
  userEngagement: 72.5,
  propertyViews: 15600,
  leadResponseTime: 2.4,
  dealCloseRate: 15.8,
};

const getMockAnalyticsData = (): AnalyticsSnapshot => DEFAULT_ANALYTICS;

const parsePeriod = (value: unknown): string =>
  typeof value === 'string' && value.trim().length > 0 ? value : 'month';

// Apply authentication to all analytics routes
router.use(authenticate);

/**
 * getAnalyticsData - Get real analytics data from database
 * 
 * Retrieves analytics data from the database using Prisma storage.
 * This replaces the mock data with real database queries.
 * 
 * Dependencies: storage.getAllUsers(), storage.getAllProperties(), storage.getAllLeads()
 * Routes affected: Analytics dashboard, KPI displays
 * Pages affected: RBAC dashboard, analytics dashboard
 */
const getAnalyticsData = async () => {
  try {
    // Get real data from database
    const [users, properties, leads] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllProperties(),
      storage.getAllLeads(),
    ]);

    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive !== false).length,
      totalProperties: properties.length,
      activeProperties: properties.filter(p => p.status === 'ACTIVE').length,
      totalDeals: 0, // TODO: Implement deals tracking
      totalLeads: leads.length,
      conversionRate: 13.5, // TODO: Calculate from real data
      avgDealValue: 850000, // TODO: Calculate from real data
      monthlyGrowth: 8.2, // TODO: Calculate from real data
      userEngagement: 72.5, // TODO: Calculate from real data
      propertyViews: 15600, // TODO: Calculate from real data
      leadResponseTime: 2.4, // TODO: Calculate from real data
      dealCloseRate: 15.8 // TODO: Calculate from real data
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    // Fallback to mock data if database query fails
    return DEFAULT_ANALYTICS;
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

// Get overview analytics
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const period = parsePeriod(req.query?.period);
    const dateRange = getDateRange(period);

    // Get real analytics data from database
    const mockData = await getAnalyticsData();
    
    // Calculate totals from mock data
    const totalUsers = mockData.totalUsers;
    const activeUsers = mockData.activeUsers;
    const totalProperties = mockData.totalProperties;
    const totalLeads = mockData.totalLeads;
    const totalDeals = mockData.totalDeals;

    // Calculate revenue from mock data
    const totalRevenue = mockData.totalDeals * mockData.avgDealValue;
    const averageTransactionValue = mockData.avgDealValue;

    // Use mock growth data
    const userGrowth = mockData.monthlyGrowth;
    const propertyGrowth = mockData.monthlyGrowth * 0.8;
    const revenueGrowth = mockData.monthlyGrowth * 1.2;

    res.json({
      period,
      dateRange,
      totalUsers,
      activeUsers,
      totalProperties,
      totalListings: totalProperties, // Same as properties for now
      totalTransactions: totalDeals,
      totalRevenue,
      userGrowth,
      propertyGrowth,
      revenueGrowth,
      averageTransactionValue
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({ error: 'Failed to fetch overview analytics' });
  }
});

// Get user statistics
router.get('/users', async (req: Request, res: Response) => {
  try {
    const period = parsePeriod(req.query?.period);

    // Get all leads (using as users for now)
    const allLeads = await storage.getAllLeads();

    // Mock user role data for now
    const byRole = {
      'BUYER': 45,
      'INDIV_AGENT': 12,
      'CORP_OWNER': 8,
      'WEBSITE_ADMIN': 2
    };

    // Calculate status data
    const activeUsers = allLeads.filter((lead: any) => lead.status !== 'inactive').length;
    const inactiveUsers = allLeads.filter((lead: any) => lead.status === 'inactive').length;

    // Mock new user data
    const newUsersThisMonth = 15;
    const newUsersLastMonth = 12;

    res.json({
      period,
      byRole,
      byStatus: {
        active: activeUsers,
        inactive: inactiveUsers
      },
      newUsersThisMonth,
      newUsersLastMonth
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get property statistics
router.get('/properties', async (_req: Request, res: Response) => {
  try {
    // const storage = await getStorage(); // Temporarily disabled
    const allProperties = await storage.getAllProperties();

    // Calculate properties by type
    const byType: Record<string, number> = {};
    allProperties.forEach((prop) => {
      const type = prop.propertyType ?? 'غير محدد';
      byType[type] = (byType[type] || 0) + 1;
    });

    // Calculate properties by city
    const byCity: Record<string, number> = {};
    allProperties.forEach((prop) => {
      const city = prop.city ?? 'غير محدد';
      byCity[city] = (byCity[city] || 0) + 1;
    });

    // Calculate properties by status
    const byStatus: Record<string, number> = {};
    allProperties.forEach((prop) => {
      const statusKey = prop.status ?? 'غير محدد';
      byStatus[String(statusKey)] = (byStatus[String(statusKey)] || 0) + 1;
    });

    // Calculate average price
    const totalPrice = allProperties.reduce((sum, prop) => {
      const priceValue = typeof prop.price === 'number' ? prop.price : Number(prop.price ?? 0);
      return sum + priceValue;
    }, 0);
    const averagePrice = allProperties.length > 0 ? totalPrice / allProperties.length : 0;

    // Mock price growth
    const priceGrowth = 5.2;

    res.json({
      byType,
      byCity,
      byStatus,
      averagePrice,
      priceGrowth
    });
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    res.status(500).json({ error: 'Failed to fetch property analytics' });
  }
});

// Get communication statistics
router.get('/communication', async (req: Request, res: Response) => {
  try {
    const period = parsePeriod(req.query?.period);

    // Get all messages
    const allMessages = await storage.getAllMessages();

    // Calculate message statistics
    const whatsappMessages = allMessages.filter((msg: any) => msg.messageType === 'whatsapp').length;
    const smsMessages = allMessages.filter((msg: any) => msg.messageType === 'sms').length;

    // Mock email inquiries (would need actual email tracking)
    const emailsSent = 45;

    // Mock social media shares
    const socialMediaShares = 2345;

    // Mock response rate
    const responseRate = 78.5;

    res.json({
      period,
      whatsappMessages,
      smsSent: smsMessages,
      emailsSent,
      socialMediaShares,
      responseRate
    });
  } catch (error) {
    console.error('Error fetching communication analytics:', error);
    res.status(500).json({ error: 'Failed to fetch communication analytics' });
  }
});

// Get revenue statistics
router.get('/revenue', async (req: Request, res: Response) => {
  try {
    const period = parsePeriod(req.query?.period);

    // Get all deals
    const allDeals = await storage.getAllDeals();

    // Calculate average transaction value
    const totalRevenue = allDeals.reduce((sum, deal) => {
      const value = typeof deal.dealValue === 'number' ? deal.dealValue : Number(deal.dealValue ?? 0);
      return sum + value;
    }, 0);
    const averageTransactionValue = allDeals.length > 0 ? totalRevenue / allDeals.length : 0;

    // Mock monthly revenue data for the last 6 months
    const monthly = [
      { month: '2024-01', revenue: 125000 },
      { month: '2024-02', revenue: 142000 },
      { month: '2024-03', revenue: 138000 },
      { month: '2024-04', revenue: 156000 },
      { month: '2024-05', revenue: 168000 },
      { month: '2024-06', revenue: 175000 }
    ];

    // Mock revenue by source
    const bySource = {
      'عمولات البيع': 65,
      'عمولات الإيجار': 25,
      'خدمات إضافية': 10
    };

    res.json({
      period,
      monthly,
      bySource,
      averageTransactionValue
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get comprehensive analytics (all data in one call)
router.get('/comprehensive', async (req: Request, res: Response) => {
  try {
    const period = parsePeriod(req.query?.period);
    const mockData = getMockAnalyticsData();
    const [allProperties, allMessages, allDeals] = await Promise.all([
      storage.getAllProperties(),
      storage.getAllMessages(),
      storage.getAllDeals(),
    ]);

    // Use mock data
    const totalUsers = mockData.totalUsers;
    const activeUsers = mockData.activeUsers;
    const totalProperties = mockData.totalProperties;
    const totalDeals = mockData.totalDeals;
    const totalRevenue = mockData.totalDeals * mockData.avgDealValue;
    const averageTransactionValue = mockData.avgDealValue;

    const overview = {
      totalUsers,
      activeUsers,
      totalProperties,
      totalListings: totalProperties,
      totalTransactions: totalDeals,
      totalRevenue,
      userGrowth: 12.5,
      propertyGrowth: 8.3,
      revenueGrowth: 15.7,
      averageTransactionValue
    };

    // Calculate user stats
    const userStats = {
      byRole: {
        'BUYER': 45,
        'INDIV_AGENT': 12,
        'CORP_OWNER': 8,
        'WEBSITE_ADMIN': 2
      },
      byStatus: {
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      newUsersThisMonth: 15,
      newUsersLastMonth: 12
    };

    // Calculate property stats
    const propertyStats = (() => {
      const byType: Record<string, number> = {};
      const byCity: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      allProperties.forEach((prop) => {
        const type = prop.propertyType ?? 'غير محدد';
        const city = prop.city ?? 'غير محدد';
        const status = prop.status ?? 'غير محدد';

        byType[type] = (byType[type] || 0) + 1;
        byCity[city] = (byCity[city] || 0) + 1;
        byStatus[String(status)] = (byStatus[String(status)] || 0) + 1;
      });

      const totalPrice = allProperties.reduce((sum, prop) => {
        const priceValue = typeof prop.price === 'number' ? prop.price : Number(prop.price ?? 0);
        return sum + priceValue;
      }, 0);

      const averagePrice = allProperties.length > 0 ? totalPrice / allProperties.length : 0;

      return {
        byType,
        byCity,
        byStatus,
        averagePrice,
        priceGrowth: 5.2,
      };
    })();

    const communicationStats = (() => {
      const whatsappMessages = allMessages.filter((msg: { messageType?: string }) => msg.messageType === 'whatsapp').length;
      const smsMessages = allMessages.filter((msg: { messageType?: string }) => msg.messageType === 'sms').length;

      return {
        whatsappMessages,
        smsSent: smsMessages,
        emailsSent: 45,
        socialMediaShares: 2345,
        responseRate: 78.5,
      };
    })();

    // Calculate revenue stats
    const monthly = [
      { month: '2024-01', revenue: 125000 },
      { month: '2024-02', revenue: 142000 },
      { month: '2024-03', revenue: 138000 },
      { month: '2024-04', revenue: 156000 },
      { month: '2024-05', revenue: 168000 },
      { month: '2024-06', revenue: 175000 }
    ];

    const revenueStats = {
      monthly,
      bySource: {
        'عمولات البيع': 65,
        'عمولات الإيجار': 25,
        'خدمات إضافية': 10
      },
      averageTransactionValue
    };

    res.json({
      period,
      overview,
      userStats,
      propertyStats,
      communicationStats,
      revenueStats
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
