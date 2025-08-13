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

  // Create embedded map URL with location marker
  const getEmbedUrl = () => {
    if (latitude && longitude) {
      // Create Google Maps embed URL with marker at the specific coordinates
      return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1500!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zJTI3${latitude}%2C${longitude}!5e0!3m2!1sen!2s!4v1234567890!5m2!1sen!2s`;
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${encodedAddress}!5e0!3m2!1sen!2s!4v1234567890!5m2!1sen!2s`;
    }
    return null;
  };

  const mapLink = getMapLink();
  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
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
      {/* Embedded Google Map iframe */}
      <iframe
        src={embedUrl}
        className="w-full h-full"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Property Location Map"
      />
      
      {/* Open in Google Maps link */}
      {showLink && mapLink && (
        <div className="absolute top-2 right-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border/50 rounded-lg apple-shadow"
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

// Enhanced Google Map component with better embed URLs
export function StaticGoogleMap({ address, latitude, longitude, className = "", showLink = true }: GoogleMapProps) {
  const getStaticMapUrl = () => {
    if (latitude && longitude) {
      // Using Google Static Maps API with custom red marker
      return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=16&size=400x300&maptype=roadmap&markers=color:red%7Csize:mid%7C${latitude},${longitude}&style=feature:poi%7Cvisibility:off`;
    }
    return null;
  };

  const getMapLink = () => {
    if (latitude && longitude) {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }
    return null;
  };

  const staticMapUrl = getStaticMapUrl();
  const mapLink = getMapLink();

  if (!staticMapUrl && !address) {
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
      {staticMapUrl ? (
        <img 
          src={staticMapUrl} 
          alt="Property location map"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to address display if image fails
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
      ) : null}
      
      {/* Fallback display */}
      <div className="bg-gradient-to-br from-blue-50 to-green-50 h-full flex items-center justify-center" style={{ display: staticMapUrl ? 'none' : 'flex' }}>
        <div className="text-center text-muted-foreground">
          <MapPin className="mx-auto mb-2 text-primary" size={24} />
          <p className="text-sm font-medium">Map Location</p>
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
            className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border/50 rounded-lg apple-shadow"
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