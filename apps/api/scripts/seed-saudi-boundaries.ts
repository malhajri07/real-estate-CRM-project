/**
 * seed-saudi-boundaries.ts
 *
 * Fetches region and district boundaries from homaily
 * (https://github.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts)
 * and updates the database. Run after seed-saudi-geography.ts.
 *
 * Homaily format: boundaries = [[[lat, lon], [lat, lon], ...]]
 * Coordinates are (Lat, Lon) per homaily README.
 *
 * Run: npx tsx apps/api/scripts/seed-saudi-boundaries.ts
 * Or: pnpm db:seed-saudi-boundaries
 */

const BASE =
  "https://raw.githubusercontent.com/homaily/Saudi-Arabia-Regions-Cities-and-Districts/master/json";

async function fetchWithTimeout<T>(
  url: string,
  timeoutMs = 120_000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

interface RegionFull {
  region_id: number;
  boundaries?: unknown[][][];
  center?: [number, number];
}

interface DistrictFull {
  district_id: number;
  city_id: number;
  region_id: number;
  boundaries?: unknown[][][];
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  console.log("Fetching regions with boundaries from homaily...");
  const regionsRaw = await fetchWithTimeout<RegionFull[]>(`${BASE}/regions.json`);

  let regionsUpdated = 0;
  for (const r of regionsRaw) {
    if (!r.boundaries || !Array.isArray(r.boundaries) || r.boundaries.length === 0) {
      continue;
    }
    const boundary = r.boundaries as unknown;
    await prisma.regions.update({
      where: { id: r.region_id },
      data: {
        boundary,
        ...(r.center &&
          Array.isArray(r.center) &&
          r.center.length >= 2 && {
            centerLatitude: r.center[0],
            centerLongitude: r.center[1],
          }),
      },
    });
    regionsUpdated++;
    console.log(`  Region ${r.region_id} boundaries updated.`);
  }
  console.log(`Regions: ${regionsUpdated} updated.`);

  console.log("Fetching districts with boundaries (this may take 2–3 minutes)...");
  const districtsRaw = await fetchWithTimeout<DistrictFull[]>(
    `${BASE}/districts.json`,
    300_000
  );

  let districtsUpdated = 0;
  const BATCH = 100;
  for (let i = 0; i < districtsRaw.length; i += BATCH) {
    const batch = districtsRaw.slice(i, i + BATCH);
    for (const d of batch) {
      if (!d.boundaries || !Array.isArray(d.boundaries) || d.boundaries.length === 0) {
        continue;
      }
      const boundary = d.boundaries as unknown;
      try {
        await prisma.districts.update({
          where: { id: BigInt(d.district_id) },
          data: { boundary },
        });
        districtsUpdated++;
      } catch (e) {
        // District may not exist if geography seed was partial
        console.warn(`  Skip district ${d.district_id}: ${(e as Error).message}`);
      }
    }
    console.log(`  Districts ${i + 1}-${Math.min(i + BATCH, districtsRaw.length)} processed.`);
  }
  console.log(`Districts: ${districtsUpdated} updated.`);

  await prisma.$disconnect();
  console.log("Boundaries seeded successfully.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
