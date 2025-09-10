import { Router } from 'express';
import { db } from '../../db';
import { users, properties, leads, deals, activities, messages, propertyInquiries, realEstateRequests } from '../../../shared/schema';
import { sql, count, sum, avg, desc, eq, gte, and } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all analytics routes
router.use(authenticate);

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
router.get('/overview', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    // Get total counts
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [activeUsers] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [totalProperties] = await db.select({ count: count() }).from(properties);
    const [totalLeads] = await db.select({ count: count() }).from(leads);
    const [totalDeals] = await db.select({ count: count() }).from(deals);

    // Get revenue data
    const [revenueData] = await db.select({ 
      totalRevenue: sum(deals.dealValue),
      avgTransactionValue: avg(deals.dealValue)
    }).from(deals);

    // Get growth data (comparing with previous period)
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    
    const [currentPeriodUsers] = await db.select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, startDate), gte(endDate, users.createdAt)));
    
    const [previousPeriodUsers] = await db.select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, previousStartDate), gte(startDate, users.createdAt)));

    const [currentPeriodProperties] = await db.select({ count: count() })
      .from(properties)
      .where(and(gte(properties.createdAt, startDate), gte(endDate, properties.createdAt)));
    
    const [previousPeriodProperties] = await db.select({ count: count() })
      .from(properties)
      .where(and(gte(properties.createdAt, previousStartDate), gte(startDate, properties.createdAt)));

    // Calculate growth percentages
    const userGrowth = previousPeriodUsers.count > 0 
      ? ((currentPeriodUsers.count - previousPeriodUsers.count) / previousPeriodUsers.count) * 100 
      : 0;
    
    const propertyGrowth = previousPeriodProperties.count > 0 
      ? ((currentPeriodProperties.count - previousPeriodProperties.count) / previousPeriodProperties.count) * 100 
      : 0;

    // Mock revenue growth for now (would need historical revenue data)
    const revenueGrowth = 15.7;

    res.json({
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      totalProperties: totalProperties.count,
      totalListings: totalProperties.count, // Same as properties for now
      totalTransactions: totalDeals.count,
      totalRevenue: revenueData.totalRevenue || 0,
      userGrowth: Math.round(userGrowth * 10) / 10,
      propertyGrowth: Math.round(propertyGrowth * 10) / 10,
      revenueGrowth,
      averageTransactionValue: revenueData.avgTransactionValue || 0
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({ error: 'Failed to fetch overview analytics' });
  }
});

