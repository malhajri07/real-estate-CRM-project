import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleMapProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  showLink?: boolean;
}

export function GoogleMap({ address, latitude, longitude, className = "", showLink = true }: GoogleMapProps) {
  // Create Google Maps URL for embedding
  const getMapUrl = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${latitude},${longitude}&zoom=15`;
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodedAddress}`;
    }
    return null;
  };

  // Create Google Maps link for opening in new tab
  const getMapLink = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
    return null;
  };

  const mapUrl = getMapUrl();
  const mapLink = getMapLink();

  if (!mapUrl) {
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
      {/* Fallback static map preview */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="mx-auto mb-2 text-primary" size={24} />
          <p className="text-sm font-medium">Map Preview</p>
          <p className="text-xs text-muted-foreground mt-1">
            {address || `${latitude}, ${longitude}`}
          </p>
        </div>
      </div>
      
      {/* Open in Google Maps link */}
      {showLink && mapLink && (
        <div className="absolute top-2 right-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border/50 rounded-lg"
            onClick={() => window.open(mapLink, '_blank')}
            data-testid="button-open-map"
          >
            <ExternalLink size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

// For properties with full Google Maps API integration (when API key is provided)
interface InteractiveMapProps extends GoogleMapProps {
  apiKey?: string;
}

export function InteractiveMap({ address, latitude, longitude, className = "", showLink = true, apiKey }: InteractiveMapProps) {
  if (!apiKey) {
    return <GoogleMap address={address} latitude={latitude} longitude={longitude} className={className} showLink={showLink} />;
  }

  const mapUrl = latitude && longitude 
    ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${latitude},${longitude}&zoom=15`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address || '')}`;

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className}`}>
      <iframe
        src={mapUrl}
        className="w-full h-full"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      
      {showLink && (
        <div className="absolute top-2 right-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border/50 rounded-lg"
            onClick={() => {
              const link = latitude && longitude 
                ? `https://www.google.com/maps?q=${latitude},${longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`;
              window.open(link, '_blank');
            }}
            data-testid="button-open-map"
          >
            <ExternalLink size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}