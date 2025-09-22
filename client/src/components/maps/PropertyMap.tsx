import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
import type { Property } from "@shared/types";

const defaultIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const fallbackCenter: [number, number] = [24.7136, 46.6753];

export interface PropertyMapProps {
  properties: Property[];
  activeProperty?: Property | null;
  className?: string;
}

export function PropertyMap({ properties, activeProperty, className = "" }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const propertiesWithLocation = useMemo(() => {
    return (properties || []).filter((property) => {
      const lat = property.latitude ? Number(property.latitude) : undefined;
      const lng = property.longitude ? Number(property.longitude) : undefined;
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [properties]);

  const activePosition = useMemo(() => {
    if (!activeProperty) return null;
    const lat = activeProperty.latitude ? Number(activeProperty.latitude) : undefined;
    const lng = activeProperty.longitude ? Number(activeProperty.longitude) : undefined;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat!, lng!] as [number, number];
  }, [activeProperty]);

  const initialCenter = activePosition || (propertiesWithLocation.length > 0
    ? [Number(propertiesWithLocation[0].latitude), Number(propertiesWithLocation[0].longitude)]
    : fallbackCenter);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapInstanceRef.current);

    markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
  }, [initialCenter]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (propertiesWithLocation.length === 0) {
      map.setView(fallbackCenter, 6);
      return;
    }

    propertiesWithLocation.forEach((property) => {
      const lat = Number(property.latitude);
      const lng = Number(property.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(layerGroup);
      marker.bindPopup(
        `<div style="min-width: 180px; text-align: right;">
          <strong>${property.title ?? "بدون عنوان"}</strong><br />
          ${property.city ?? "غير محدد"}<br />
          ${property.price ? Number(property.price).toLocaleString("en-US") + " ﷼" : "بدون سعر"}
        </div>`
      );
    });

    const bounds = L.latLngBounds(
      propertiesWithLocation.map((property) => [Number(property.latitude), Number(property.longitude)] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
  }, [propertiesWithLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activePosition) return;
    map.flyTo(activePosition, 14, { duration: 0.8 });
  }, [activePosition]);

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className={`h-full w-full rounded-2xl border border-slate-200 ${className}`}
      style={{ minHeight: "240px" }}
    />
  );
}
