import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndCreateAdminUser() {
  try {
    console.log('🔍 Checking for admin1 user...');
    
    // Check if admin1 user exists
    const existingAdmin = await prisma.users.findUnique({
      where: { username: 'admin1' }
    });

    if (existingAdmin) {
      console.log('✅ admin1 user found:', {
        id: existingAdmin.id,
        username: existingAdmin.username,
        roles: existingAdmin.roles,
        isActive: existingAdmin.isActive
      });
      
      // Verify password
      const passwordMatch = await bcrypt.compare('admin123', existingAdmin.passwordHash);
      if (passwordMatch) {
        console.log('✅ Password verification successful');
      } else {
        console.log('❌ Password verification failed - updating password');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.users.update({
          where: { username: 'admin1' },
          data: { passwordHash: hashedPassword }
        });
        console.log('✅ Password updated successfully');
      }
    } else {
      console.log('❌ admin1 user not found - creating new admin user');
      
      // Create admin1 user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await prisma.users.create({
        data: {
          username: 'admin1',
          passwordHash: hashedPassword,
          roles: JSON.stringify(['WEBSITE_ADMIN']),
          isActive: true,
          email: 'admin1@system.local',
          firstName: 'System',
          lastName: 'Administrator'
        }
      });
      
      console.log('✅ admin1 user created successfully:', {
        id: newAdmin.id,
        username: newAdmin.username,
        roles: newAdmin.roles
      });
    }

    // List all admin users
    console.log('\n📋 All admin users in database:');
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        roles: true,
        isActive: true,
        email: true
      }
    });
    
    const adminUsers = allUsers.filter(user => {
      try {
        const userRoles = JSON.parse(user.roles);
        return userRoles.includes('WEBSITE_ADMIN');
      } catch {
        return false;
      }
    });
    
    adminUsers.forEach(admin => {
      console.log(`- ${admin.username} (${admin.roles}) - Active: ${admin.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateAdminUser();
