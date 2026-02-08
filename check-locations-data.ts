
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        const regionsCount = await prisma.regions.count();
        const citiesCount = await prisma.cities.count();

        console.log(`Regions count: ${regionsCount}`);
        console.log(`Cities count: ${citiesCount}`);

        if (regionsCount > 0) {
            const firstRegion = await prisma.regions.findFirst();
            console.log('First Region:', firstRegion);
        }

        if (citiesCount > 0) {
            const firstCity = await prisma.cities.findFirst();
            console.log('First City:', firstCity);
        }

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
