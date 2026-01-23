
import { prisma } from '../prismaClient';

async function main() {
    console.log('Searching for users with role ["AGENT"]...');

    // Try different variations of the stringified role
    const targetRoles = [
        '["AGENT"]',
        '["agent"]',
        'AGENT',
        'agent'
    ];

    const users = await prisma.users.findMany({
        where: {
            roles: {
                in: targetRoles
            }
        },
        select: {
            id: true,
            username: true,
            roles: true
        }
    });

    console.log(`Found ${users.length} users with legacy AGENT role.`);
    users.forEach(u => console.log(`- ${u.username} (${u.id}): ${u.roles}`));

    if (users.length > 0) {
        console.log('Deleting users...');
        const result = await prisma.users.deleteMany({
            where: {
                id: {
                    in: users.map(u => u.id)
                }
            }
        });
        console.log(`Deleted ${result.count} users successfully.`);
    } else {
        console.log('No users to delete.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
