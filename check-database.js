// Check current state of properties_seeker table
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("🔍 Checking properties_seeker table...");

  try {
    // Count total records
    const count = await prisma.propertySeeker.count();
    console.log("📊 Total records:", count);

    // Get latest 5 records
    const latest = await prisma.propertySeeker.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        seekerId: true,
        firstName: true,
        lastName: true,
        email: true,
        city: true,
        typeOfProperty: true,
        typeOfContract: true,
        budgetSize: true,
        createdAt: true
      }
    });

    console.log("\n📋 Latest 5 records:");
    latest.forEach((record, index) => {
      console.log(`${index + 1}. ${record.seekerId} | ${record.firstName} ${record.lastName} | ${record.email} | ${record.city} | ${record.typeOfProperty} (${record.typeOfContract}) | ${record.budgetSize} ﷼`);
    });

  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

