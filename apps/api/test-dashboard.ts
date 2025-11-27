/**
 * test-dashboard.ts - Dashboard Test Routes
 * 
 * Location: apps/api/ → Testing & Utilities → test-dashboard.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Dashboard test routes for development/testing. Provides:
 * - Dashboard functionality testing
 * - Test endpoints
 * 
 * Related Files:
 * - apps/api/test-admin.ts - Admin test routes
 * - apps/api/test-db.ts - Database test routes
 */

import { Router } from 'express';
import { prisma } from './prismaClient';

const router = Router();

// Test endpoint to verify admin dashboard functionality without authentication
router.get('/test-dashboard', async (req, res) => {
  try {
    // Test database queries that the admin dashboard would use
    const userCount = await prisma.users.count();
    const orgCount = await prisma.organizations.count();
    const analyticsCount = await prisma.analytics_daily_metrics.count();
    
    // Test analytics data
    const analyticsData = await prisma.analytics_daily_metrics.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    // Test organization data
    const organizations = await prisma.organizations.findMany({
      take: 3,
      select: {
        id: true,
        legalName: true,
        tradeName: true,
        status: true
      }
    });

    // Test user data
    const users = await prisma.users.findMany({
      take: 3,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Admin dashboard test successful',
      data: {
        userCount,
        orgCount,
        analyticsCount,
        analyticsData,
        organizations,
        users
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
