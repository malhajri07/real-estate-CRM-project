import express from "express";
import { storage } from "../storage-prisma";

const router = express.Router();

function asCenter(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return null;
  }
  return { latitude, longitude };
}

router.get("/regions", async (req, res) => {
  try {
    const includeBoundary = req.query.includeBoundary === "true";
    const regions = await storage.getAllSaudiRegions();

    const payload = regions.map((region) => ({
      id: region.id,
      code: region.code,
      nameAr: region.nameAr,
      nameEn: region.nameEn,
      population: region.population,
      center: asCenter(region.centerLatitude, region.centerLongitude),
      citiesCount: region.citiesCount,
      districtsCount: region.districtsCount,
      boundary: includeBoundary ? region.boundary : undefined,
    }));

    res.json(payload);
  } catch (err) {
    console.error("Error fetching regions:", err);
    res.status(500).json({ message: "Failed to fetch regions" });
  }
});

router.get("/cities", async (req, res) => {
  try {
    let cities;

    if (typeof req.query.regionId === "string") {
      const regionId = Number(req.query.regionId);
      if (Number.isNaN(regionId)) {
        return res.status(400).json({ message: "Invalid regionId parameter" });
      }
      cities = await storage.getAllSaudiCities(regionId);
    } else if (typeof req.query.regionCode === "string") {
      cities = await storage.getCitiesByRegion(parseInt(req.query.regionCode));
    } else {
      cities = await storage.getAllSaudiCities();
    }

    const payload = cities.map((city) => ({
      id: city.id,
      regionId: city.regionId,
      nameAr: city.nameAr,
      nameEn: city.nameEn,
      center: asCenter(city.centerLatitude, city.centerLongitude),
      districtsCount: city.districtsCount,
      propertiesCount: city.propertiesCount,
    }));

    res.json(payload);
  } catch (err) {
    console.error("Error fetching cities:", err);
    res.status(500).json({ message: "Failed to fetch cities" });
  }
});

router.get("/districts", async (req, res) => {
  try {
    const includeBoundary = req.query.includeBoundary === "true";

    if (typeof req.query.cityId === "string") {
      const cityId = Number(req.query.cityId);
      if (Number.isNaN(cityId)) {
        return res.status(400).json({ message: "Invalid cityId parameter" });
      }
      const districts = await storage.getDistrictsByCity(cityId);
      return res.json(
        districts.map((district) => ({
          id: typeof district.id === 'bigint' ? district.id.toString() : String(district.id),
          regionId: typeof district.regionId === 'bigint' ? Number(district.regionId) : district.regionId,
          cityId: typeof district.cityId === 'bigint' ? Number(district.cityId) : district.cityId,
          nameAr: district.nameAr,
          nameEn: district.nameEn,
          boundary: includeBoundary ? district.boundary : undefined,
        }))
      );
    }

    let regionId: number | undefined;
    if (typeof req.query.regionId === "string") {
      regionId = Number(req.query.regionId);
      if (Number.isNaN(regionId)) {
        return res.status(400).json({ message: "Invalid regionId parameter" });
      }
    }

    const districts = await storage.getAllSaudiDistricts(regionId);

    const payload = districts.map((district) => ({
      id: typeof district.id === 'bigint' ? district.id.toString() : String(district.id),
      regionId: typeof district.regionId === 'bigint' ? Number(district.regionId) : district.regionId,
      cityId: typeof district.cityId === 'bigint' ? Number(district.cityId) : district.cityId,
      nameAr: district.nameAr,
      nameEn: district.nameEn,
      boundary: includeBoundary ? district.boundary : undefined,
    }));

    res.json(payload);
  } catch (err) {
    console.error("Error fetching districts:", err);
    res.status(500).json({ message: "Failed to fetch districts" });
  }
});

export default router;
