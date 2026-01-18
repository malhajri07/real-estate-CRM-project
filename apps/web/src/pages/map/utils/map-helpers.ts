/**
 * map-helpers.ts - Google Maps Helper Utilities
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → utils/ → map-helpers.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Google Maps helper utilities. Provides:
 * - Map utility functions
 * - Coordinate helpers
 * - Map calculation utilities
 * 
 * Related Files:
 * - apps/web/src/pages/map/components/PropertiesMap.tsx - Uses these helpers
 */

/**
 * Google Maps helper utilities
 */

import type { Coordinates } from '../types';

// Type alias for Google Maps LatLng to avoid circular reference
type LatLngLiteral = { lat: number; lng: number };

/**
 * Converts boundary coordinates to Google Maps LatLng format
 */
export const toBoundaryLatLngLiteral = (point: unknown): LatLngLiteral | null => {
  if (Array.isArray(point) && point.length >= 2) {
    const [lat, lng] = point;
    if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }
  return null;
};

/**
 * Builds polygon rings from coordinate arrays
 */
export const buildRingsFromCoordinates = (coords: unknown): LatLngLiteral[][] => {
  if (!Array.isArray(coords) || coords.length === 0) return [];

  const first = coords[0];

  if (typeof first === "number") {
    // Assume [lng, lat, lng, lat, ...] flat array
    const ring: google.maps.LatLngLiteral[] = [];
    for (let i = 0; i < coords.length; i += 2) {
      const lng = coords[i];
      const lat = coords[i + 1];
      if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
        ring.push({ lat, lng });
      }
    }
    if (ring.length >= 3) {
      // Reverse to ensure correct polygon orientation
      return [[...ring].reverse()];
    }
    return [];
  }

  if (Array.isArray(first)) {
    return (coords as unknown[]).flatMap((ring) => buildRingsFromCoordinates(ring));
  }

  return [];
};

/**
 * Normalizes boundary payload shapes into consistent polygon paths
 */
export const normalizeBoundaryToPolygon = (boundary: unknown): LatLngLiteral[][] => {
  if (!boundary) return [];

  let data: unknown = boundary;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return [];
    }
  }

  if (Array.isArray(data)) {
    return buildRingsFromCoordinates(data);
  }

  if (typeof data === "object" && data !== null) {
    const geo = data as { type?: string; coordinates?: unknown };
    if (geo.coordinates) {
      return buildRingsFromCoordinates(geo.coordinates);
    }
  }

  return [];
};

/**
 * Creates a custom marker icon for Google Maps
 */
export const createMarkerIcon = (
  googleInstance: { maps: typeof google.maps } | undefined,
  priceText: string,
  isHighlighted: boolean
): google.maps.Icon | google.maps.Symbol | undefined => {
  if (!googleInstance?.maps) return undefined;
  const escapedPrice = priceText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fillColor = isHighlighted ? "#ef4444" : "#1d4ed8";
  const strokeColor = isHighlighted ? "#dc2626" : "#1e40af";
  const strokeWidth = isHighlighted ? "2.5" : "2";

  const svg = `
    <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      <text x="30" y="35" font-size="10" font-family="Arial, sans-serif" fill="white" text-anchor="middle" font-weight="bold">${escapedPrice}</text>
    </svg>
  `;

  if (!google?.maps) return undefined;

  return {
    url: `data:image/svg+xml;base64,${btoa(svg)}`,
    scaledSize: new googleInstance.maps.Size(60, 60),
    anchor: new googleInstance.maps.Point(30, 30),
  };
};

