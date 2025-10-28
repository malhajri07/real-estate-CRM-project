import { Router } from 'express';
import { prisma } from './prismaClient';
import { authenticate } from './src/middleware/auth';

const router = Router();

// Apply authentication to all analytics routes
router.use(authenticate);

// Simple analytics endpoint for testing
router.get('/simple', async (req, res) => {
  try {
    const userCount = await prisma.users.count();
    const orgCount = await prisma.organizations.count();
    const propertyCount = await prisma.properties.count();
    const leadCount = await prisma.leads.count();
    const claimCount = await prisma.claims.count();
    
    res.json({
      success: true,
      data: {
        userCount,
        orgCount,
        propertyCount,
        leadCount,
        claimCount
      }
    });
  } catch (error) {
    console.error('Simple analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Simple analytics failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
