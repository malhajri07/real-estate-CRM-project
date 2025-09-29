import { storage } from '../server/storage-prisma';

async function main() {
  const regions = await storage.getAllSaudiRegions();
  console.log('regions length', regions.length);
  console.log(regions.slice(0,3));
}

main().catch((err) => {
  console.error(err);
}).finally(() => process.exit());
