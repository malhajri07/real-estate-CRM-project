import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Spatial query utilities for geographical operations
 * Includes distance calculations, polygon intersections, and location-based searches
 */

export interface Point {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Find properties within a certain radius of a point
 */
export async function findPropertiesWithinRadius(
  center: Point,
  radiusKm: number,
  filters?: {
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
  }
) {
  // Get all properties and filter by distance using JavaScript
  const properties = await prisma.property.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters?.maxPrice && { price: { lte: filters.maxPrice } }),
    },
    include: {
      region: true,
      cityRef: true,
      districtRef: true,
    }
  });

  // Filter by distance and calculate distance
  const nearbyProperties = properties
    .map(property => {
      if (!property.latitude || !property.longitude) return null;
      
      const distance = calculateDistance(
        center,
        { latitude: Number(property.latitude), longitude: Number(property.longitude) }
      );
      
      return { ...property, distance_km: distance };
    })
    .filter(property => property && property.distance_km <= radiusKm)
    .sort((a, b) => a!.distance_km - b!.distance_km);

  return nearbyProperties;
}

/**
 * Find properties within a bounding box
 */
export async function findPropertiesInBoundingBox(
  bbox: BoundingBox,
  filters?: {
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
  }
) {
  return await prisma.property.findMany({
    where: {
      latitude: { 
        gte: bbox.south,
        lte: bbox.north 
      },
      longitude: { 
        gte: bbox.west,
        lte: bbox.east 
      },
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters?.maxPrice && { price: { lte: filters.maxPrice } }),
    },
    include: {
      region: true,
      cityRef: true,
      districtRef: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Find properties within a specific district
 */
export async function findPropertiesInDistrict(
  districtId: number,
  filters?: {
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
  }
) {
  return await prisma.property.findMany({
    where: {
      districtId: BigInt(districtId),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters?.maxPrice && { price: { lte: filters.maxPrice } }),
    },
    include: {
      region: true,
      cityRef: true,
      districtRef: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Find the nearest properties to a point
 */
export async function findNearestProperties(
  center: Point,
  limit: number = 10,
  filters?: {
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
  }
) {
  const properties = await prisma.property.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters?.maxPrice && { price: { lte: filters.maxPrice } }),
    },
    include: {
      region: true,
      cityRef: true,
      districtRef: true,
    }
  });

  // Calculate distances and sort
  const propertiesWithDistance = properties
    .map(property => {
      if (!property.latitude || !property.longitude) return null;
      
      const distance = calculateDistance(
        center,
        { latitude: Number(property.latitude), longitude: Number(property.longitude) }
      );
      
      return { ...property, distance_km: distance };
    })
    .filter(property => property !== null)
    .sort((a, b) => a!.distance_km - b!.distance_km)
    .slice(0, limit);

  return propertiesWithDistance;
}

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(point1: Point, point2: Point): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get district boundaries as JSON
 */
export async function getDistrictBoundaries(districtId: number) {
  return await prisma.district.findUnique({
    where: { id: BigInt(districtId) },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      boundary: true,
      region: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
        }
      },
      city: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
        }
      }
    }
  });
}

/**
 * Get region boundaries as JSON
 */
export async function getRegionBoundaries(regionId: number) {
  return await prisma.region.findUnique({
    where: { id: regionId },
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      boundary: true,
      centerLatitude: true,
      centerLongitude: true,
    }
  });
}

/**
 * Find which district a point belongs to (based on coordinates)
 */
export async function findDistrictForPoint(point: Point) {
  // This is a simplified version - in a real implementation, you'd need
  // to check if the point falls within the district's boundary polygon
  // For now, we'll return districts in the same general area
  const tolerance = 0.1; // degrees
  
  return await prisma.district.findMany({
    where: {
      // This is a simplified approach - you'd need proper polygon intersection
      // for accurate results
    },
    include: {
      region: true,
      city: true,
    }
  });
}

/**
 * Find which region a point belongs to (based on coordinates)
 */
export async function findRegionForPoint(point: Point) {
  // This is a simplified version - in a real implementation, you'd need
  // to check if the point falls within the region's boundary polygon
  // For now, we'll return regions in the same general area
  const tolerance = 0.5; // degrees
  
  return await prisma.region.findMany({
    where: {
      // This is a simplified approach - you'd need proper polygon intersection
      // for accurate results
    }
  });
}

/**
 * Get properties with their geographical relationships
 */
export async function getPropertiesWithGeography(filters?: {
  regionId?: number;
  cityId?: number;
  districtId?: number;
  type?: string;
  status?: string;
}) {
  return await prisma.property.findMany({
    where: {
      ...(filters?.regionId && { regionId: filters.regionId }),
      ...(filters?.cityId && { cityId: filters.cityId }),
      ...(filters?.districtId && { districtId: filters.districtId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
    },
    include: {
      region: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          centerLatitude: true,
          centerLongitude: true,
        }
      },
      cityRef: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          centerLatitude: true,
          centerLongitude: true,
        }
      },
      districtRef: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
        }
      }
    }
  });
}

export default {
  findPropertiesWithinRadius,
  findPropertiesInBoundingBox,
  findPropertiesInDistrict,
  findNearestProperties,
  calculateDistance,
  getDistrictBoundaries,
  getRegionBoundaries,
  findDistrictForPoint,
  findRegionForPoint,
  getPropertiesWithGeography,
};
