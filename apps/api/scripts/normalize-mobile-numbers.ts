/**
 * One-time script to normalize mobile_number in properties_seeker to +966xxxxxxxxx
 * Run: npx tsx apps/api/scripts/normalize-mobile-numbers.ts
 */

import { basePrisma } from '../prismaClient';
import { normalizeSaudiPhone } from '../utils/phone';

async function main() {
  const seekers = await basePrisma.properties_seeker.findMany({
    select: { seeker_num: true, seeker_id: true, mobile_number: true }
  });

  let updated = 0;
  for (const s of seekers) {
    if (!s.mobile_number) continue;
    const normalized = normalizeSaudiPhone(s.mobile_number);
    if (normalized && normalized !== s.mobile_number) {
      await basePrisma.properties_seeker.update({
        where: { seeker_num: s.seeker_num },
        data: { mobile_number: normalized }
      });
      console.log(`${s.seeker_id}: ${s.mobile_number} → ${normalized}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} of ${seekers.length} records.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => basePrisma.$disconnect());
