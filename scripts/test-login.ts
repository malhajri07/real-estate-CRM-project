import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { login } from '../apps/api/auth';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🧪 Testing login function...\n');
    
    // Test 1: Check if admin user exists
    console.log('Test 1: Checking if admin user exists...');
    const adminUser = await prisma.users.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      isActive: adminUser.isActive,
      roles: adminUser.roles
    });
    
    // Test 2: Test password directly
    console.log('\nTest 2: Testing password directly...');
    const passwordMatch = await bcrypt.compare('admin123', adminUser.passwordHash);
    console.log('Password match:', passwordMatch ? '✅ CORRECT' : '❌ INCORRECT');
    
    // Test 3: Test login function
    console.log('\nTest 3: Testing login function...');
    const result = await login('admin', 'admin123');
    
    console.log('Login result:', {
      success: result.success,
      hasUser: !!result.user,
      hasToken: !!result.token,
      message: result.message
    });
    
    if (result.success) {
      console.log('\n✅ Login function works!');
      console.log('User:', {
        id: result.user?.id,
        username: result.user?.username,
        email: result.user?.email,
        roles: result.user?.roles
      });
    } else {
      console.log('\n❌ Login function failed:', result.message);
    }
    
    // Test 4: Test with lowercase
    console.log('\nTest 4: Testing login with lowercase username...');
    const result2 = await login('ADMIN', 'admin123');
    console.log('Login result (uppercase):', {
      success: result2.success,
      message: result2.message
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

