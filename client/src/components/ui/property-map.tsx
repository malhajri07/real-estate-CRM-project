import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyMapProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  showLink?: boolean;
}

export function PropertyMap({ address, latitude, longitude, className = "", showLink = true }: PropertyMapProps) {
  // Create Google Maps link for opening in new tab
  const getMapLink = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=16`;
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
    return null;
  };

  // Use OpenStreetMap with marker overlay for better visibility without API key
  const getMapImageUrl = () => {
    if (latitude && longitude) {
      // Using a combination of map tile service and custom marker
      const zoom = 15;
      const width = 400;
      const height = 250;
      
      // MapBox static API (free tier) or OpenStreetMap-based service
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-building+ff0000(${longitude},${latitude})/${longitude},${latitude},${zoom}/${width}x${height}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZnangifQ.-g_vE53SD2WrJ6tFX7QHmA`;
    }
    return null;
  };

  // Fallback to OSM tile-based map
  const getOSMMapUrl = () => {
    if (latitude && longitude) {
      const zoom = 15;
      // Using Leaflet with OpenStreetMap tiles
      return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    }
    return null;
  };

  const mapLink = getMapLink();
  const mapImageUrl = getMapImageUrl();
  const osmMapUrl = getOSMMapUrl();

  if (!latitude && !longitude && !address) {
    return (
      <div className={`bg-muted/30 rounded-xl border border-border flex items-center justify-center p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <MapPin className="mx-auto mb-2" size={24} />
          <p className="text-sm">No location data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`}>
      {/* Try embedded OSM map first */}
      {osmMapUrl ? (
        <iframe
          src={osmMapUrl}
          className="w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          title="Property Location Map"
          onError={(e) => {
            // Hide iframe and show fallback
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback display with location info and marker icon */}
      <div 
        className="bg-gradient-to-br from-blue-50 to-green-50 h-full flex items-center justify-center relative" 
        style={{ display: osmMapUrl ? 'none' : 'flex' }}
      >
        {/* Map background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="border border-muted-foreground/20"></div>
            ))}
          </div>
        </div>
        
        {/* Location marker */}
        <div className="text-center text-muted-foreground relative z-10">
          <div className="relative inline-block">
            <MapPin className="mx-auto mb-2 text-red-500 drop-shadow-sm" size={32} />
            {/* Pulsing animation for marker */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500/20 rounded-full animate-ping"></div>
          </div>
          <p className="text-sm font-medium text-foreground">Property Location</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
            {address || `${latitude}, ${longitude}`}
          </p>
          {latitude && longitude && (
            <p className="text-xs text-muted-foreground mt-1">
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          )}
        </div>
      </div>
      
      {/* Open in Google Maps link */}
      {showLink && mapLink && (
        <div className="absolute top-2 right-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border/50 rounded-lg apple-shadow apple-transition hover:scale-105"
            onClick={() => window.open(mapLink, '_blank')}
            data-testid="button-open-map"
            title="Open in Google Maps"
          >
            <ExternalLink size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}