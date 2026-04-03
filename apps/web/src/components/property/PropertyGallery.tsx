/**
 * PropertyGallery.tsx — Image Gallery for Property Detail Page
 *
 * Location: apps/web/src/components/property/PropertyGallery.tsx
 *
 * Features:
 * - Grid layout (2x3 on desktop, 1 col on mobile)
 * - Click to enlarge in a modal lightbox
 * - Navigation arrows (prev/next)
 * - Image counter overlay
 * - Placeholder for no images
 * - Loading skeleton state
 *
 * Dependencies:
 * - @/components/ui/dialog
 * - @/components/ui/button
 * - @/components/ui/skeleton
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ImageOff,
  Maximize2,
  Camera,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface PropertyGalleryProps {
  images: GalleryImage[];
  isLoading?: boolean;
  maxGridImages?: number;
  className?: string;
  propertyTitle?: string;
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden">
      {/* Main large image */}
      <div className="md:col-span-2 md:row-span-2">
        <Skeleton className="w-full h-64 md:h-[420px] rounded-none" />
      </div>
      {/* Side images */}
      <Skeleton className="w-full h-32 md:h-[206px] rounded-none hidden md:block" />
      <Skeleton className="w-full h-32 md:h-[206px] rounded-none hidden md:block" />
      {/* Bottom row */}
      <Skeleton className="w-full h-32 rounded-none hidden md:block" />
      <Skeleton className="w-full h-32 rounded-none hidden md:block" />
      <Skeleton className="w-full h-32 rounded-none hidden md:block" />
    </div>
  );
}

// ─── No Images Placeholder ───────────────────────────────────────────────────

function NoImagesPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-muted/40 border-2 border-dashed border-border rounded-2xl py-20 px-8 text-center",
        className
      )}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
        <ImageOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">
        لا توجد صور متاحة
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        لم يتم تحميل صور لهذا العقار بعد. سيتم عرض الصور هنا بمجرد إضافتها.
      </p>
    </div>
  );
}

// ─── Single Gallery Image ────────────────────────────────────────────────────

function GalleryImageTile({
  image,
  onClick,
  className,
  showOverlay,
  overlayText,
}: {
  image: GalleryImage;
  onClick: () => void;
  className?: string;
  showOverlay?: boolean;
  overlayText?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={cn(
          "relative bg-muted flex items-center justify-center cursor-pointer group overflow-hidden",
          className
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
        aria-label={image.alt ?? "صورة العقار"}
      >
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative cursor-pointer group overflow-hidden",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={image.alt ?? "صورة العقار"}
    >
      <img
        src={image.url}
        alt={image.alt ?? "صورة العقار"}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={() => setHasError(true)}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
        <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Count overlay for "+N more" */}
      {showOverlay && overlayText && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center text-white">
            <Camera className="h-6 w-6 mx-auto mb-1" />
            <span className="text-lg font-bold">{overlayText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Lightbox Modal ──────────────────────────────────────────────────────────

function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  propertyTitle,
}: {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  propertyTitle?: string;
}) {
  const current = images[currentIndex];
  if (!current) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(currentIndex - 1);
  }, [currentIndex, hasPrev, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(currentIndex + 1);
  }, [currentIndex, hasNext, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, goPrev, goNext, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none flex flex-col">
        <DialogTitle className="sr-only">
          {propertyTitle ?? "معرض صور العقار"}
        </DialogTitle>

        {/* Top bar */}
        <div className="flex items-center justify-between p-4 text-white">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
          {current.caption && (
            <span className="text-sm text-white/70 text-center flex-1 mx-4 truncate">
              {current.caption}
            </span>
          )}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>

        {/* Image area */}
        <div className="flex-1 relative flex items-center justify-center px-12 pb-4 min-h-0">
          <img
            src={current.url}
            alt={current.alt ?? `صورة ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
          />

          {/* Navigation arrows */}
          {hasPrev && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute start-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={goPrev}
              aria-label="الصورة السابقة"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={goNext}
              aria-label="الصورة التالية"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1.5 px-4 pb-4 overflow-x-auto justify-center">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => onNavigate(idx)}
                className={cn(
                  "w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                  idx === currentIndex
                    ? "border-white opacity-100"
                    : "border-transparent opacity-50 hover:opacity-80"
                )}
              >
                <img
                  src={img.url}
                  alt={`مصغر ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Gallery Component ──────────────────────────────────────────────────

export function PropertyGallery({
  images,
  isLoading = false,
  maxGridImages = 5,
  className,
  propertyTitle,
}: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  if (isLoading) {
    return <GallerySkeleton />;
  }

  if (!images || images.length === 0) {
    return <NoImagesPlaceholder className={className} />;
  }

  const visibleImages = images.slice(0, maxGridImages);
  const remainingCount = images.length - maxGridImages;

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-1.5 rounded-2xl overflow-hidden",
          className
        )}
      >
        {/* Main hero image — spans 2 columns and 2 rows on desktop */}
        {visibleImages.length > 0 && (
          <GalleryImageTile
            image={visibleImages[0]}
            onClick={() => openLightbox(0)}
            className="md:col-span-2 md:row-span-2 h-64 md:h-[420px]"
          />
        )}

        {/* Side images */}
        {visibleImages.slice(1, 3).map((img, idx) => (
          <GalleryImageTile
            key={img.id}
            image={img}
            onClick={() => openLightbox(idx + 1)}
            className="h-40 md:h-[206px] hidden md:block"
          />
        ))}

        {/* Bottom row */}
        {visibleImages.slice(3).map((img, idx) => {
          const absoluteIdx = idx + 3;
          const isLast = absoluteIdx === visibleImages.length - 1;
          const showMore = isLast && remainingCount > 0;

          return (
            <GalleryImageTile
              key={img.id}
              image={img}
              onClick={() => openLightbox(absoluteIdx)}
              className="h-32 hidden md:block"
              showOverlay={showMore}
              overlayText={showMore ? `+${remainingCount}` : undefined}
            />
          );
        })}

        {/* Mobile: show count badge */}
        {images.length > 1 && (
          <div className="md:hidden flex items-center justify-center py-2">
            <button
              onClick={() => openLightbox(0)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Camera className="h-4 w-4" />
              عرض جميع الصور ({images.length})
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNavigate={setLightboxIndex}
        propertyTitle={propertyTitle}
      />
    </>
  );
}

export default PropertyGallery;
