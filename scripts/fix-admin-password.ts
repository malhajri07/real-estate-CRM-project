import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    console.log('🔍 Checking admin user...');
    
    // Check if admin user exists
    const adminUser = await prisma.users.findUnique({
      where: { username: 'admin' }
    });

    if (!adminUser) {
      console.log('❌ admin user not found');
      return;
    }

    console.log('✅ admin user found:', {
      id: adminUser.id,
      username: adminUser.username,
      roles: adminUser.roles,
      isActive: adminUser.isActive,
      email: adminUser.email
    });
    
    // Update password to admin123
    console.log('🔐 Updating password to "admin123"...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await prisma.users.update({
      where: { username: 'admin' },
      data: { 
        passwordHash: hashedPassword,
        isActive: true
      }
    });
    
    // Verify password
    const updatedUser = await prisma.users.findUnique({
      where: { username: 'admin' }
    });
    
    if (updatedUser) {
      const passwordMatch = await bcrypt.compare('admin123', updatedUser.passwordHash);
      if (passwordMatch) {
        console.log('✅ Password updated and verified successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
      } else {
        console.log('❌ Password verification failed');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();

