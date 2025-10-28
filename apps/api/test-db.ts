import { Router } from 'express';
import { prisma } from './prismaClient';

const router = Router();

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    // Test basic database connection
    const userCount = await prisma.users.count();
    const orgCount = await prisma.organizations.count();
    
    // Test user lookup
    const testUser = await prisma.users.findUnique({
      where: { username: 'testadmin' }
    });

    res.json({
      success: true,
      message: 'Database connection successful',
      data: {
        userCount,
        orgCount,
        testUser: testUser ? {
          id: testUser.id,
          username: testUser.username,
          email: testUser.email,
          isActive: testUser.isActive,
          roles: testUser.roles
        } : null
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
