
import { prisma } from '../prismaClient';

async function main() {
    console.log('--- STARTING RECURSION TEST ---');
    try {
        console.log('1. Checking prisma object...');
        console.log('prisma.system_roles TYPE:', typeof prisma.system_roles);

        if (!prisma.system_roles) {
            console.error('CRITICAL: prisma.system_roles is undefined!');
            return;
        }

        console.log('2. Accessing getter directly...');
        // Accessing the property is what triggers the getter in the proxy/defineProperty
        const roleDelegate = prisma.system_roles;
        console.log('Success: Accessed prisma.system_roles');

        console.log('3. Attempting database query...');
        const roles = await roleDelegate.findMany({
            take: 1
        });
        console.log('Success: Fetched roles:', roles);

    } catch (error) {
        console.error('!!! CAUGHT ERROR !!!');
        console.error(error);
    }
    console.log('--- ENDING RECURSION TEST ---');
}

main();
