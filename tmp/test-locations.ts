import { storage } from '../server/storage-prisma';

async function main() {
  const regions = await storage.getAllSaudiRegions();
  console.log('regions count', regions.length);
  const first = regions[0];
  console.log('first region', first);
  const cities = await storage.getAllSaudiCities(first?.id);
  console.log('cities count for first region', cities.length);
  const firstCity = cities[0];
  console.log('first city', firstCity);
  const districts = await storage.getDistrictsByCity(firstCity?.id ?? 0);
  console.log('districts count for first city', districts.length);
  console.log('first district', districts[0]);
}

main().catch((err) => {
  console.error(err);
}).finally(() => process.exit());
