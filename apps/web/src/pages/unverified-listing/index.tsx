/**
 * unverified-listing.tsx - Public Unverified Listing Submission Page
 *
 * Location: apps/web/src/ → Pages/ → Public Pages → unverified-listing.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 *
 * Public unverified listing submission page. Provides:
 * - Unverified listing submission form
 * - Property information input
 * - Image upload
 *
 * Route: /unverified-listings
 *
 * Related Files:
 * - apps/web/src/pages/unverified-listings-management.tsx - Management interface
 * - apps/api/routes/unverified-listings.ts - Unverified listings API routes
 *
 */

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Home, UploadCloud, X, ChevronsUpDown, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import PublicHeader from "@/components/layout/PublicHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { GeographyItem } from "./types";

const LISTING_TYPES = [
  { value: "بيع", label: "بيع" },
  { value: "إيجار", label: "إيجار" },
];

const MAX_IMAGE_COUNT = 10;
const MAX_IMAGE_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB total

// Step definitions
const STEPS = [
  { id: 1, title: "البيانات الأساسية", description: "عنوان العقار، الفئة، النوع، والسعر" },
  { id: 2, title: "الموقع", description: "المنطقة، المدينة، والحي" },
  { id: 3, title: "المواصفات", description: "الغرف، الحمامات، المساحة، والتفاصيل" },
  { id: 4, title: "المرافق", description: "المميزات والخدمات المتاحة" },
  { id: 5, title: "الصور", description: "صور العقار" },
  { id: 6, title: "معلومات التواصل", description: "بيانات الاتصال" },
];

// --- Zod schema for all form fields ---
const listingFormSchema = z.object({
  // Step 1: Basic Information
  title: z.string().min(1, "عنوان الإعلان مطلوب"),
  description: z.string().optional().default(""),
  propertyCategory: z.string().min(1, "فئة العقار مطلوبة"),
  propertyType: z.string().min(1, "نوع العقار مطلوب"),
  listingType: z.string().min(1, "نوع العرض مطلوب"),
  price: z.string().min(1, "السعر مطلوب").refine(
    (val) => { const n = Number(val); return !isNaN(n) && n > 0; },
    { message: "يرجى إدخال سعر صحيح" }
  ),

  // Step 2: Location
  region: z.string().optional().default(""),
  city: z.string().min(1, "المدينة مطلوبة"),
  district: z.string().optional().default(""),
  streetAddress: z.string().optional().default(""),
  latitude: z.string().optional().default(""),
  longitude: z.string().optional().default(""),

  // Step 3: Specifications
  bedrooms: z.string().optional().default(""),
  bathrooms: z.string().optional().default(""),
  livingRooms: z.string().optional().default(""),
  kitchens: z.string().optional().default(""),
  floorNumber: z.string().optional().default(""),
  totalFloors: z.string().optional().default(""),
  areaSqm: z.string().optional().default(""),
  buildingYear: z.string().optional().default(""),
  paymentFrequency: z.string().optional().default(""),

  // Step 4: Amenities
  hasParking: z.boolean().default(false),
  hasElevator: z.boolean().default(false),
  hasMaidsRoom: z.boolean().default(false),
  hasDriverRoom: z.boolean().default(false),
  furnished: z.boolean().default(false),
  balcony: z.boolean().default(false),
  swimmingPool: z.boolean().default(false),
  centralAc: z.boolean().default(false),

  // Step 5: Media (images handled separately as File[])
  // videoClipUrl is a text field in step 5 context but stored in contact step
  // Actually videoClipUrl is part of the form state
  videoClipUrl: z.string().optional().default(""),

  // Step 6: Contact
  contactName: z.string().optional().default(""),
  mobileNumber: z.string().min(7, "رقم الجوال مطلوب ويجب أن يكون 7 أحرف على الأقل"),
  currency: z.string().default("SAR"),
});

type ListingFormValues = z.infer<typeof listingFormSchema>;

// Fields to validate per step (used with form.trigger)
const STEP_FIELDS: Record<number, (keyof ListingFormValues)[]> = {
  1: ["title", "propertyCategory", "propertyType", "listingType", "price"],
  2: ["city"],
  3: [], // optional
  4: [], // optional
  5: [], // optional
  6: ["mobileNumber"],
};

