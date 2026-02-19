/**
 * seed-saudi-geography.ts
 *
 * Downloads Saudi Arabia regions, cities, and districts from
 * https://github.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts
 * and seeds the database.
 *
 * Uses the lite JSON files (no GIS boundaries) for smaller payload.
 *
 * Run: npx tsx apps/api/scripts/seed-saudi-geography.ts
 */

const BASE = "https://raw.githubusercontent.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts/master/json";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

interface RegionLite {
  region_id: number;
  capital_city_id?: number;
  code: string;
  name_ar: string;
  name_en: string;
  population?: number;
}

interface CityLite {
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
}

interface DistrictLite {
  district_id: number;
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
}

async function main() {
  const { storage } = await import("../storage-prisma");

  console.log("Downloading Saudi geography data from homaily/Saudi-Arabia-Regions-Cities-and-Districts...");

  const [regionsRaw, citiesRaw, districtsRaw] = await Promise.all([
    fetchJson<RegionLite[]>(`${BASE}/regions_lite.json`),
    fetchJson<CityLite[]>(`${BASE}/cities_lite.json`),
    fetchJson<DistrictLite[]>(`${BASE}/districts_lite.json`),
  ]);

  const regions = regionsRaw.map((r) => ({
    id: r.region_id,
    code: r.code || null,
    nameAr: r.name_ar,
    nameEn: r.name_en,
    population: r.population ?? null,
  }));

  const cities = citiesRaw.map((c) => ({
    id: c.city_id,
    regionId: c.region_id,
    nameAr: c.name_ar,
    nameEn: c.name_en,
  }));

  const districts = districtsRaw.map((d) => ({
    id: d.district_id,
    regionId: d.region_id,
    cityId: d.city_id,
    nameAr: d.name_ar,
    nameEn: d.name_en,
  }));

  console.log(`Seeding ${regions.length} regions, ${cities.length} cities, ${districts.length} districts...`);

  await storage.seedSaudiRegions(regions);
  console.log("  Regions done.");

  // Cities in batches to avoid timeout
  const CITY_BATCH = 500;
  for (let i = 0; i < cities.length; i += CITY_BATCH) {
    const batch = cities.slice(i, i + CITY_BATCH);
    await storage.seedSaudiCities(batch);
    console.log(`  Cities ${i + 1}-${Math.min(i + CITY_BATCH, cities.length)} done.`);
  }

  // Districts in batches
  const DISTRICT_BATCH = 300;
  for (let i = 0; i < districts.length; i += DISTRICT_BATCH) {
    const batch = districts.slice(i, i + DISTRICT_BATCH);
    await storage.seedSaudiDistricts(batch);
    console.log(`  Districts ${i + 1}-${Math.min(i + DISTRICT_BATCH, districts.length)} done.`);
  }

  console.log("Saudi geography seeded successfully.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
