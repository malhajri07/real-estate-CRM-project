/**
 * Constants for the Map page
 */

import type { Coordinates, FilterState } from '../types';

export const DEFAULT_CENTER: Coordinates = [24.7136, 46.6753];
export const DEFAULT_ZOOM = 6;
export const SINGLE_MARKER_ZOOM = 12;
export const HIGHLIGHT_ZOOM = 14;

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  region: "all",
  city: "all",
  district: "all",
  propertyType: "all",
  transactionType: "all",
  minPrice: "",
  maxPrice: "",
  minBedrooms: "",
  maxBedrooms: "",
  minBathrooms: "",
  maxBathrooms: "",
  minArea: "",
  maxArea: "",
  favoritesOnly: false,
};

export const clusterStyles = [
  {
    textColor: "white",
    url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9IiMxZDQ4ZDgiLz48dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjA8L3RleHQ+PC9zdmc+",
    height: 40,
    width: 40,
  },
];

