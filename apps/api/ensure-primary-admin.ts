/**
 * ensure-primary-admin.ts - Primary Admin Creation Script
 * 
 * Location: apps/api/ → Database Seeds & Population → ensure-primary-admin.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Primary admin creation script. Ensures:
 * - Primary admin user exists
 * - Admin credentials are set
 * - Admin user is properly configured
 * 
 * Related Files:
 * - apps/api/createAdmin1AndPopulate.ts - Admin creation and population
 * - apps/api/auth.ts - Authentication utilities
 */

import { randomUUID } from 'crypto';
import { hashPassword } from './auth';
import { prisma } from './prismaClient';

// Create or update a primary WEBSITE_ADMIN user using username-first auth
async function ensurePrimaryAdmin() {
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
          id: randomUUID(),
          username,
          email,
          firstName: 'Primary',
          lastName: 'Admin',
          phone: null,
          passwordHash,
          roles,
          isActive: true,
          updatedAt: new Date(),
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
          updatedAt: new Date(),
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
