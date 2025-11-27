/**
 * leaflet.d.ts - Leaflet Type Definitions
 * 
 * Location: apps/web/src/ → Types/ → leaflet.d.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * TypeScript type definitions for Leaflet map library. Defines:
 * - LatLng types
 * - Bounds types
 * - Leaflet module types
 * 
 * Related Files:
 * - apps/web/src/components/maps/PropertyMap.tsx - Uses Leaflet
 */

declare module "leaflet" {
  export type LatLngTuple = [number, number];

  export class LatLngBounds {
    constructor(latLngs: LatLngTuple[] | LatLngTuple);
    extend(latLng: LatLngTuple): this;
    pad(bufferRatio: number): LatLngBounds;
  }

  const Leaflet: any;
  export default Leaflet;
}
