/**
 * routes/nearby-places.ts — Nearby points-of-interest for a property.
 *
 * Mounted at `/api/nearby-places`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | /:propertyId | No | Return POIs near property (schools, hospitals, etc.) |
 *
 * Primary: precomputed JSON cache; Fallback: Overpass API.
 * Consumer: property detail map POI panel, query key `nearby-places`.
 */

import { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";

const router = Router();

// ── Load precomputed cache ────────────────────────────────────────────────

let precomputedCache: Record<string, any[]> = {};
const cachePath = join(process.cwd(), "apps/api/data/nearby-places-cache.json");
try {
  const raw = readFileSync(cachePath, "utf-8");
  precomputedCache = JSON.parse(raw);
  console.log(`[nearby-places] Loaded ${Object.keys(precomputedCache).length} cached properties`);
} catch (err: any) {
  console.warn(`[nearby-places] Cache not loaded from ${cachePath}: ${err.message}`);
}

// ── Categories ────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "mosque", labelAr: "مسجد", labelEn: "Mosque" },
  { key: "school", labelAr: "مدرسة", labelEn: "School" },
  { key: "hospital", labelAr: "مستشفى", labelEn: "Hospital" },
  { key: "pharmacy", labelAr: "صيدلية", labelEn: "Pharmacy" },
  { key: "mall", labelAr: "مركز تجاري", labelEn: "Mall" },
  { key: "supermarket", labelAr: "سوبرماركت", labelEn: "Supermarket" },
  { key: "park", labelAr: "حديقة", labelEn: "Park" },
  { key: "fuel", labelAr: "محطة وقود", labelEn: "Gas Station" },
  { key: "restaurant", labelAr: "مطعم", labelEn: "Restaurant" },
  { key: "bank", labelAr: "بنك", labelEn: "Bank" },
];

// ── Overpass fallback (with runtime cache) ────────────────────────────────

const runtimeCache = new Map<string, { data: any[]; ts: number }>();
const RUNTIME_TTL = 60 * 60 * 1000;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classify(tags: Record<string, string>) {
  const a = tags.amenity || "", s = tags.shop || "", l = tags.leisure || "";
  if (a === "place_of_worship" && tags.religion === "muslim") return { category: "mosque", categoryAr: "مسجد" };
  if (a === "school") return { category: "school", categoryAr: "مدرسة" };
  if (a === "hospital") return { category: "hospital", categoryAr: "مستشفى" };
  if (a === "pharmacy") return { category: "pharmacy", categoryAr: "صيدلية" };
  if (a === "fuel") return { category: "fuel", categoryAr: "محطة وقود" };
  if (a === "restaurant") return { category: "restaurant", categoryAr: "مطعم" };
  if (a === "bank") return { category: "bank", categoryAr: "بنك" };
  if (s === "mall") return { category: "mall", categoryAr: "مركز تجاري" };
  if (s === "supermarket") return { category: "supermarket", categoryAr: "سوبرماركت" };
  if (l === "park") return { category: "park", categoryAr: "حديقة" };
  return null;
}

async function fetchOverpass(lat: number, lon: number, radius: number): Promise<any[]> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = runtimeCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < RUNTIME_TTL) return cached.data;

  try {
    const query = `[out:json][timeout:12];(node["amenity"~"place_of_worship|school|hospital|pharmacy|fuel|restaurant|bank"](around:${radius},${lat},${lon});node["shop"~"mall|supermarket"](around:${radius},${lat},${lon});node["leisure"="park"](around:${radius},${lat},${lon}););out 60;`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    const places = (data.elements || [])
      .map((el: any) => {
        if (!el.lat || !el.lon) return null;
        const tags = el.tags || {};
        const cls = classify(tags);
        if (!cls) return null;
        if (tags.amenity === "place_of_worship" && tags.religion !== "muslim") return null;
        const dist = haversine(lat, lon, el.lat, el.lon);
        return { ...cls, name: tags["name:ar"] || tags.name || cls.categoryAr, lat: el.lat, lon: el.lon, distance: Math.round(dist), distanceFormatted: dist < 1000 ? `${Math.round(dist)} م` : `${(dist / 1000).toFixed(1)} كم` };
      })
      .filter(Boolean);

    const result = CATEGORIES.map((cat) => {
      const match = places.find((p: any) => p.category === cat.key);
      return { ...cat, place: match || null };
    });

    runtimeCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch {
    return [];
  }
}

// ── Route ─────────────────────────────────────────────────────────────────

// GET /api/nearby-places?propertyId=xxx  OR  ?lat=xx&lon=yy
router.get("/", async (req, res) => {
  try {
    const propertyId = req.query.propertyId as string;
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const radius = parseInt(req.query.radius as string) || 3000;

    // Method 1: Lookup by propertyId in precomputed cache (instant)
    if (propertyId && precomputedCache[propertyId]) {
      const places = precomputedCache[propertyId];
      const result = CATEGORIES.map((cat) => {
        const match = places.find((p: any) => p.key === cat.key);
        return {
          ...cat,
          place: match ? { id: 0, name: match.name, category: match.key, categoryAr: match.labelAr, lat: match.lat, lon: match.lon, distance: match.distance, distanceFormatted: match.distanceFormatted } : null,
        };
      });
      return res.json(result);
    }

    // Method 2: Lookup by coordinates — find nearest cached property
    if (!isNaN(lat) && !isNaN(lon)) {
      // Try to find in precomputed cache by scanning (fast enough for ~8K entries)
      let bestId = "";
      let bestDist = Infinity;
      for (const [id, places] of Object.entries(precomputedCache)) {
        if (!places[0]) continue;
        const d = haversine(lat, lon, places[0].lat, places[0].lon);
        if (d < bestDist) { bestDist = d; bestId = id; }
      }

      // If closest cached property is within 500m, use its data
      if (bestId && bestDist < 500) {
        const places = precomputedCache[bestId];
        const result = CATEGORIES.map((cat) => {
          const match = places.find((p: any) => p.key === cat.key);
          return {
            ...cat,
            place: match ? { id: 0, name: match.name, category: match.key, categoryAr: match.labelAr, lat: match.lat, lon: match.lon, distance: match.distance, distanceFormatted: match.distanceFormatted } : null,
          };
        });
        return res.json(result);
      }

      // Fallback: try Overpass API
      const overpassResult = await fetchOverpass(lat, lon, radius);
      if (overpassResult.length > 0) return res.json(overpassResult);
    }

    // No data available — return empty categories
    res.json(CATEGORIES.map((cat) => ({ ...cat, place: null })));
  } catch (error) {
    console.error("Nearby places error:", error);
    res.status(500).json({ message: "Failed to fetch nearby places" });
  }
});

export default router;
