import fs from "fs";
import path from "path";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_BASE_URL = "https://raw.githubusercontent.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts/master/json";

function decimalOrNull(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return new Prisma.Decimal(value);
}

type RegionRecord = {
  region_id: number;
  capital_city_id?: number | null;
  code?: string | null;
  name_ar: string;
  name_en: string;
  population?: number | null;
  center?: [number, number] | null;
  boundaries?: unknown;
};

type CityRecord = {
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
  center?: [number, number] | null;
};

type DistrictRecord = {
  district_id: number;
  city_id: number;
  region_id: number;
  name_ar: string;
  name_en: string;
  boundaries?: unknown;
};

async function loadJson<T>(basename: string): Promise<T> {
  const localDir = process.env.SA_GEO_DATA_DIR;
  if (localDir) {
    const filePath = path.resolve(localDir, `${basename}.json`);
    const raw = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  }

  const baseUrl = process.env.SA_GEO_DATA_BASE_URL || DEFAULT_BASE_URL;
  const url = `${baseUrl}/${basename}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}\n${text}`);
  }
  return (await response.json()) as T;
}

async function importRegions(regions: RegionRecord[]) {
  for (const region of regions) {
    const center = region.center ?? null;
    await prisma.region.upsert({
      where: { id: region.region_id },
      update: {
        code: region.code ?? null,
        nameAr: region.name_ar,
        nameEn: region.name_en,
        population: region.population ?? null,
        centerLatitude: center ? decimalOrNull(center[0]) : null,
        centerLongitude: center ? decimalOrNull(center[1]) : null,
        boundary: region.boundaries ?? null,
      },
      create: {
        id: region.region_id,
        code: region.code ?? null,
        nameAr: region.name_ar,
        nameEn: region.name_en,
        population: region.population ?? null,
        centerLatitude: center ? decimalOrNull(center[0]) : null,
        centerLongitude: center ? decimalOrNull(center[1]) : null,
        boundary: region.boundaries ?? null,
      },
    });
  }
}

async function importCities(cities: CityRecord[]) {
  for (const city of cities) {
    const center = city.center ?? null;
    await prisma.city.upsert({
      where: { id: city.city_id },
      update: {
        regionId: city.region_id,
        nameAr: city.name_ar,
        nameEn: city.name_en,
        centerLatitude: center ? decimalOrNull(center[0]) : null,
        centerLongitude: center ? decimalOrNull(center[1]) : null,
      },
      create: {
        id: city.city_id,
        regionId: city.region_id,
        nameAr: city.name_ar,
        nameEn: city.name_en,
        centerLatitude: center ? decimalOrNull(center[0]) : null,
        centerLongitude: center ? decimalOrNull(center[1]) : null,
      },
    });
  }
}

async function importDistricts(districts: DistrictRecord[]) {
  for (const district of districts) {
    await prisma.district.upsert({
      where: { id: BigInt(district.district_id) },
      update: {
        regionId: district.region_id,
        cityId: district.city_id,
        nameAr: district.name_ar,
        nameEn: district.name_en,
        boundary: district.boundaries ?? null,
      },
      create: {
        id: BigInt(district.district_id),
        regionId: district.region_id,
        cityId: district.city_id,
        nameAr: district.name_ar,
        nameEn: district.name_en,
        boundary: district.boundaries ?? null,
      },
    });
  }
}

async function main() {
  console.log("[geo-import] Loading Saudi geography datasets...");
  const [regions, cities, districts] = await Promise.all([
    loadJson<RegionRecord[]>("regions"),
    loadJson<CityRecord[]>("cities"),
    loadJson<DistrictRecord[]>("districts"),
  ]);

  console.log(`[geo-import] Fetched ${regions.length} regions, ${cities.length} cities, ${districts.length} districts.`);

  console.log("[geo-import] Importing regions...");
  await importRegions(regions);
  console.log("[geo-import] Importing cities...");
  await importCities(cities);
  console.log("[geo-import] Importing districts...");
  await importDistricts(districts);

  console.log("[geo-import] Completed successfully.");
}

main()
  .catch((error) => {
    console.error("[geo-import] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
