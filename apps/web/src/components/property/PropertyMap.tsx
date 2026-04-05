/**
 * PropertyMap.tsx — Map Placeholder Component for Property Detail
 *
 * Location: apps/web/src/components/property/PropertyMap.tsx
 *
 * Features:
 * - Shows address text prominently
 * - Lat/lng coordinate display
 * - "Open in Google Maps" link
 * - Placeholder map visual with pin icon
 * - Copy address to clipboard button
 * - Responsive layout
 *
 * Dependencies:
 * - @/components/ui/card
 * - @/components/ui/button
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useState, useCallback } from "react";
import {
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Navigation,
  Compass,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PropertyLocation {
  address?: string;
  city?: string;
  district?: string;
  region?: string;
  latitude?: number | string;
  longitude?: number | string;
  zipCode?: string;
}

export interface PropertyMapProps {
  location: PropertyLocation;
  className?: string;
  showCoordinates?: boolean;
  showCopyButton?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildFullAddress(loc: PropertyLocation): string {
  const parts: string[] = [];
  if (loc.address) parts.push(loc.address);
  if (loc.district) parts.push(loc.district);
  if (loc.city) parts.push(loc.city);
  if (loc.region) parts.push(loc.region);
  if (loc.zipCode) parts.push(loc.zipCode);
  return parts.join("، ") || "العنوان غير متوفر";
}

function buildGoogleMapsUrl(loc: PropertyLocation): string {
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);

  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }

  const query = encodeURIComponent(buildFullAddress(loc));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function formatCoordinate(value: number | string | undefined): string {
  if (value === undefined || value === null) return "--";
  const num = Number(value);
  if (isNaN(num)) return "--";
  return num.toFixed(6);
}

function hasCoordinates(loc: PropertyLocation): boolean {
  const lat = Number(loc.latitude);
  const lng = Number(loc.longitude);
  return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
}

// ─── Map Placeholder Visual ──────────────────────────────────────────────────

function MapPlaceholder({
  location,
  onOpenMaps,
}: {
  location: PropertyLocation;
  onOpenMaps: () => void;
}) {
  const hasCoords = hasCoordinates(location);

  return (
    <div
      className="relative w-full h-48 md:h-64 bg-gradient-to-br from-primary/10 to-accent dark:from-primary/30 dark:to-primary/30 rounded-xl border border-border overflow-hidden cursor-pointer group"
      onClick={onOpenMaps}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpenMaps()}
      aria-label="فتح الخريطة"
    >
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGrid)" className="text-muted-foreground" />
        </svg>
      </div>

      {/* Roads visual */}
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-muted-foreground" />
        <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-muted-foreground" />
        <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-muted-foreground" />
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted-foreground" />
        <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-muted-foreground" />
      </div>

      {/* Center pin */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Pin shadow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/20 rounded-full blur-sm" />

          {/* Pin icon */}
          <div className="relative flex flex-col items-center animate-bounce">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/100 shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-destructive -mt-0.5" />
          </div>
        </div>
      </div>

      {/* Compass rose */}
      <div className="absolute top-3 end-3 opacity-30">
        <Compass className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-center pb-3">
        <div className="bg-white/90 dark:bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="h-4 w-4" />
          {hasCoords ? "فتح في خرائط Google" : "البحث في خرائط Google"}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PropertyMap({
  location,
  className,
  showCoordinates = true,
  showCopyButton = true,
}: PropertyMapProps) {
  const [copied, setCopied] = useState(false);

  const fullAddress = buildFullAddress(location);
  const googleMapsUrl = buildGoogleMapsUrl(location);
  const hasCoords = hasCoordinates(location);

  const openMaps = useCallback(() => {
    window.open(googleMapsUrl, "_blank", "noopener,noreferrer");
  }, [googleMapsUrl]);

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = fullAddress;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [fullAddress]);

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          الموقع
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {/* Map placeholder */}
        <MapPlaceholder location={location} onOpenMaps={openMaps} />

        {/* Address */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {fullAddress}
              </p>
              {location.city && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[location.district, location.city, location.region]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              )}
            </div>
          </div>

          {/* Coordinates */}
          {showCoordinates && hasCoords && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span dir="ltr" className="font-mono">
                {formatCoordinate(location.latitude)},{" "}
                {formatCoordinate(location.longitude)}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openMaps}
          >
            <ExternalLink className="h-4 w-4" />
            فتح في الخريطة
          </Button>

          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={copyAddress}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  نسخ العنوان
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PropertyMap;
