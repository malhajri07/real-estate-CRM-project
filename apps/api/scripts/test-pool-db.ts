#!/usr/bin/env npx tsx
/**
 * Test pool database queries - run with: npx tsx apps/api/scripts/test-pool-db.ts
 */
import 'dotenv/config';
import { PrismaClient, BuyerRequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Testing Pool Database Queries ===\n');

  try {
    // 1. properties_seeker
    console.log('1. properties_seeker:');
    const seekers = await prisma.properties_seeker.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      select: { seeker_num: true, seeker_id: true, city: true, type_of_property: true, created_at: true }
    });
    console.log(`   Found ${seekers.length} records`);
    seekers.forEach((r, i) => console.log(`   [${i}] ${r.seeker_id} | ${r.city} | ${r.type_of_property}`));
  } catch (err: any) {
    console.error('   ERROR:', err?.message || err);
  }

  console.log('');

  try {
    // 2. buyer_requests
    console.log('2. buyer_requests (OPEN):');
    const buyers = await prisma.buyer_requests.findMany({
      where: { status: BuyerRequestStatus.OPEN },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, city: true, type: true, createdAt: true }
    });
    console.log(`   Found ${buyers.length} records`);
    buyers.forEach((r, i) => console.log(`   [${i}] ${r.id} | ${r.city} | ${r.type}`));
  } catch (err: any) {
    console.error('   ERROR:', err?.message || err);
  }

  await prisma.$disconnect();
  console.log('\n=== Done ===');
}

main();
