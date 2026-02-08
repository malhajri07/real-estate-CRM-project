import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdminAccess() {
    console.log("🔧 Restoring Admin Access...");

    try {
        const passwordHash = await bcrypt.hash('admin123', 12);
        const username = 'admin';
        const email = 'admin@realestateInfo.com';

        console.log(`Checking for user: ${username}...`);

        const existingUser = await prisma.users.findUnique({
            where: { username }
        });

        if (existingUser) {
            console.log(`User '${username}' found. Updating credentials and roles...`);
            await prisma.users.update({
                where: { username },
                data: {
                    passwordHash,
                    roles: JSON.stringify(["WEBSITE_ADMIN"]), // Ensure JSON format
                    isActive: true,
                    email, // Enforce email
                    firstName: 'Admin',
                    lastName: 'User'
                }
            });
            console.log("✅ Admin user UPDATED successfully.");
        } else {
            console.log(`User '${username}' not found. Creating new admin user...`);
            await prisma.users.create({
                data: {
                    username,
                    email,
                    firstName: 'Admin',
                    lastName: 'User',
                    passwordHash,
                    roles: JSON.stringify(["WEBSITE_ADMIN"]),
                    isActive: true
                }
            });
            console.log("✅ Admin user CREATED successfully.");
        }

        // Verify
        const verifyUser = await prisma.users.findUnique({
            where: { username }
        });
        console.log("Current Admin User State:");
        console.log({
            id: verifyUser?.id,
            username: verifyUser?.username,
            roles: verifyUser?.roles,
            isActive: verifyUser?.isActive,
            email: verifyUser?.email
        });

    } catch (error) {
        console.error("❌ Error fixing admin access:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminAccess();
