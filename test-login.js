const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function testLogin() {
  try {
    console.log('🧪 Testing login function directly...');
    
    const prisma = new PrismaClient();
    
    // Test user lookup
    const user = await prisma.users.findUnique({
      where: { username: 'admin' },
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        isActive: true,
        approvalStatus: true,
        roles: true,
        firstName: true,
        lastName: true,
        organizationId: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      username: user.username,
      isActive: user.isActive,
      approvalStatus: user.approvalStatus
    });
    
    // Test password
    const isValidPassword = await bcrypt.compare('admin123', user.passwordHash);
    console.log('🔍 Password check:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Password is invalid');
      return;
    }
    
    // Test JWT generation
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      organizationId: user.organizationId
    };
    
    console.log('🔍 JWT payload:', payload);
    
    // Use a simple secret for testing
    const secret = 'test-jwt-secret-key';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });
    console.log('✅ JWT token generated:', token.substring(0, 50) + '...');
    
    // Test token verification
    const decoded = jwt.verify(token, secret);
    console.log('✅ JWT token verified:', decoded);
    
    console.log('🎉 Login test successful!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLogin();
