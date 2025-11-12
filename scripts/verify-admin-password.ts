import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyAdminPassword() {
  try {
    console.log('🔍 Checking admin user password...');
    
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
      email: adminUser.email,
      isActive: adminUser.isActive,
      roles: adminUser.roles,
      passwordHash: adminUser.passwordHash.substring(0, 20) + '...'
    });
    
    // Test password "admin123"
    console.log('\n🔐 Testing password "admin123"...');
    const passwordMatch = await bcrypt.compare('admin123', adminUser.passwordHash);
    
    if (passwordMatch) {
      console.log('✅ Password "admin123" is CORRECT');
    } else {
      console.log('❌ Password "admin123" is INCORRECT');
      console.log('🔧 Updating password to "admin123"...');
      
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await prisma.users.update({
        where: { username: 'admin' },
        data: { 
          passwordHash: hashedPassword,
          isActive: true
        }
      });
      
      // Verify again
      const updatedUser = await prisma.users.findUnique({
        where: { username: 'admin' }
      });
      
      if (updatedUser) {
        const verifyMatch = await bcrypt.compare('admin123', updatedUser.passwordHash);
        if (verifyMatch) {
          console.log('✅ Password updated and verified successfully!');
        } else {
          console.log('❌ Password update verification failed');
        }
      }
    }
    
    // Also check admin1 user
    console.log('\n🔍 Checking admin1 user password...');
    const admin1User = await prisma.users.findUnique({
      where: { username: 'admin1' }
    });
    
    if (admin1User) {
      const admin1Match = await bcrypt.compare('admin123', admin1User.passwordHash);
      if (admin1Match) {
        console.log('✅ admin1 password "admin123" is CORRECT');
      } else {
        console.log('❌ admin1 password "admin123" is INCORRECT - updating...');
        const hashedPassword = await bcrypt.hash('admin123', 12);
        await prisma.users.update({
          where: { username: 'admin1' },
          data: { passwordHash: hashedPassword }
        });
        console.log('✅ admin1 password updated');
      }
    }

    console.log('\n📝 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n   OR');
    console.log('   Username: admin1');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminPassword();

