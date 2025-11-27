/**
 * PropertiesMap Component
 * 
 * Renders the Google Map instance with clustered price markers and optional
 * district polygons. All DOM access is gated behind `isClient` so SSR stays safe.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useLoadScript, Marker, MarkerClusterer, Polygon } from "@react-google-maps/api";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { PropertiesMapProps, Coordinates, GoogleWindow } from "../types";
import { DEFAULT_CENTER, DEFAULT_ZOOM, SINGLE_MARKER_ZOOM, HIGHLIGHT_ZOOM, clusterStyles } from "../utils/constants";
import { toLatLngLiteral, formatMarkerPrice } from "../utils/formatters";
import { createMarkerIcon } from "../utils/map-helpers";

export function PropertiesMap({
  properties,
  highlightedId,
  onSelect,
  onNavigate,
  isClient,
  districtPolygon,
}: PropertiesMapProps) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Maps script using the hook to prevent duplicate loads
  const { isLoaded, loadError: scriptLoadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey || "",
    language: "ar",
    region: "SA",
  });

  // Transform the current property collection into Google Maps marker metadata
  // while defensively skipping incomplete records
  const markers = useMemo(() => {
    try {
      return properties
        .filter(
          (property) =>
            property &&
            typeof property.latitude === "number" &&
            typeof property.longitude === "number" &&
            !Number.isNaN(property.latitude) &&
            !Number.isNaN(property.longitude)
        )
        .map((property) => ({
          id: property.id,
          position: [property.latitude as number, property.longitude as number] as Coordinates,
          property,
        }));
    } catch (error) {
      logger.error("Error creating markers", {
        context: "PropertiesMap",
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      return [];
    }
  }, [properties]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Opinionated map defaults that remove noisy controls while keeping the map interactive
  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      controlSize: 28,
      disableDefaultUI: false,
      gestureHandling: "greedy",
      backgroundColor: "#f8fafc",
    }),
    []
  );

  // Custom cluster look and feel so nearby listings group together with branded styling
  const clustererOptions = useMemo(
    () => ({
      styles: clusterStyles,
      minimumClusterSize: 2,
      maxZoom: 17,
      gridSize: 50,
      zoomOnClick: true,
      averageCenter: true,
    }),
    []
  );

  // Keeps the viewport focused on the active markers (and polygon if present)
  const fitMapToMarkers = useCallback(() => {
    if (typeof window === "undefined") return;
    const googleWindow = window as GoogleWindow;
    const map = mapRef.current;
    if (!map || !googleWindow.google?.maps) return;

    const bounds = new googleWindow.google.maps.LatLngBounds();
    let hasPoints = false;

    markers.forEach(({ position }) => {
      bounds.extend(toLatLngLiteral(position));
      hasPoints = true;
    });

    if (districtPolygon?.paths?.length) {
      districtPolygon.paths.forEach((ring) => {
        ring.forEach((point) => {
          bounds.extend(point);
          hasPoints = true;
        });
      });
    }

    if (!hasPoints) {
      map.setCenter(toLatLngLiteral(DEFAULT_CENTER));
      map.setZoom(DEFAULT_ZOOM);
      return;
    }

    if (markers.length === 1 && !districtPolygon?.paths?.length) {
      map.setCenter(toLatLngLiteral(markers[0].position));
      map.setZoom(SINGLE_MARKER_ZOOM);
      return;
    }

    const padding: google.maps.Padding = { top: 56, right: 56, bottom: 56, left: 56 };
    map.fitBounds(bounds, padding);
  }, [markers, districtPolygon]);

  // Cache the Google Map instance once it loads so we can imperatively adjust it later
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setIsMapReady(true);
      fitMapToMarkers();
    },
    [fitMapToMarkers]
  );

  // Clean up when the component unmounts so we do not hold on to stale references
  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
    setIsMapReady(false);
  }, []);

  // Whenever the markers or SSR hydration state changes, refit the map so the
  // viewport stays aligned with the latest data
  useEffect(() => {
    if (!isClient || !isMapReady) return;
    fitMapToMarkers();
  }, [fitMapToMarkers, isClient, isMapReady]);

  // Fly to the highlighted property so hovering the table keeps the map in sync
  useEffect(() => {
    if (!isClient || !isMapReady || !highlightedId) return;
    const map = mapRef.current;
    if (!map) return;

    const markerInfo = markers.find((marker) => marker.id === highlightedId);
    if (!markerInfo) return;

    const target = toLatLngLiteral(markerInfo.position);
    map.panTo(target);

    const currentZoom = map.getZoom?.() ?? DEFAULT_ZOOM;
    if (currentZoom < HIGHLIGHT_ZOOM) {
      map.setZoom(HIGHLIGHT_ZOOM);
    }
  }, [highlightedId, markers, isClient, isMapReady]);

  const heightClass = "h-[calc(100vh-240px)] min-h-[520px]";
  const googleInstance = typeof window === "undefined" ? undefined : (window as GoogleWindow).google;

  // Ensure Google Maps API is fully loaded before rendering
  const isGoogleMapsReady = isLoaded && googleInstance?.maps;

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border/60 bg-slate-100/70", heightClass)}>
      {!isClient ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          جار تجهيز الخريطة...
        </div>
      ) : !googleMapsApiKey ? (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-destructive">
          يرجى ضبط المتغير <code className="mx-1 rounded bg-muted px-2 py-1 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> لعرض الخريطة.
        </div>
      ) : scriptLoadError ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center text-sm text-destructive">
          <p>تعذر تحميل خريطة جوجل. يرجى المحاولة لاحقًا.</p>
          <p className="text-xs text-muted-foreground">حاول تحديث الصفحة أو التحقق من مفتاح Google Maps.</p>
        </div>
      ) : !isGoogleMapsReady ? (
        <div className="flex h-full w-full items-center justify-center bg-white/70 text-sm text-muted-foreground">
          جار تحميل خريطة جوجل...
        </div>
      ) : (
        <div className="relative h-full w-full">
          <GoogleMap
            mapContainerClassName="absolute inset-0 h-full w-full"
            options={mapOptions}
            onLoad={handleMapLoad}
            onUnmount={handleMapUnmount}
            center={toLatLngLiteral(DEFAULT_CENTER)}
            zoom={DEFAULT_ZOOM}
          >
            <MarkerClusterer options={clustererOptions}>
              {(clusterer) => (
                <>
                  {markers.map(({ id, position, property }) => {
                    const icon = createMarkerIcon(
                      googleInstance,
                      formatMarkerPrice(property.price),
                      highlightedId === id
                    );
                    return (
                      <Marker
                        key={id}
                        position={toLatLngLiteral(position)}
                        icon={icon}
                        clusterer={clusterer}
                        onClick={() => onSelect(property)}
                        onMouseOver={() => onSelect(property)}
                      />
                    );
                  })}
                </>
              )}
            </MarkerClusterer>
            {districtPolygon?.paths?.length ? (
              <Polygon
                paths={districtPolygon.paths}
                options={{
                  strokeColor: districtPolygon.isFilterMatch ? "#1d4ed8" : "#0f9d58",
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  fillColor: districtPolygon.isFilterMatch ? "rgba(37,99,235,0.22)" : "rgba(16,185,129,0.18)",
                  fillOpacity: districtPolygon.isFilterMatch ? 0.3 : 0.18,
                  clickable: false,
                }}
              />
            ) : null}
          </GoogleMap>

          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-muted-foreground">
              جار تجهيز الخريطة...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

