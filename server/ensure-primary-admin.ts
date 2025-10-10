import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth';

// Create or update a primary WEBSITE_ADMIN user using username-first auth
async function ensurePrimaryAdmin() {
  const prisma = new PrismaClient();
  const username = (process.env.PRIMARY_ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.PRIMARY_ADMIN_PASSWORD || 'admin123';
  const email = process.env.PRIMARY_ADMIN_EMAIL || 'admin@aqaraty.com';

  try {
    let user = await prisma.users.findUnique({ where: { username } });

    const passwordHash = await hashPassword(password);
    const roles = JSON.stringify(['WEBSITE_ADMIN']);

    if (!user) {
      user = await prisma.users.create({
        data: {
          username,
          email,
          firstName: 'Primary',
          lastName: 'Admin',
          phone: null,
          passwordHash,
          roles,
          isActive: true,
        },
      });
      console.log(`Created primary admin '${username}'`);
    } else {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          email: email || user.email,
          passwordHash,
          roles,
          isActive: true,
        },
      });
      console.log(`Updated primary admin '${username}'`);
    }
  } catch (e: any) {
    console.error('Failed to ensure primary admin:', e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ensurePrimaryAdmin();
