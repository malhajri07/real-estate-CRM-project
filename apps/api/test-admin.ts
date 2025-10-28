import { Router } from 'express';
import { prisma } from './prismaClient';

const router = Router();

// Test endpoint to verify admin functionality without authentication
router.get('/test-dashboard', async (req, res) => {
  try {
    // Test database queries
    const userCount = await prisma.users.count();
    const orgCount = await prisma.organizations.count();
    const analyticsCount = await prisma.analytics_daily_metrics.count();
    
    // Test analytics data
    const analyticsData = await prisma.analytics_daily_metrics.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      message: 'Admin dashboard test successful',
      data: {
        userCount,
        orgCount,
        analyticsCount,
        analyticsData
      }
    });
  } catch (error) {
    console.error('Test dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Test dashboard failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
