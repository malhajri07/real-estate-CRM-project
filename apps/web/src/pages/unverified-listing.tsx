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
 */

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Home, UploadCloud, X, ChevronsUpDown, Check, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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

export default function UnverifiedListingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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

  // Fetch regions, cities, districts
  const { data: regions } = useQuery<any[]>({
    queryKey: ["/api/regions"],
    queryFn: async () => {
      const response = await fetch("/api/locations/regions");
      if (!response.ok) throw new Error("Failed to fetch regions");
      return response.json();
    },
  });

  const { data: cities } = useQuery<any[]>({
    queryKey: ["/api/saudi-cities"],
    queryFn: async () => {
      const response = await fetch("/api/saudi-cities");
      if (!response.ok) throw new Error("Failed to fetch cities");
      return response.json();
    },
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

  const [form, setForm] = useState({
    title: "",
    description: "",
    propertyCategory: "",
    propertyType: "",
    listingType: "",
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
    hasParking: false,
    hasElevator: false,
    hasMaidsRoom: false,
    hasDriverRoom: false,
    furnished: false,
    balcony: false,
    swimmingPool: false,
    centralAc: false,
    price: "",
    currency: "SAR",
    paymentFrequency: "",
    contactName: "",
    mobileNumber: "",
    videoClipUrl: "",
  });

  // Fetch districts based on selected city (must be after form state is defined)
  const { data: districts, isLoading: districtsLoading, error: districtsError } = useQuery<any[]>({
    queryKey: ["/api/districts", form.city],
    queryFn: async () => {
      if (!form.city) return [];
      const response = await fetch(`/api/locations/districts?cityId=${form.city}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch districts:", response.status, errorText);
        throw new Error(`Failed to fetch districts: ${response.status}`);
      }
      const data = await response.json();
      console.log("Districts loaded for city", form.city, ":", data);
      return data;
    },
    enabled: !!form.city,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch property categories
  const { data: propertyCategories, isLoading: categoriesLoading, error: categoriesError } = useQuery<any[]>({
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
  const { data: propertyTypes, isLoading: typesLoading, error: typesError } = useQuery<any[]>({
    queryKey: ["/api/property-types", form.propertyCategory],
    queryFn: async () => {
      if (!form.propertyCategory) return [];
      try {
        const response = await fetch(`/api/property-types?categoryCode=${form.propertyCategory}`);
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
    enabled: !!form.propertyCategory,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Filter cities and districts based on selected region
  const filteredCities = form.region
    ? cities?.filter((city) => city.regionId === Number(form.region)) || []
    : cities || [];

  // Districts are already filtered by cityId from the API query, so we use them directly
  const filteredDistricts = districts || [];

  // Step validation functions
  const validateStep1 = (): boolean => {
    const requiredFields = [
      { key: "title", label: "عنوان الإعلان" },
      { key: "propertyCategory", label: "فئة العقار" },
      { key: "propertyType", label: "نوع العقار" },
      { key: "listingType", label: "نوع العرض" },
      { key: "price", label: "السعر" },
    ];

    for (const field of requiredFields) {
      const value = form[field.key as keyof typeof form];
      if (!value || String(value).trim() === "") {
        toast({
          title: "تحقق من البيانات",
          description: `يرجى تعبئة حقل ${field.label}`,
          variant: "destructive",
        });
        return false;
      }
    }

    const price = Number(form.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "قيمة غير صالحة",
        description: "يرجى إدخال سعر صحيح",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    if (!form.city || form.city.trim() === "") {
      toast({
        title: "تحقق من البيانات",
        description: "يرجى تعبئة حقل المدينة",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    // Step 3 is optional, always valid
    return true;
  };

  const validateStep4 = (): boolean => {
    // Step 4 is optional, always valid
    return true;
  };

  const validateStep5 = (): boolean => {
    // Step 5 is optional, always valid
    return true;
  };

  const validateStep6 = (): boolean => {
    if (!form.mobileNumber || form.mobileNumber.trim().length < 7) {
      toast({
        title: "تحقق من البيانات",
        description: "رقم الجوال مطلوب ويجب أن يكون 7 أحرف على الأقل",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      case 5:
        return validateStep5();
      case 6:
        return validateStep6();
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateStep6()) {
      setCurrentStep(6);
      return;
    }

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

      const optionalText = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
      };

      const optionalNumber = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed.length) return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const getRegionName = () => {
        if (!form.region) return undefined;
        const region = (regions || []).find((r: any) => String(r.id) === form.region);
        return region ? (region.nameAr || region.nameEn || region.name) : form.region;
      };

      const getCityName = () => {
        if (!form.city) return "";
        const city = (filteredCities || []).find((c: any) => String(c.id) === form.city);
        if (city) {
          return city.nameAr || city.nameEn || city.name || "";
        }
        return form.city;
      };

      const getDistrictName = () => {
        if (!form.district) return undefined;
        // Search in full districts array, not just filteredDistricts, to ensure we find the district
        const district = (districts || []).find((d: any) => String(d.id) === form.district);
        return district ? (district.nameAr || district.nameEn || district.name) : form.district;
      };

      const payload: any = {
        title: form.title.trim(),
        description: optionalText(form.description),
        propertyCategory: form.propertyCategory,
        propertyType: form.propertyType,
        listingType: form.listingType,
        country: "Saudi Arabia",
        region: getRegionName() || undefined,
        city: getCityName() || (form.city ? form.city.trim() : ""),
        district: getDistrictName() || undefined,
        streetAddress: optionalText(form.streetAddress),
        latitude: optionalNumber(form.latitude),
        longitude: optionalNumber(form.longitude),
        bedrooms: optionalNumber(form.bedrooms),
        bathrooms: optionalNumber(form.bathrooms),
        livingRooms: optionalNumber(form.livingRooms),
        kitchens: optionalNumber(form.kitchens),
        floorNumber: optionalNumber(form.floorNumber),
        totalFloors: optionalNumber(form.totalFloors),
        areaSqm: optionalNumber(form.areaSqm),
        buildingYear: optionalNumber(form.buildingYear),
        hasParking: form.hasParking,
        hasElevator: form.hasElevator,
        hasMaidsRoom: form.hasMaidsRoom,
        hasDriverRoom: form.hasDriverRoom,
        furnished: form.furnished,
        balcony: form.balcony,
        swimmingPool: form.swimmingPool,
        centralAc: form.centralAc,
        price: Number(form.price),
        currency: form.currency,
        paymentFrequency: optionalText(form.paymentFrequency),
        imageGallery: imageDataUrls,
        videoClipUrl: optionalText(form.videoClipUrl),
        contactName: optionalText(form.contactName),
        mobileNumber: form.mobileNumber.trim(),
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
        const relevantErrors = (responseData?.errors || []).filter((e: any) => {
          const pathStr = Array.isArray(e.path) ? e.path.join('.') : String(e.path || '').toLowerCase();
          return !pathStr.includes('propertycategory') && 
                 !pathStr.includes('property_category') && 
                 !pathStr.includes('property-category');
        });
        
        if (relevantErrors.length > 0) {
          const firstError = relevantErrors[0];
          const fieldName = Array.isArray(firstError.path) ? firstError.path.join('.') : String(firstError.path || 'حقل');
          errorMessage = `يرجى التحقق من حقل "${fieldName}": ${firstError.message}`;
        }
        
        throw new Error(errorMessage);
      }

      toast({ title: "تم الإرسال", description: "تم تسجيل إعلانك بنجاح" });
      const extractedPropertyId = responseData?.propertyId || responseData?.id || null;
      setPropertyId(extractedPropertyId);
      setSubmitted(true);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        toast({ title: "انتهت المهلة", description: "انتهى وقت الإرسال قبل وصول الرد. حاول مرة أخرى.", variant: "destructive" });
      } else {
        toast({ title: "خطأ", description: error?.message || "حدث خطأ غير متوقع", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6 rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl p-10 shadow-[0_35px_120px_rgba(16,185,129,0.18)] text-right">
            <div className="flex items-center justify-end gap-4">
              <div className="rounded-3xl bg-emerald-100 p-4 text-emerald-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">تم استلام إعلانك بنجاح</h1>
                <p className="mt-2 text-slate-500 leading-7">
                  شكراً لثقتك بنا. سيقوم أحد الوسطاء المرخصين بمراجعة إعلانك والاتصال بك قريباً لإتمام عملية النشر.
                </p>
                {propertyId && (
                  <div className="mt-6 rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4">
                    <p className="text-base font-semibold text-emerald-800 mb-2">رقم الإعلان الخاص بك:</p>
                    <p className="text-2xl font-bold text-emerald-600 tracking-wider font-mono">
                      {propertyId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-4 pt-6">
              <Button
                variant="outline"
                className="rounded-2xl border-slate-300 text-slate-600 hover:bg-slate-100"
                onClick={() => setLocation("/")}
              >
                <Home className="ml-2 h-4 w-4" />
                العودة للصفحة الرئيسية
              </Button>
              <Button
                className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => {
                  setSubmitted(false);
                  setCurrentStep(1);
                  setCompletedSteps([]);
                  setForm({
                    title: "",
                    description: "",
                    propertyCategory: "",
                    propertyType: "",
                    listingType: "",
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
                    hasParking: false,
                    hasElevator: false,
                    hasMaidsRoom: false,
                    hasDriverRoom: false,
                    furnished: false,
                    balcony: false,
                    swimmingPool: false,
                    centralAc: false,
                    price: "",
                    currency: "SAR",
                    paymentFrequency: "",
                    contactName: "",
                    mobileNumber: "",
                    videoClipUrl: "",
                  });
                  setSelectedImages([]);
                  setImagePreviews([]);
                }}
              >
                إرسال إعلان جديد
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="space-y-3 text-right">
          <span className="inline-block rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
            إدراج عقار للبيع
          </span>
          <h1 className="text-4xl font-bold text-slate-900">أدرج عقارك للبيع</h1>
          <p className="text-lg text-slate-500 leading-relaxed">
            أدخل تفاصيل عقارك خطوة بخطوة. أكمل كل خطوة للانتقال إلى الخطوة التالية.
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl p-6 shadow-[0_35px_120px_rgba(148,163,184,0.18)]">
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= completedSteps.length + 1;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 flex-shrink-0 cursor-pointer transition-all",
                    !isAccessible && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => isAccessible && handleStepClick(step.id)}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition-all border-2",
                      isCompleted
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : isCurrent
                        ? "bg-emerald-100 text-emerald-600 border-emerald-300"
                        : "bg-gray-100 text-gray-500 border-gray-300"
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
                        "text-sm font-semibold",
                        isCurrent || isCompleted ? "text-emerald-600" : "text-gray-500"
                      )}
                    >
                      {step.title}
              </div>
                    <div className="text-xs text-gray-400">{step.description}</div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight
                      className={cn(
                        "h-5 w-5 flex-shrink-0 mx-2",
                        isCompleted ? "text-emerald-600" : "text-gray-300"
                      )}
                    />
                      )}
                    </div>
              );
            })}
          </div>
                  </div>
                  
        <form
          onSubmit={handleSubmit}
          className="relative space-y-10 rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl px-6 py-10 shadow-[0_35px_120px_rgba(148,163,184,0.18)]"
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">الخطوة 1: البيانات الأساسية</h2>
                  <p className="text-sm text-slate-500 mt-1">أدخل المعلومات الأساسية عن العقار</p>
                    </div>
                <div className="text-sm text-slate-400">* الحقول الإلزامية</div>
                  </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    عنوان الإعلان <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: شقة للبيع في الرياض"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="mb-3 block text-sm font-medium">تصنيف العقار <span className="text-red-500">*</span></label>
                  
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">الخطوة 1: اختر الفئة</label>
                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoryOpen}
                          className={cn(
                            "w-full justify-between transition-all",
                            form.propertyCategory && "border-emerald-300 bg-emerald-50"
                          )}
                          disabled={categoriesLoading}
                        >
                          <span>
                            {categoriesLoading 
                              ? "جار التحميل..." 
                              : form.propertyCategory
                              ? (propertyCategories || []).find((c: any) => (c.code || String(c.id)) === form.propertyCategory)?.nameAr || 
                                (propertyCategories || []).find((c: any) => (c.code || String(c.id)) === form.propertyCategory)?.nameEn ||
                                form.propertyCategory
                              : "اختر فئة العقار"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
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
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>جار التحميل...</span>
                                  </div>
                                </CommandItem>
                              ) : categoriesError ? (
                                <CommandItem disabled>
                                  <div className="text-red-600 text-xs py-2">
                                    <div>خطأ في تحميل الفئات</div>
                                  </div>
                                </CommandItem>
                              ) : propertyCategories && Array.isArray(propertyCategories) && propertyCategories.length > 0 ? (
                                  propertyCategories.map((category: any) => {
                                    const displayName = category.nameAr || category.nameEn || category.code || category.name || "فئة";
                                    const searchableValue = `${category.code || category.id} ${category.nameAr || ""} ${category.nameEn || ""} ${category.code || ""} ${category.name || ""}`.trim();
                                    return (
                                  <CommandItem
                                    key={category.code || category.id}
                                        value={searchableValue}
                                    onSelect={() => {
                                      setForm({ ...form, propertyCategory: category.code || String(category.id), propertyType: "" });
                                      setCategoryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4",
                                        form.propertyCategory === (category.code || String(category.id)) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                        {displayName}
                                  </CommandItem>
                                    );
                                  })
                              ) : (
                                <CommandItem disabled>
                                    <div className="text-gray-500 text-xs py-2">لا توجد فئات متاحة</div>
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600">
                      الخطوة 2: اختر النوع
                      {!form.propertyCategory && (
                        <span className="text-red-500 mr-1">(اختر الفئة أولاً)</span>
                      )}
                    </label>
                    <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={typeOpen}
                          className={cn(
                            "w-full justify-between transition-all",
                            !form.propertyCategory && "bg-gray-100 cursor-not-allowed",
                            form.propertyType && "border-emerald-300 bg-emerald-50"
                          )}
                          disabled={!form.propertyCategory || typesLoading}
                        >
                          <span>
                            {!form.propertyCategory
                              ? "اختر الفئة أولاً"
                              : typesLoading
                              ? "جار التحميل..."
                              : form.propertyType
                              ? (propertyTypes || []).find((t: any) => (t.code || String(t.id)) === form.propertyType)?.nameAr ||
                                (propertyTypes || []).find((t: any) => (t.code || String(t.id)) === form.propertyType)?.nameEn ||
                                form.propertyType
                              : "اختر نوع العقار"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="ابحث عن النوع..." disabled={!form.propertyCategory} />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>
                              {!form.propertyCategory ? "يرجى اختيار الفئة أولاً" : "لم يتم العثور على النوع."}
                            </CommandEmpty>
                            <CommandGroup>
                              {!form.propertyCategory ? (
                                <CommandItem disabled>
                                  <div className="flex items-center gap-2 text-gray-400 py-2">
                                    <span>←</span>
                                    <span>يرجى اختيار فئة العقار أولاً</span>
                                  </div>
                                </CommandItem>
                              ) : typesLoading ? (
                                <CommandItem disabled>
                                  <div className="flex items-center gap-2 w-full justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>جار التحميل...</span>
                                  </div>
                                </CommandItem>
                              ) : propertyTypes && Array.isArray(propertyTypes) && propertyTypes.length > 0 ? (
                                propertyTypes.map((type: any) => {
                                  const displayName = type.nameAr || type.nameEn || type.code || type.name || "نوع";
                                  const searchableValue = `${type.code || type.id} ${type.nameAr || ""} ${type.nameEn || ""} ${type.code || ""} ${type.name || ""}`.trim();
                                  return (
                                  <CommandItem
                                    key={type.code || type.id}
                                      value={searchableValue}
                                    onSelect={() => {
                                      setForm({ ...form, propertyType: type.code || String(type.id) });
                                      setTypeOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4",
                                        form.propertyType === (type.code || String(type.id)) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                      {displayName}
                                  </CommandItem>
                                  );
                                })
                              ) : (
                                <CommandItem disabled>
                                  <div className="text-gray-500 text-xs py-2">لا توجد أنواع متاحة لهذه الفئة</div>
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div>
                  <label className="mb-1 block text-sm font-medium">
                    نوع العرض <span className="text-red-500">*</span>
                  </label>
                <Select value={form.listingType} onValueChange={(value) => setForm({ ...form, listingType: value })}>
                  <SelectTrigger><SelectValue placeholder="بيع أم إيجار؟" /></SelectTrigger>
                  <SelectContent>
                    {LISTING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                  <label className="mb-1 block text-sm font-medium">
                    السعر (﷼) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="أدخل السعر"
                    required
                  />
              </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">الوصف</label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-2xl"
                    placeholder="وصف تفصيلي عن العقار..."
                />
              </div>
            </div>
          </section>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">الخطوة 2: الموقع</h2>
                  <p className="text-sm text-slate-500 mt-1">حدد موقع العقار</p>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                  <label className="mb-1 block text-sm font-medium">المنطقة</label>
                <Popover open={regionOpen} onOpenChange={setRegionOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={regionOpen}
                      className={cn(
                        "w-full justify-between",
                        !form.region && "text-muted-foreground"
                      )}
                    >
                      {form.region
                        ? (regions || []).find((region: any) => String(region.id) === form.region)?.nameAr || 
                          (regions || []).find((region: any) => String(region.id) === form.region)?.nameEn ||
                          "اختر المنطقة"
                        : "اختر المنطقة"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
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
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                <span>جار التحميل...</span>
                              </div>
                            </CommandItem>
                          ) : (
                            (regions || []).map((region: any) => {
                              const displayName = region.nameAr || region.nameEn || String(region.id);
                              const searchableValue = `${region.id} ${region.nameAr || ""} ${region.nameEn || ""} ${region.code || ""} ${region.name || ""}`.trim();
                              return (
                              <CommandItem
                                key={region.id}
                                  value={searchableValue}
                                  onSelect={() => {
                                  setForm({ 
                                    ...form, 
                                      region: String(region.id) === form.region ? "" : String(region.id),
                                    city: "",
                                    district: ""
                                  });
                                  setRegionOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    form.region === String(region.id) ? "opacity-100" : "opacity-0"
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
              </div>

              <div>
                  <label className="mb-1 block text-sm font-medium">
                    المدينة <span className="text-red-500">*</span>
                  </label>
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cityOpen}
                      className={cn(
                        "w-full justify-between",
                        !form.city && "text-muted-foreground"
                      )}
                      disabled={!form.region}
                    >
                      {form.city
                        ? (filteredCities || []).find((city: any) => String(city.id) === form.city)?.nameAr || 
                          (filteredCities || []).find((city: any) => String(city.id) === form.city)?.nameEn ||
                          "اختر المدينة"
                        : "اختر المدينة"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
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
                              filteredCities.map((city: any) => {
                                const displayName = city.nameAr || city.nameEn || String(city.id);
                                const searchableValue = `${city.id} ${city.nameAr || ""} ${city.nameEn || ""} ${city.code || ""} ${city.name || ""}`.trim();
                                return (
                              <CommandItem
                                key={city.id}
                                    value={searchableValue}
                                    onSelect={() => {
                                  setForm({ 
                                    ...form, 
                                        city: String(city.id) === form.city ? "" : String(city.id),
                                    district: ""
                                  });
                                  setCityOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    form.city === String(city.id) ? "opacity-100" : "opacity-0"
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
              </div>

              <div>
                  <label className="mb-1 block text-sm font-medium">الحي</label>
                <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={districtOpen}
                      className={cn(
                        "w-full justify-between",
                        !form.district && "text-muted-foreground"
                      )}
                      disabled={!form.city}
                    >
                      {form.district
                        ? (filteredDistricts || []).find((district: any) => String(district.id) === form.district)?.nameAr || 
                          (filteredDistricts || []).find((district: any) => String(district.id) === form.district)?.nameEn ||
                          "اختر الحي"
                        : "اختر الحي"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="ابحث عن الحي..." disabled={!form.city || districtsLoading} />
                      <CommandList>
                          <CommandEmpty>
                            {!form.city 
                              ? "يرجى اختيار المدينة أولاً" 
                              : districtsLoading 
                              ? "جار التحميل..." 
                              : districtsError 
                              ? "خطأ في تحميل الأحياء" 
                              : "لم يتم العثور على الحي"}
                          </CommandEmpty>
                        <CommandGroup>
                            {!form.city ? (
                            <CommandItem disabled>
                              <span>يرجى اختيار المدينة أولاً</span>
                            </CommandItem>
                            ) : districtsLoading ? (
                              <CommandItem disabled>
                                <div className="flex items-center gap-2 w-full justify-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>جار التحميل...</span>
                                </div>
                              </CommandItem>
                            ) : districtsError ? (
                              <CommandItem disabled>
                                <div className="text-red-600 text-xs py-2">
                                  <div>خطأ في تحميل الأحياء</div>
                                  <div className="text-xs mt-1">{districtsError instanceof Error ? districtsError.message : "خطأ غير معروف"}</div>
                                </div>
                              </CommandItem>
                            ) : filteredDistricts.length === 0 ? (
                              <CommandItem disabled>
                                <div className="text-gray-500 text-xs py-2">لا توجد أحياء متاحة لهذه المدينة</div>
                              </CommandItem>
                            ) : (
                              filteredDistricts.map((district: any) => {
                                const displayName = district.nameAr || district.nameEn || String(district.id);
                                const searchableValue = `${district.id} ${district.nameAr || ""} ${district.nameEn || ""} ${district.code || ""} ${district.name || ""}`.trim();
                                return (
                              <CommandItem
                                key={district.id}
                                    value={searchableValue}
                                    onSelect={() => {
                                  setForm({ 
                                    ...form, 
                                        district: String(district.id) === form.district ? "" : String(district.id)
                                  });
                                  setDistrictOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    form.district === String(district.id) ? "opacity-100" : "opacity-0"
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
              </div>

              <div>
                  <label className="mb-1 block text-sm font-medium">العنوان التفصيلي</label>
                  <Input
                    value={form.streetAddress}
                    onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
                    placeholder="اسم الشارع والرقم"
                  />
              </div>

              <div>
                  <label className="mb-1 block text-sm font-medium">خط العرض</label>
                  <Input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="24.7136"
                  />
              </div>

              <div>
                  <label className="mb-1 block text-sm font-medium">خط الطول</label>
                  <Input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="46.6753"
                  />
              </div>
            </div>
          </section>
          )}

          {/* Step 3: Specifications */}
          {currentStep === 3 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">الخطوة 3: المواصفات</h2>
                  <p className="text-sm text-slate-500 mt-1">تفاصيل العقار والمواصفات</p>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                  <label className="mb-1 block text-sm font-medium">عدد الغرف</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                    placeholder="0"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">عدد الحمامات</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.bathrooms}
                    onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                    placeholder="0"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">عدد صالات المعيشة</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.livingRooms}
                    onChange={(e) => setForm({ ...form, livingRooms: e.target.value })}
                    placeholder="0"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">عدد المطابخ</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.kitchens}
                    onChange={(e) => setForm({ ...form, kitchens: e.target.value })}
                    placeholder="0"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">رقم الطابق</label>
                  <Input
                    type="number"
                    value={form.floorNumber}
                    onChange={(e) => setForm({ ...form, floorNumber: e.target.value })}
                    placeholder="0"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">عدد الطوابق الكلي</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.totalFloors}
                    onChange={(e) => setForm({ ...form, totalFloors: e.target.value })}
                    placeholder="0"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">المساحة (م²)</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.areaSqm}
                    onChange={(e) => setForm({ ...form, areaSqm: e.target.value })}
                    placeholder="0"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">سنة البناء</label>
                  <Input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={form.buildingYear}
                    onChange={(e) => setForm({ ...form, buildingYear: e.target.value })}
                    placeholder="2024"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">تكرار الدفع</label>
                  <Input
                    value={form.paymentFrequency}
                    onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value })}
                    placeholder="مثال: شهري، سنوي"
                  />
              </div>
            </div>
          </section>
          )}

          {/* Step 4: Amenities */}
          {currentStep === 4 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">الخطوة 4: المرافق</h2>
                  <p className="text-sm text-slate-500 mt-1">اختر المرافق والخدمات المتاحة</p>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.hasParking}
                    onCheckedChange={(value) => setForm({ ...form, hasParking: Boolean(value) })}
                  />
                يوجد موقف سيارة
              </label>
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.hasElevator}
                    onCheckedChange={(value) => setForm({ ...form, hasElevator: Boolean(value) })}
                  />
                يوجد مصعد
              </label>
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.hasMaidsRoom}
                    onCheckedChange={(value) => setForm({ ...form, hasMaidsRoom: Boolean(value) })}
                  />
                يحتوي على غرفة خادمة
              </label>
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.hasDriverRoom}
                    onCheckedChange={(value) => setForm({ ...form, hasDriverRoom: Boolean(value) })}
                  />
                يحتوي على غرفة سائق
              </label>
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.furnished}
                    onCheckedChange={(value) => setForm({ ...form, furnished: Boolean(value) })}
                  />
                مفروش
              </label>
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.balcony}
                    onCheckedChange={(value) => setForm({ ...form, balcony: Boolean(value) })}
                  />
                يحتوي على شرفة
              </label>
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.swimmingPool}
                    onCheckedChange={(value) => setForm({ ...form, swimmingPool: Boolean(value) })}
                  />
                يحتوي على مسبح
              </label>
                <label className="flex items-center justify-end gap-2 text-slate-600 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition">
                  <Checkbox
                    checked={form.centralAc}
                    onCheckedChange={(value) => setForm({ ...form, centralAc: Boolean(value) })}
                  />
                تكييف مركزي
              </label>
            </div>
          </section>
          )}

          {/* Step 5: Media */}
          {currentStep === 5 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">الخطوة 5: الصور</h2>
                  <p className="text-sm text-slate-500 mt-1">أضف صور العقار</p>
                </div>
              </div>

            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-slate-800">صور العقار</h4>
                  <p className="text-sm text-slate-500">
                    يمكن رفع حتى {MAX_IMAGE_COUNT} صورة، إجمالي الحجم أقل من {MAX_IMAGE_TOTAL_SIZE_BYTES / (1024 * 1024)} ميجابايت
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    الصور المرفوعة: {selectedImages.length} / {MAX_IMAGE_COUNT}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer transition">
                  <UploadCloud className="w-4 h-4" /> رفع صور
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                </label>
              </div>
              {imagePreviews.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-28 object-cover rounded-xl border border-slate-200"
                        />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        aria-label="إزالة الصورة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                  <div className="text-sm text-slate-500 text-center py-8">لم يتم اختيار صور بعد.</div>
              )}
            </div>
          </section>
          )}

          {/* Step 6: Contact Information */}
          {currentStep === 6 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">الخطوة 6: معلومات التواصل</h2>
                  <p className="text-sm text-slate-500 mt-1">بيانات الاتصال</p>
                </div>
              </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                  <label className="mb-1 block text-sm font-medium">اسم جهة الاتصال</label>
                  <Input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="اسم جهة الاتصال"
                  />
              </div>
              <div>
                  <label className="mb-1 block text-sm font-medium">
                    رقم الجوال <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                    placeholder="05xxxxxxxx"
                    required
                  />
              </div>
            </div>
          </section>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="rounded-2xl"
            >
              <ChevronRight className="ml-2 h-4 w-4" />
              السابق
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                التالي
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            ) : (
            <Button
              type="submit"
              disabled={loading}
                className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال الإعلان"
                )}
            </Button>
            )}
          </div>

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[32px] bg-white/70 backdrop-blur-md">
              <div className="flex flex-col items-center gap-3 text-slate-600">
                <span className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <p className="text-sm font-medium">جارٍ إرسال إعلانك، يرجى الانتظار...</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