const DEFAULT_VALUES: ListingFormValues = {
  title: "",
  description: "",
  propertyCategory: "",
  propertyType: "",
  listingType: "",
  price: "",
  region: "",
  city: "",
  district: "",
  streetAddress: "",
  latitude: "",
  longitude: "",
  bedrooms: "",
  bathrooms: "",
  livingRooms: "",
  kitchens: "",
  floorNumber: "",
  totalFloors: "",
  areaSqm: "",
  buildingYear: "",
  paymentFrequency: "",
  hasParking: false,
  hasElevator: false,
  hasMaidsRoom: false,
  hasDriverRoom: false,
  furnished: false,
  balcony: false,
  swimmingPool: false,
  centralAc: false,
  videoClipUrl: "",
  contactName: "",
  mobileNumber: "",
  currency: "SAR",
};

export default function UnverifiedListingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  // UI-only state (not form data)
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [regionOpen, setRegionOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const watchRegion = form.watch("region");
  const watchCity = form.watch("city");
  const watchPropertyCategory = form.watch("propertyCategory");
  const watchPropertyType = form.watch("propertyType");
  const watchDistrict = form.watch("district");

  // Fetch regions, cities, districts
  const { data: regions } = useQuery<GeographyItem[]>({
    queryKey: ["/api/regions"],
    queryFn: async () => {
      const response = await fetch("/api/locations/regions");
      if (!response.ok) throw new Error("Failed to fetch regions");
      return response.json();
    },
  });

  const { data: cities } = useQuery<GeographyItem[]>({
    queryKey: ["/api/locations/cities", watchRegion],
    queryFn: async () => {
      if (!watchRegion) return [];
      const response = await fetch(`/api/locations/cities?regionId=${watchRegion}`);
      if (!response.ok) {
        console.error("Failed to fetch cities:", response.status, response.statusText);
        throw new Error("Failed to fetch cities");
      }
      return response.json();
    },
    enabled: !!watchRegion,
    staleTime: 10 * 60 * 1000,
  });

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: (RequestInit & { timeout?: number }) = {}
  ) => {
    const { timeout = 30000, ...rest } = init;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(input, { ...rest, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  // Fetch districts based on selected city
  const { data: districts, isLoading: districtsLoading, error: districtsError } = useQuery<GeographyItem[]>({
    queryKey: ["/api/locations/districts", watchCity],
    queryFn: async () => {
      if (!watchCity) return [];
      const response = await fetch(`/api/locations/districts?cityId=${watchCity}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch districts:", response.status, errorText);
        throw new Error(`Failed to fetch districts: ${response.status}`);
      }
      const data = await response.json();
      return data;
    },
    enabled: !!watchCity,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch property categories
  const { data: propertyCategories, isLoading: categoriesLoading, error: categoriesError } = useQuery<GeographyItem[]>({
    queryKey: ["/api/property-categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/property-categories");
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch property categories:", response.status, errorText);
          throw new Error(`Failed to fetch property categories: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching property categories:", error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch property types filtered by selected category
  const { data: propertyTypes, isLoading: typesLoading, error: typesError } = useQuery<GeographyItem[]>({
    queryKey: ["/api/property-types", watchPropertyCategory],
    queryFn: async () => {
      if (!watchPropertyCategory) return [];
      try {
        const response = await fetch(`/api/property-types?categoryCode=${watchPropertyCategory}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch property types:", response.status, errorText);
          throw new Error(`Failed to fetch property types: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching property types:", error);
        throw error;
      }
    },
    enabled: !!watchPropertyCategory,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Deduplicate helper
  const deduplicate = <T extends { id?: unknown; code?: unknown }>(arr: T[]): T[] => {
    if (!arr) return [];
    const seen = new Set<unknown>();
    return arr.filter((item) => {
      const key = item.id || item.code;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const uniquePropertyCategories = useMemo(() => deduplicate(propertyCategories || []), [propertyCategories]);
  const uniquePropertyTypes = useMemo(() => deduplicate(propertyTypes || []), [propertyTypes]);
  const uniqueRegions = useMemo(() => deduplicate(regions || []), [regions]);

  // Filter cities and districts based on selected region
  const filteredCities = useMemo(() => {
    const rawCities = watchRegion
      ? cities?.filter((city) => city.regionId === Number(watchRegion)) || []
      : cities || [];
    return deduplicate(rawCities);
  }, [cities, watchRegion]);

  // Districts are already filtered by cityId from the API query, so we use them directly
  const filteredDistricts = useMemo(() => deduplicate(districts || []), [districts]);

  // Step validation using react-hook-form trigger
  const validateCurrentStep = async (): Promise<boolean> => {
    const fields = STEP_FIELDS[currentStep];
    if (!fields || fields.length === 0) return true;
    return form.trigger(fields);
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (stepNumber: number) => {
    // Only allow clicking on completed steps or the next available step
    const maxAllowedStep = completedSteps.length + 1;
    if (stepNumber <= maxAllowedStep && stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Ensure back button returns to landing page
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/unverified-listings') {
      window.history.replaceState({ from: 'landing' }, '', '/');
      window.history.pushState({ from: 'unverified-listings' }, '', '/unverified-listings');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.from === 'landing' || window.location.pathname === '/') {
        setLocation('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setLocation]);

  const readAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filesArray = Array.from(files);

    if (selectedImages.length + filesArray.length > MAX_IMAGE_COUNT) {
      toast({
        title: "عدد الصور",
        description: `يمكن رفع حتى ${MAX_IMAGE_COUNT} صورة فقط`,
        variant: "destructive",
      });
      return;
    }

    let totalSize = selectedImages.reduce((sum, img) => sum + img.size, 0);
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of filesArray) {
      if (selectedImages.length + newFiles.length >= MAX_IMAGE_COUNT) break;

      totalSize += file.size;
      if (totalSize > MAX_IMAGE_TOTAL_SIZE_BYTES) {
        toast({
          title: "حجم الصور",
          description: `إجمالي حجم الصور يجب أن يكون أقل من ${MAX_IMAGE_TOTAL_SIZE_BYTES / (1024 * 1024)} ميجابايت`,
          variant: "destructive",
        });
        break;
      }

      newFiles.push(file);
      try {
        const dataUrl = await readAsDataUrl(file);
        newPreviews.push(dataUrl);
      } catch (error) {
        console.error("Error reading image:", error);
      }
    }

    if (newFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }

    event.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const url = prev[index];
      if (url.startsWith("data:")) {
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (values: ListingFormValues) => {
    try {
      setLoading(true);

      const imageDataUrls: string[] = [];
      for (const file of selectedImages) {
        try {
          const dataUrl = await readAsDataUrl(file);
          imageDataUrls.push(dataUrl);
        } catch (error) {
          console.error("Error converting image to base64:", error);
        }
      }

      const optionalText = (value: string | undefined) => {
        const trimmed = (value || "").trim();
        return trimmed.length ? trimmed : undefined;
      };

      const optionalNumber = (value: string | undefined) => {
        const trimmed = (value || "").trim();
        if (!trimmed.length) return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const getRegionName = () => {
        if (!values.region) return undefined;
        const region = (regions || []).find((r) => String(r.id) === values.region);
        return region ? (region.nameAr || region.nameEn || region.name) : values.region;
      };

      const getCityName = () => {
        if (!values.city) return "";
        const city = (filteredCities || []).find((c) => String(c.id) === values.city);
        if (city) {
          return city.nameAr || city.nameEn || city.name || "";
        }
        return values.city;
      };

      const getDistrictName = () => {
        if (!values.district) return undefined;
        // Search in full districts array, not just filteredDistricts, to ensure we find the district
        const district = (districts || []).find((d) => String(d.id) === values.district);
        return district ? (district.nameAr || district.nameEn || district.name) : values.district;
      };

      const payload: Record<string, unknown> = {
        title: values.title.trim(),
        description: optionalText(values.description),
        propertyCategory: values.propertyCategory,
        propertyType: values.propertyType,
        listingType: values.listingType,
        country: "Saudi Arabia",
        region: getRegionName() || undefined,
        city: getCityName() || (values.city ? values.city.trim() : ""),
        district: getDistrictName() || undefined,
        streetAddress: optionalText(values.streetAddress),
        latitude: optionalNumber(values.latitude),
        longitude: optionalNumber(values.longitude),
        bedrooms: optionalNumber(values.bedrooms),
        bathrooms: optionalNumber(values.bathrooms),
        livingRooms: optionalNumber(values.livingRooms),
        kitchens: optionalNumber(values.kitchens),
        floorNumber: optionalNumber(values.floorNumber),
        totalFloors: optionalNumber(values.totalFloors),
        areaSqm: optionalNumber(values.areaSqm),
        buildingYear: optionalNumber(values.buildingYear),
        hasParking: values.hasParking,
        hasElevator: values.hasElevator,
        hasMaidsRoom: values.hasMaidsRoom,
        hasDriverRoom: values.hasDriverRoom,
        furnished: values.furnished,
        balcony: values.balcony,
        swimmingPool: values.swimmingPool,
        centralAc: values.centralAc,
        price: Number(values.price),
        currency: values.currency,
        paymentFrequency: optionalText(values.paymentFrequency),
        imageGallery: imageDataUrls,
        videoClipUrl: optionalText(values.videoClipUrl),
        contactName: optionalText(values.contactName),
        mobileNumber: values.mobileNumber.trim(),
        status: "Pending",
      };

      const response = await fetchWithTimeout("/api/unverified-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMessage = responseData?.message || "تعذر إنشاء الإعلان";
          type ApiError = { path?: unknown; message?: string };
        const relevantErrors = (responseData?.errors || []).filter((e: unknown) => {
          const err = e as ApiError;
          const pathStr = Array.isArray(err.path) ? err.path.join('.') : String(err.path || '').toLowerCase();
          return !pathStr.includes('propertycategory') &&
            !pathStr.includes('property_category') &&
            !pathStr.includes('property-category');
        });

        if (relevantErrors.length > 0) {
          const firstError = relevantErrors[0] as ApiError;
          const fieldName = Array.isArray(firstError.path) ? firstError.path.join('.') : String(firstError.path || 'حقل');
          errorMessage = `يرجى التحقق من حقل "${fieldName}": ${firstError.message}`;
        }

        throw new Error(errorMessage);
      }

      toast({ title: "تم الإرسال", description: "تم تسجيل إعلانك بنجاح" });
      const extractedPropertyId = responseData?.propertyId || responseData?.id || null;
      setPropertyId(extractedPropertyId);
      form.reset(DEFAULT_VALUES);
      setSubmitted(true);
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      if (err?.name === "AbortError") {
        toast({ title: "انتهت المهلة", description: "انتهى وقت الإرسال قبل وصول الرد. حاول مرة أخرى.", variant: "destructive" });
      } else {
        toast({ title: "خطأ", description: err?.message || "حدث خطأ غير متوقع", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Validate all step 6 fields first
    const step6Valid = await form.trigger(STEP_FIELDS[6]);
    if (!step6Valid) {
      setCurrentStep(6);
      return;
    }
    // Trigger full form validation and submit
    form.handleSubmit(onSubmit)(event);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden">
        
        <PublicHeader />

        <main className="pt-20 pb-12 px-4 flex items-center justify-center min-h-[80vh]">

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl"
          >
            <div className="rounded-xl border bg-card p-8 md:p-12 text-center shadow-sm relative overflow-hidden">
              

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary"
              >
                <CheckCircle2 className="h-10 w-10" />
              </motion.div>

              <h1 className="text-xl font-bold text-foreground mb-3">تم استلام إعلانك بنجاح</h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg mx-auto">
                شكراً لثقتك بنا. سيقوم أحد الوسطاء المرخصين بمراجعة إعلانك والاتصال بك قريباً لإتمام عملية النشر.
              </p>

              {propertyId && (
                <div className="mb-10 inline-block bg-primary/5 border border-primary/10 rounded-2xl px-8 py-4">
                  <p className="text-sm font-bold text-foreground mb-1">رقم الإعلان الخاص بك</p>
                  <p className="text-xl font-bold text-primary font-mono tracking-widest">{propertyId}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {
                    setSubmitted(false);
                    setCurrentStep(1);
                    setCompletedSteps([]);
                    form.reset(DEFAULT_VALUES);
                    setSelectedImages([]);
                    setImagePreviews([]);
                  }}
                >
                  <UploadCloud className={cn("me-2", "h-4 w-4")} />
                  إرسال إعلان جديد
                </Button>
                <Button
                  variant="outline"
                  className="h-10 variant-outline"
                  onClick={() => setLocation("/")}
                >
                  <Home className={cn("me-2", "h-4 w-4")} />
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden">
      
      <PublicHeader />

      <main className="pt-20 pb-12 px-4">


        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mb-12"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              أدرج <span className="text-primary">عقارك للبيع</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              أدخل تفاصيل عقارك خطوة بخطوة. أكمل كل خطوة للانتقال إلى الخطوة التالية.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Progress Indicator - Sticky Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3 lg:sticky lg:top-32"
            >
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-row lg:flex-col items-start gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                  {STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = currentStep === step.id;
                    const isAccessible = step.id <= completedSteps.length + 1;

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-center gap-3 flex-shrink-0 cursor-pointer transition-all w-full",
                          !isAccessible && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => isAccessible && handleStepClick(step.id)}
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all border-2",
                            isCompleted
                              ? "bg-primary text-primary-foreground border-primary"
                              : isCurrent
                                ? "bg-primary/10 text-primary border-primary/30"
                                : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span>{step.id}</span>
                          )}
                        </div>
                        <div className="hidden md:block">
                          <div
                            className={cn(
                              "text-sm font-bold",
                              isCurrent || isCompleted ? "text-primary" : "text-muted-foreground"
                            )}
                          >
                            {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground/70">{step.description}</div>
                        </div>
                        {index < STEPS.length - 1 && (
                          <div className="hidden lg:block absolute end-[23px] top-[48px] h-8 w-0.5 bg-border -z-10" />
                        )}
                        {index < STEPS.length - 1 && (
                          <ChevronRight
                            className={cn(
                              "h-5 w-5 flex-shrink-0 mx-2 lg:hidden",
                              isCompleted ? "text-primary" : "text-muted-foreground/40"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-9"
            >
              <Form {...form}>
                <form
                  onSubmit={handleFormSubmit}
                  className="rounded-xl border bg-card p-6 md:p-8 shadow-sm space-y-8"
                >
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">الخطوة 1: البيانات الأساسية</h2>
                          <p className="text-sm text-muted-foreground mt-1">أدخل المعلومات الأساسية عن العقار</p>
                        </div>
                        <div className="text-sm text-muted-foreground/70">* الحقول الإلزامية</div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                عنوان الإعلان <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="مثال: شقة للبيع في الرياض"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="md:col-span-2">
                          <FormLabel className="mb-3 block text-sm font-medium">تصنيف العقار <span className="text-destructive">*</span></FormLabel>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="propertyCategory"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-xs text-muted-foreground">الخطوة 1: اختر الفئة</FormLabel>
                                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={categoryOpen}
                                          className={cn(
                                            "w-full justify-between transition-all",
                                            field.value && "border-primary/30 bg-primary/5"
                                          )}
                                          disabled={categoriesLoading}
                                        >
                                          <span>
                                            {categoriesLoading
                                              ? "جار التحميل..."
                                              : field.value
                                                ? (propertyCategories || []).find((c) => (c.code || String(c.id)) === field.value)?.nameAr ||
                                                (propertyCategories || []).find((c) => (c.code || String(c.id)) === field.value)?.nameEn ||
                                                field.value
                                                : "اختر فئة العقار"}
                                          </span>
                                          <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="ابحث عن الفئة..." />
                                        <CommandList className="max-h-[300px]">
                                          <CommandEmpty>لم يتم العثور على الفئة.</CommandEmpty>
                                          <CommandGroup>
                                            {categoriesLoading ? (
                                              <CommandItem disabled>
                                                <div className="flex items-center gap-2 w-full justify-center py-4">
                                                  <Spinner size="sm" />
                                                  <span>جار التحميل...</span>
                                                </div>
                                              </CommandItem>
                                            ) : categoriesError ? (
                                              <CommandItem disabled>
                                                <div className="text-destructive text-xs py-2">
                                                  <div>خطأ في تحميل الفئات</div>
                                                </div>
                                              </CommandItem>
                                            ) : uniquePropertyCategories && Array.isArray(uniquePropertyCategories) && uniquePropertyCategories.length > 0 ? (
                                              uniquePropertyCategories.map((category) => {
                                                const displayName = category.nameAr || category.nameEn || category.code || category.name || "فئة";
                                                const searchableValue = `${category.code || category.id} ${category.nameAr || ""} ${category.nameEn || ""} ${category.code || ""} ${category.name || ""}`.trim();
                                                return (
                                                  <CommandItem
                                                    key={category.code || category.id}
                                                    value={searchableValue}
                                                    onSelect={() => {
                                                      field.onChange(category.code || String(category.id));
                                                      form.setValue("propertyType", "");
                                                      setCategoryOpen(false);
                                                    }}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        cn("me-2", "h-4 w-4"),
                                                        field.value === (category.code || String(category.id)) ? "opacity-100" : "opacity-0"
                                                      )}
                                                    />
                                                    {displayName}
                                                  </CommandItem>
                                                );
                                              })
                                            ) : (
                                              <CommandItem disabled>
                                                <div className="text-muted-foreground text-xs py-2">لا توجد فئات متاحة</div>
                                              </CommandItem>
                                            )}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="propertyType"
                              render={({ field }) => (
                                <FormItem className="space-y-2">
                                  <FormLabel className="text-xs text-muted-foreground">
                                    الخطوة 2: اختر النوع
                                    {!watchPropertyCategory && (
                                      <span className="text-destructive me-1">(اختر الفئة أولاً)</span>
                                    )}
                                  </FormLabel>
                                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          aria-expanded={typeOpen}
                                          className={cn(
                                            "w-full justify-between transition-all",
                                            !watchPropertyCategory && "bg-muted/50 cursor-not-allowed",
                                            field.value && "border-primary/30 bg-primary/5"
                                          )}
                                          disabled={!watchPropertyCategory || typesLoading}
                                        >
                                          <span>
                                            {!watchPropertyCategory
                                              ? "اختر الفئة أولاً"
                                              : typesLoading
                                                ? "جار التحميل..."
                                                : field.value
                                                  ? (propertyTypes || []).find((t) => (t.code || String(t.id)) === field.value)?.nameAr ||
                                                  (propertyTypes || []).find((t) => (t.code || String(t.id)) === field.value)?.nameEn ||
                                                  field.value
                                                  : "اختر نوع العقار"}
                                          </span>
                                          <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="ابحث عن النوع..." disabled={!watchPropertyCategory} />
                                        <CommandList className="max-h-[300px]">
                                          <CommandEmpty>
                                            {!watchPropertyCategory ? "يرجى اختيار الفئة أولاً" : "لم يتم العثور على النوع."}
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {!watchPropertyCategory ? (
                                              <CommandItem disabled>
                                                <div className="flex items-center gap-2 text-muted-foreground/70 py-2">
                                                  <span>←</span>
                                                  <span>يرجى اختيار فئة العقار أولاً</span>
                                                </div>
                                              </CommandItem>
                                            ) : typesLoading ? (
                                              <CommandItem disabled>
                                                <div className="flex items-center gap-2 w-full justify-center py-4">
                                                  <Spinner size="sm" />
                                                  <span>جار التحميل...</span>
                                                </div>
                                              </CommandItem>
                                            ) : uniquePropertyTypes && Array.isArray(uniquePropertyTypes) && uniquePropertyTypes.length > 0 ? (
                                              uniquePropertyTypes.map((type) => {
                                                const displayName = type.nameAr || type.nameEn || type.code || type.name || "نوع";
                                                const searchableValue = `${type.code || type.id} ${type.nameAr || ""} ${type.nameEn || ""} ${type.code || ""} ${type.name || ""}`.trim();
                                                return (
                                                  <CommandItem
                                                    key={type.code || type.id}
                                                    value={searchableValue}
                                                    onSelect={() => {
                                                      field.onChange(type.code || String(type.id));
                                                      setTypeOpen(false);
                                                    }}
                                                  >
                                                    <Check
                                                      className={cn(
                                                        cn("me-2", "h-4 w-4"),
                                                        field.value === (type.code || String(type.id)) ? "opacity-100" : "opacity-0"
                                                      )}
                                                    />
                                                    {displayName}
                                                  </CommandItem>
                                                );
                                              })
                                            ) : (
                                              <CommandItem disabled>
                                                <div className="text-muted-foreground text-xs py-2">لا توجد أنواع متاحة لهذه الفئة</div>
                                              </CommandItem>
                                            )}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="listingType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                نوع العرض <span className="text-destructive">*</span>
                              </FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger><SelectValue placeholder="بيع أم إيجار؟" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {LISTING_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                السعر <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  {...field}
                                  placeholder="أدخل السعر"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel className="text-sm font-medium">الوصف</FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={4}
                                  {...field}
                                  className="rounded-2xl"
                                  placeholder="وصف تفصيلي عن العقار..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>
                  )}

                  {/* Step 2: Location */}
                  {currentStep === 2 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">الخطوة 2: الموقع</h2>
                          <p className="text-sm text-muted-foreground mt-1">حدد موقع العقار</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">المنطقة</FormLabel>
                              <Popover open={regionOpen} onOpenChange={setRegionOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={regionOpen}
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value
                                        ? (regions || []).find((region) => String(region.id) === field.value)?.nameAr ||
                                        (regions || []).find((region) => String(region.id) === field.value)?.nameEn ||
                                        "اختر المنطقة"
                                        : "اختر المنطقة"}
                                      <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="ابحث عن المنطقة..." />
                                    <CommandList>
                                      <CommandEmpty>لم يتم العثور على المنطقة.</CommandEmpty>
                                      <CommandGroup>
                                        {!regions ? (
                                          <CommandItem disabled>
                                            <div className="flex items-center justify-center p-2">
                                              <Spinner size="sm" className="me-2" />
                                              <span>جار التحميل...</span>
                                            </div>
                                          </CommandItem>
                                        ) : (
                                          (uniqueRegions || []).map((region) => {
                                            const displayName = region.nameAr || region.nameEn || String(region.id);
                                            const searchableValue = `${region.id} ${region.nameAr || ""} ${region.nameEn || ""} ${region.code || ""} ${region.name || ""}`.trim();
                                            return (
                                              <CommandItem
                                                key={region.id}
                                                value={searchableValue}
                                                onSelect={() => {
                                                  const newValue = String(region.id) === field.value ? "" : String(region.id);
                                                  field.onChange(newValue);
                                                  form.setValue("city", "");
                                                  form.setValue("district", "");
                                                  setRegionOpen(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    cn("me-2", "h-4 w-4"),
                                                    field.value === String(region.id) ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                {displayName}
                                              </CommandItem>
                                            );
                                          })
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                المدينة <span className="text-destructive">*</span>
                              </FormLabel>
                              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={cityOpen}
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      disabled={!watchRegion}
                                    >
                                      {field.value
                                        ? (filteredCities || []).find((city) => String(city.id) === field.value)?.nameAr ||
                                        (filteredCities || []).find((city) => String(city.id) === field.value)?.nameEn ||
                                        "اختر المدينة"
                                        : "اختر المدينة"}
                                      <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="ابحث عن المدينة..." />
                                    <CommandList>
                                      <CommandEmpty>لم يتم العثور على المدينة.</CommandEmpty>
                                      <CommandGroup>
                                        {filteredCities.length === 0 ? (
                                          <CommandItem disabled>
                                            <span>يرجى اختيار المنطقة أولاً</span>
                                          </CommandItem>
                                        ) : (
                                          filteredCities.map((city) => {
                                            const displayName = city.nameAr || city.nameEn || String(city.id);
                                            const searchableValue = `${city.id} ${city.nameAr || ""} ${city.nameEn || ""} ${city.code || ""} ${city.name || ""}`.trim();
                                            return (
                                              <CommandItem
                                                key={city.id}
                                                value={searchableValue}
                                                onSelect={() => {
                                                  const newValue = String(city.id) === field.value ? "" : String(city.id);
                                                  field.onChange(newValue);
                                                  form.setValue("district", "");
                                                  setCityOpen(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    cn("me-2", "h-4 w-4"),
                                                    field.value === String(city.id) ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                {displayName}
                                              </CommandItem>
                                            );
                                          })
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">الحي</FormLabel>
                              <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={districtOpen}
                                      className={cn(
                                        "w-full justify-between",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      disabled={!watchCity}
                                    >
                                      {field.value
                                        ? (filteredDistricts || []).find((district) => String(district.id) === field.value)?.nameAr ||
                                        (filteredDistricts || []).find((district) => String(district.id) === field.value)?.nameEn ||
                                        "اختر الحي"
                                        : "اختر الحي"}
                                      <ChevronsUpDown className={cn("me-2", "h-4 w-4 shrink-0 opacity-50")} />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="ابحث عن الحي..." disabled={!watchCity || districtsLoading} />
                                    <CommandList>
                                      <CommandEmpty>
                                        {!watchCity
                                          ? "يرجى اختيار المدينة أولاً"
                                          : districtsLoading
                                            ? "جار التحميل..."
                                            : districtsError
                                              ? "خطأ في تحميل الأحياء"
                                              : "لم يتم العثور على الحي"}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {!watchCity ? (
                                          <CommandItem disabled>
                                            <span>يرجى اختيار المدينة أولاً</span>
                                          </CommandItem>
                                        ) : districtsLoading ? (
                                          <CommandItem disabled>
                                            <div className="flex items-center gap-2 w-full justify-center py-4">
                                              <Spinner size="sm" />
                                              <span>جار التحميل...</span>
                                            </div>
                                          </CommandItem>
                                        ) : districtsError ? (
                                          <CommandItem disabled>
                                            <div className="text-destructive text-xs py-2">
                                              <div>خطأ في تحميل الأحياء</div>
                                              <div className="text-xs mt-1">{districtsError instanceof Error ? districtsError.message : "خطأ غير معروف"}</div>
                                            </div>
                                          </CommandItem>
                                        ) : filteredDistricts.length === 0 ? (
                                          <CommandItem disabled>
                                            <div className="text-muted-foreground text-xs py-2">لا توجد أحياء متاحة لهذه المدينة</div>
                                          </CommandItem>
                                        ) : (
                                          filteredDistricts.map((district) => {
                                            const displayName = district.nameAr || district.nameEn || String(district.id);
                                            const searchableValue = `${district.id} ${district.nameAr || ""} ${district.nameEn || ""} ${district.code || ""} ${district.name || ""}`.trim();
                                            return (
                                              <CommandItem
                                                key={district.id}
                                                value={searchableValue}
                                                onSelect={() => {
                                                  const newValue = String(district.id) === field.value ? "" : String(district.id);
                                                  field.onChange(newValue);
                                                  setDistrictOpen(false);
                                                }}
                                              >
                                                <Check
                                                  className={cn(
                                                    cn("me-2", "h-4 w-4"),
                                                    field.value === String(district.id) ? "opacity-100" : "opacity-0"
                                                  )}
                                                />
                                                {displayName}
                                              </CommandItem>
                                            );
                                          })
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="streetAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">العنوان التفصيلي</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="اسم الشارع والرقم"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">خط العرض</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  {...field}
                                  placeholder="24.7136"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="longitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">خط الطول</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  {...field}
                                  placeholder="46.6753"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>
                  )}

                  {/* Step 3: Specifications */}
                  {currentStep === 3 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">الخطوة 3: المواصفات</h2>
                          <p className="text-sm text-muted-foreground mt-1">تفاصيل العقار والمواصفات</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="bedrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">عدد الغرف</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bathrooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">عدد الحمامات</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="livingRooms"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">عدد صالات المعيشة</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="kitchens"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">عدد المطابخ</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="floorNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">رقم الطابق</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="totalFloors"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">عدد الطوابق الكلي</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="areaSqm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">المساحة (م²)</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} placeholder="0" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buildingYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">سنة البناء</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1900}
                                  max={new Date().getFullYear()}
                                  {...field}
                                  placeholder="2024"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="paymentFrequency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">تكرار الدفع</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="مثال: شهري، سنوي" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>
                  )}

                  {/* Step 4: Amenities */}
                  {currentStep === 4 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">الخطوة 4: المرافق</h2>
                          <p className="text-sm text-muted-foreground mt-1">اختر المرافق والخدمات المتاحة</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="hasParking"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                يوجد موقف سيارة
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hasElevator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                يوجد مصعد
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hasMaidsRoom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                يحتوي على غرفة خادمة
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hasDriverRoom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                يحتوي على غرفة سائق
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="furnished"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                مفروش
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="balcony"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                يحتوي على شرفة
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="swimmingPool"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                يحتوي على مسبح
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="centralAc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center justify-end gap-2 text-foreground cursor-pointer p-3 rounded-lg hover:bg-muted transition">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                تكييف مركزي
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>
                  )}

                  {/* Step 5: Media */}
                  {currentStep === 5 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">الخطوة 5: الصور</h2>
                          <p className="text-sm text-muted-foreground mt-1">أضف صور العقار</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-foreground">صور العقار</h4>
                            <p className="text-sm text-muted-foreground">
                              يمكن رفع حتى {MAX_IMAGE_COUNT} صورة، إجمالي الحجم أقل من {MAX_IMAGE_TOTAL_SIZE_BYTES / (1024 * 1024)} ميجابايت
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              الصور المرفوعة: {selectedImages.length} / {MAX_IMAGE_COUNT}
                            </p>
                          </div>
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 bg-card text-primary hover:bg-primary/5 cursor-pointer transition">
                            <UploadCloud className="w-4 h-4" /> رفع صور
                            <Input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                          </label>
                        </div>
                        {imagePreviews.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-28 object-cover rounded-xl border border-border"
                                />
                                <Button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute top-2 start-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                  aria-label="إزالة الصورة"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-8">لم يتم اختيار صور بعد.</div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Step 6: Contact Information */}
                  {currentStep === 6 && (
                    <section className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border">
                        <div>
                          <h2 className="text-2xl font-bold text-foreground">الخطوة 6: معلومات التواصل</h2>
                          <p className="text-sm text-muted-foreground mt-1">بيانات الاتصال</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">اسم جهة الاتصال</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="اسم جهة الاتصال" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mobileNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                رقم الجوال <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="05xxxxxxxx" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </section>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                      className="rounded-2xl"
                    >
                      <ChevronRight className={cn("me-2", "h-4 w-4")} />
                      السابق
                    </Button>

                    {currentStep < STEPS.length ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        التالي
                        <ChevronLeft className={cn("me-2", "h-4 w-4")} />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={loading}
                        className="rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            جاري الإرسال...
                          </>
                        ) : (
                          "إرسال الإعلان"
                        )}
                      </Button>
                    )}
                  </div>

                  {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-card/70 backdrop-blur-md">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Spinner size="xl" className="text-primary" />
                        <p className="text-sm font-medium">جارٍ إرسال إعلانك، يرجى الانتظار...</p>
                      </div>
                    </div>
                  )}
                </form>
              </Form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
