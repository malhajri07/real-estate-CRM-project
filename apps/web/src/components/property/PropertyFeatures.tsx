/**
 * PropertyFeatures.tsx — Property Features Grid Component
 *
 * Location: apps/web/src/components/property/PropertyFeatures.tsx
 *
 * Features:
 * - Primary specs: bedrooms, bathrooms, living rooms, area
 * - Secondary specs: year built, floor number
 * - Amenities: parking, elevator, pool, garden, security, AC, balcony, etc.
 * - Each feature as icon + label + value card
 * - Responsive grid layout
 * - Empty state when no features
 *
 * Dependencies:
 * - @/components/ui/card
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React from "react";
import {
  BedDouble,
  Bath,
  Sofa,
  Maximize,
  Calendar,
  Building2,
  Car,
  ArrowUp,
  Waves,
  Trees,
  Shield,
  Snowflake,
  Wind,
  Fence,
  type LucideIcon,
  Warehouse,
  Dumbbell,
  Wifi,
  Flame,
  Droplets,
  Eye,
  Sun,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PropertySpecsData {
  bedrooms?: number;
  bathrooms?: number;
  livingRooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  floorNumber?: number;
  totalFloors?: number;
  lotSize?: number;
  garageSpaces?: number;
}

export type AmenityKey =
  | "parking"
  | "elevator"
  | "pool"
  | "garden"
  | "security"
  | "ac"
  | "balcony"
  | "storage"
  | "gym"
  | "internet"
  | "centralHeating"
  | "waterTank"
  | "view"
  | "rooftop"
  | "fence";

export interface PropertyFeaturesProps {
  specs: PropertySpecsData;
  amenities?: AmenityKey[];
  features?: string[];
  className?: string;
}

// ─── Feature Configuration ───────────────────────────────────────────────────

interface SpecConfig {
  icon: LucideIcon;
  label: string;
  unit?: string;
  format?: (value: number) => string;
}

const SPEC_CONFIGS: Record<keyof PropertySpecsData, SpecConfig> = {
  bedrooms: {
    icon: BedDouble,
    label: "غرف النوم",
    format: (v) => `${v} غرفة`,
  },
  bathrooms: {
    icon: Bath,
    label: "دورات المياه",
    format: (v) => `${v} حمام`,
  },
  livingRooms: {
    icon: Sofa,
    label: "غرف المعيشة",
    format: (v) => `${v} صالة`,
  },
  squareFeet: {
    icon: Maximize,
    label: "المساحة",
    format: (v) => `${v.toLocaleString("ar-SA")} م²`,
  },
  yearBuilt: {
    icon: Calendar,
    label: "سنة البناء",
    format: (v) => `${v}`,
  },
  floorNumber: {
    icon: Building2,
    label: "الطابق",
    format: (v) => `${v}`,
  },
  totalFloors: {
    icon: Building2,
    label: "عدد الطوابق",
    format: (v) => `${v} طابق`,
  },
  lotSize: {
    icon: Maximize,
    label: "مساحة الأرض",
    format: (v) => `${v.toLocaleString("ar-SA")} م²`,
  },
  garageSpaces: {
    icon: Car,
    label: "مواقف السيارات",
    format: (v) => `${v} موقف`,
  },
};

interface AmenityConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

const AMENITY_CONFIGS: Record<AmenityKey, AmenityConfig> = {
  parking: {
    icon: Car,
    label: "مواقف سيارات",
    color: "text-accent-foreground",
    bgColor: "bg-accent dark:bg-accent-foreground/40",
  },
  elevator: {
    icon: ArrowUp,
    label: "مصعد",
    color: "text-secondary-foreground",
    bgColor: "bg-secondary dark:bg-secondary-foreground/40",
  },
  pool: {
    icon: Waves,
    label: "مسبح",
    color: "text-accent-foreground",
    bgColor: "bg-accent dark:bg-primary/40",
  },
  garden: {
    icon: Trees,
    label: "حديقة",
    color: "text-primary",
    bgColor: "bg-primary/15 dark:bg-primary/90/40",
  },
  security: {
    icon: Shield,
    label: "حراسة أمنية",
    color: "text-destructive",
    bgColor: "bg-destructive/15 dark:bg-destructive/90/40",
  },
  ac: {
    icon: Snowflake,
    label: "تكييف مركزي",
    color: "text-accent-foreground",
    bgColor: "bg-accent dark:bg-primary/90/40",
  },
  balcony: {
    icon: Wind,
    label: "شرفة",
    color: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning)/0.15)] dark:bg-[hsl(var(--warning))]/40",
  },
  storage: {
    icon: Warehouse,
    label: "مستودع",
    color: "text-stone-600",
    bgColor: "bg-stone-100 dark:bg-stone-950/40",
  },
  gym: {
    icon: Dumbbell,
    label: "صالة رياضية",
    color: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning)/0.15)] dark:bg-[hsl(var(--warning))]/40",
  },
  internet: {
    icon: Wifi,
    label: "إنترنت",
    color: "text-accent-foreground",
    bgColor: "bg-accent dark:bg-accent-foreground/40",
  },
  centralHeating: {
    icon: Flame,
    label: "تدفئة مركزية",
    color: "text-destructive",
    bgColor: "bg-destructive/15 dark:bg-destructive/90/40",
  },
  waterTank: {
    icon: Droplets,
    label: "خزان ماء",
    color: "text-primary",
    bgColor: "bg-primary/15 dark:bg-primary/90/40",
  },
  view: {
    icon: Eye,
    label: "إطلالة مميزة",
    color: "text-secondary-foreground",
    bgColor: "bg-secondary dark:bg-secondary-foreground/40",
  },
  rooftop: {
    icon: Sun,
    label: "سطح",
    color: "text-[hsl(var(--warning))]",
    bgColor: "bg-[hsl(var(--warning)/0.15)] dark:bg-[hsl(var(--warning))]/40",
  },
  fence: {
    icon: Fence,
    label: "سور خارجي",
    color: "text-lime-700",
    bgColor: "bg-lime-100 dark:bg-lime-950/40",
  },
};

// ─── Spec Card ───────────────────────────────────────────────────────────────

function SpecCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Amenity Badge ───────────────────────────────────────────────────────────

function AmenityBadge({
  config,
}: {
  config: AmenityConfig;
}) {
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-shadow hover:shadow-sm",
        config.bgColor
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
      <span className={config.color}>{config.label}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PropertyFeatures({
  specs,
  amenities = [],
  features = [],
  className,
}: PropertyFeaturesProps) {
  // Build spec items from data
  const specItems: { key: string; icon: LucideIcon; label: string; value: string }[] = [];

  for (const [key, config] of Object.entries(SPEC_CONFIGS)) {
    const rawValue = specs[key as keyof PropertySpecsData];
    if (rawValue !== undefined && rawValue !== null && rawValue !== 0) {
      const formatted = config.format
        ? config.format(rawValue)
        : `${rawValue}`;
      specItems.push({ key, icon: config.icon, label: config.label, value: formatted });
    }
  }

  // Map amenity keys to configs
  const amenityItems: { key: string; config: AmenityConfig }[] = [];
  for (const key of amenities) {
    const config = AMENITY_CONFIGS[key];
    if (config) {
      amenityItems.push({ key, config });
    }
  }

  // Additional string features (not in predefined amenities)
  const knownAmenityLabels = new Set(Object.values(AMENITY_CONFIGS).map((c) => c.label));
  const extraFeatures = features.filter((f) => !knownAmenityLabels.has(f));

  const hasContent = specItems.length > 0 || amenityItems.length > 0 || extraFeatures.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-lg font-bold">المواصفات والمميزات</CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-6">
        {/* Primary Specs Grid */}
        {specItems.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              المواصفات الرئيسية
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {specItems.map((item) => (
                <SpecCard
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {amenityItems.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              المرافق والخدمات
            </h4>
            <div className="flex flex-wrap gap-2">
              {amenityItems.map((item) => (
                <AmenityBadge key={item.key} config={item.config} />
              ))}
            </div>
          </div>
        )}

        {/* Extra Features */}
        {extraFeatures.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
              ميزات إضافية
            </h4>
            <div className="flex flex-wrap gap-2">
              {extraFeatures.map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PropertyFeatures;