// Get user statistics
router.get('/users', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    // Get users by account type
    const usersByRole = await db.select({
      accountType: users.accountType,
      count: count()
    }).from(users)
    .groupBy(users.accountType);

    // Get users by status
    const [activeUsers] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [inactiveUsers] = await db.select({ count: count() }).from(users).where(eq(users.isActive, false));

    // Get new users this period
    const [newUsersThisPeriod] = await db.select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, startDate), gte(endDate, users.createdAt)));

    // Get new users previous period for comparison
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const [newUsersLastPeriod] = await db.select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, previousStartDate), gte(startDate, users.createdAt)));

    // Transform role data to match frontend expectations
    const roleMapping: Record<string, string> = {
      'customer': 'BUYER',
      'individual_broker': 'INDIV_AGENT',
      'corporate_company': 'CORP_OWNER',
      'platform_admin': 'WEBSITE_ADMIN'
    };

    const byRole: Record<string, number> = {};
    usersByRole.forEach(user => {
      const role = roleMapping[user.accountType] || user.accountType;
      byRole[role] = user.count;
    });

    res.json({
      byRole,
      byStatus: {
        active: activeUsers.count,
        inactive: inactiveUsers.count
      },
      newUsersThisMonth: newUsersThisPeriod.count,
      newUsersLastMonth: newUsersLastPeriod.count
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Get property statistics
router.get('/properties', async (req, res) => {
  try {
    // Get properties by type
    const propertiesByType = await db.select({
      propertyType: properties.propertyType,
      count: count()
    }).from(properties)
    .groupBy(properties.propertyType);

    // Get properties by city
    const propertiesByCity = await db.select({
      city: properties.city,
      count: count()
    }).from(properties)
    .groupBy(properties.city)
    .orderBy(desc(count()))
    .limit(10);

    // Get properties by status
    const propertiesByStatus = await db.select({
      status: properties.status,
      count: count()
    }).from(properties)
    .groupBy(properties.status);

    // Get average price
    const [priceData] = await db.select({
      averagePrice: avg(properties.price)
    }).from(properties);

    // Mock price growth (would need historical data)
    const priceGrowth = 5.2;

    // Transform data to match frontend expectations
    const byType: Record<string, number> = {};
    propertiesByType.forEach(prop => {
      byType[prop.propertyType] = prop.count;
    });

    const byCity: Record<string, number> = {};
    propertiesByCity.forEach(prop => {
      byCity[prop.city] = prop.count;
    });

    const byStatus: Record<string, number> = {};
    propertiesByStatus.forEach(prop => {
      byStatus[prop.status] = prop.count;
    });

    res.json({
      byType,
      byCity,
      byStatus,
      averagePrice: priceData.averagePrice || 0,
      priceGrowth
    });
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    res.status(500).json({ error: 'Failed to fetch property analytics' });
  }
});

// Get communication statistics
router.get('/communication', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    // Get message statistics
    const [whatsappMessages] = await db.select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.messageType, 'whatsapp'),
        gte(messages.createdAt, startDate),
        gte(endDate, messages.createdAt)
      ));

    const [smsMessages] = await db.select({ count: count() })
      .from(messages)
      .where(and(
        eq(messages.messageType, 'sms'),
        gte(messages.createdAt, startDate),
        gte(endDate, messages.createdAt)
      ));

    // Get email inquiries (property inquiries)
    const [emailInquiries] = await db.select({ count: count() })
      .from(propertyInquiries)
      .where(and(
        gte(propertyInquiries.createdAt, startDate),
        gte(endDate, propertyInquiries.createdAt)
      ));

    // Mock social media shares (would need actual social media integration)
    const socialMediaShares = 2345;

    // Mock response rate (would need actual response tracking)
    const responseRate = 78.5;

    res.json({
      whatsappMessages: whatsappMessages.count,
      smsSent: smsMessages.count,
      emailsSent: emailInquiries.count,
      socialMediaShares,
      responseRate
    });
  } catch (error) {
    console.error('Error fetching communication analytics:', error);
    res.status(500).json({ error: 'Failed to fetch communication analytics' });
  }
});

// Get revenue statistics
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const { startDate, endDate } = getDateRange(period as string);

    // Get monthly revenue for the last 6 months
    const monthlyRevenue = await db.select({
      month: sql<string>`TO_CHAR(${deals.createdAt}, 'YYYY-MM')`,
      revenue: sum(deals.dealValue)
    }).from(deals)
    .where(gte(deals.createdAt, new Date(endDate.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)))
    .groupBy(sql`TO_CHAR(${deals.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${deals.createdAt}, 'YYYY-MM')`);

    // Get average transaction value
    const [avgTransactionData] = await db.select({
      averageTransactionValue: avg(deals.dealValue)
    }).from(deals);

    // Mock revenue by source (would need actual source tracking)
    const bySource = {
      'عمولات البيع': 65,
      'عمولات الإيجار': 25,
      'خدمات إضافية': 10
    };

    // Transform monthly data to match frontend expectations
    const monthly = monthlyRevenue.map(item => ({
      month: item.month,
      revenue: item.revenue || 0
    }));

    res.json({
      monthly,
      bySource,
      averageTransactionValue: avgTransactionData.averageTransactionValue || 0
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get comprehensive analytics (all data in one call)
router.get('/comprehensive', async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Fetch all analytics data in parallel
    const [overview, users, properties, communication, revenue] = await Promise.all([
      fetch(`${req.protocol}://${req.get('host')}/api/analytics/overview?period=${period}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/analytics/users?period=${period}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/analytics/properties?period=${period}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/analytics/communication?period=${period}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/analytics/revenue?period=${period}`).then(r => r.json())
    ]);

    res.json({
      overview,
      userStats: users,
      propertyStats: properties,
      communicationStats: communication,
      revenueStats: revenue
    });
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({ error: 'Failed to fetch comprehensive analytics' });
  }
});

export default router;
