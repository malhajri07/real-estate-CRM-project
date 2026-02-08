import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminUser() {
    console.log("🔍 Checking for admin users...");

    try {
        // Check for user with username 'admin'
        const adminUser = await prisma.users.findUnique({
            where: { username: 'admin' },
        });

        if (adminUser) {
            console.log("✅ Admin user found:");
            console.log(JSON.stringify(adminUser, null, 2));

            // distinct check for password 'admin123'
            const isPasswordValid = await bcrypt.compare('admin123', adminUser.passwordHash);
            console.log(`🔐 Password 'admin123' is valid: ${isPasswordValid}`);
        } else {
            console.log("❌ Admin user NOT found.");
        }

        // List all users with 'ADMIN' in their roles
        const allAdmins = await prisma.users.findMany({
            where: {
                roles: {
                    contains: 'ADMIN' // Simple string check since roles is a connection of strings
                }
            }
        });

        console.log(`\n📋 Found ${allAdmins.length} users with 'ADMIN' in roles:`);
        allAdmins.forEach(u => {
            console.log(`- ${u.username} (${u.email}) - Roles: ${u.roles}`);
        });

    } catch (error) {
        console.error("❌ Error checking database:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUser();
