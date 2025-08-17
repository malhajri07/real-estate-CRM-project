import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoCarouselProps {
  photos: string[];
  alt: string;
  className?: string;
  showIndicators?: boolean;
  autoHeight?: boolean;
}

export function PhotoCarousel({ 
  photos, 
  alt, 
  className = "", 
  showIndicators = true,
  autoHeight = false 
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center ${className}`}>
        <span className="text-slate-400">لا توجد صور</span>
      </div>
    );
  }

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {/* Main Photo */}
      <div className={`relative ${autoHeight ? 'h-auto' : 'aspect-video'}`}>
        <img 
          src={photos[currentIndex]} 
          alt={`${alt} - صورة ${currentIndex + 1}`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        
        {/* Navigation Arrows - only show if more than 1 photo */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevPhoto}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextPhoto}
            >
              <ChevronRight size={16} />
            </Button>
          </>
        )}
        
        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
      
      {/* Photo Indicators */}
      {showIndicators && photos.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 space-x-reverse">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToPhoto(index, e)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white shadow-md' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}