import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Home, UploadCloud, X, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Property types - kept as fallback, but we'll fetch from property_category API instead
const PROPERTY_TYPES_FALLBACK = [
  "شقة",
  "فيلا",
  "دوبلكس",
  "تاون هاوس",
  "استوديو",
  "بيت",
  "عمارة",
  "مكتب",
  "محل",
  "مستودع",
  "أرض",
];

const LISTING_TYPES = [
  { value: "بيع", label: "بيع" },
  { value: "إيجار", label: "إيجار" },
];

const MAX_IMAGE_COUNT = 10;
const MAX_IMAGE_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB total

export default function UnverifiedListingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);
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

  const { data: districts } = useQuery<any[]>({
    queryKey: ["/api/districts"],
    queryFn: async () => {
      const response = await fetch("/api/locations/districts");
      if (!response.ok) throw new Error("Failed to fetch districts");
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

  // Fetch property categories from dimension table
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
        console.log("Property categories loaded:", data);
        return data;
      } catch (error) {
        console.error("Error fetching property categories:", error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
        console.log("Property types loaded for category", form.propertyCategory, ":", data);
        return data;
      } catch (error) {
        console.error("Error fetching property types:", error);
        throw error;
      }
    },
    enabled: !!form.propertyCategory,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

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

  const validateRequiredFields = () => {
    const requiredFields: Array<{ key: keyof typeof form; label: string }> = [
      { key: "title", label: "عنوان الإعلان" },
      { key: "propertyCategory", label: "فئة العقار" },
      { key: "propertyType", label: "نوع العقار" },
      { key: "listingType", label: "نوع العرض" },
      { key: "city", label: "المدينة" },
      { key: "price", label: "السعر" },
      { key: "mobileNumber", label: "رقم الجوال" },
    ];

    const missingField = requiredFields.find(({ key }) => {
      const value = form[key];
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missingField) {
      toast({
        title: "تحقق من البيانات",
        description: `يرجى تعبئة حقل ${missingField.label}`,
      });
      return false;
    }

    return true;
  };

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
    
    // Check total count
    if (selectedImages.length + filesArray.length > MAX_IMAGE_COUNT) {
      toast({
        title: "عدد الصور",
        description: `يمكن رفع حتى ${MAX_IMAGE_COUNT} صورة فقط`,
        variant: "destructive",
      });
      return;
    }

    // Calculate total size
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

    if (!validateRequiredFields()) {
      return;
    }

    // Validate required fields
    if (!form.title.trim()) {
      toast({
        title: "تحقق من البيانات",
        description: "عنوان الإعلان مطلوب",
        variant: "destructive",
      });
      return;
    }

    if (!form.propertyCategory) {
      toast({
        title: "تحقق من البيانات",
        description: "فئة العقار مطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!form.propertyType) {
      toast({
        title: "تحقق من البيانات",
        description: "نوع العقار مطلوب",
        variant: "destructive",
      });
      return;
    }

    if (!form.listingType) {
      toast({
        title: "تحقق من البيانات",
        description: "نوع العرض مطلوب",
        variant: "destructive",
      });
      return;
    }

    if (!form.city) {
      toast({
        title: "تحقق من البيانات",
        description: "المدينة مطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!form.mobileNumber || form.mobileNumber.trim().length < 7) {
      toast({
        title: "تحقق من البيانات",
        description: "رقم الجوال مطلوب ويجب أن يكون 7 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    const price = Number(form.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "قيمة غير صالحة",
        description: "يرجى إدخال سعر صحيح",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Convert images to base64
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

      // Convert IDs to names for region, city, district
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
        // If city ID not found in list, try to use the ID itself as fallback
        // But better to show an error - this shouldn't happen in normal flow
        console.warn("City ID not found in cities list:", form.city);
        return form.city;
      };

      const getDistrictName = () => {
        if (!form.district) return undefined;
        const district = (filteredDistricts || []).find((d: any) => String(d.id) === form.district);
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
        price,
        currency: form.currency,
        paymentFrequency: optionalText(form.paymentFrequency),
        imageGallery: imageDataUrls,
        videoClipUrl: optionalText(form.videoClipUrl),
        contactName: optionalText(form.contactName),
        mobileNumber: form.mobileNumber.trim(),
        status: "Pending",
      };

      console.log("Submitting payload:", payload);

      const response = await fetchWithTimeout("/api/unverified-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("API Error Response:", responseData);
        console.error("Validation errors:", responseData?.errors);
        console.error("Error details:", responseData?.details);
        console.error("First error:", responseData?.firstError);
        
        // Show detailed validation errors - completely ignore propertyCategory errors
        let errorMessage = responseData?.message || "تعذر إنشاء الإعلان";
        
        // Filter out any propertyCategory errors completely - they should never appear
        const relevantErrors = (responseData?.errors || []).filter((e: any) => {
          const pathStr = Array.isArray(e.path) ? e.path.join('.') : String(e.path || '').toLowerCase();
          return !pathStr.includes('propertycategory') && 
                 !pathStr.includes('property_category') && 
                 !pathStr.includes('property-category');
        });
        
        // Filter error details and firstError to exclude propertyCategory mentions
        const relevantDetails = (responseData?.details || []).filter((d: string) => {
          const lowerD = String(d || '').toLowerCase();
          return !lowerD.includes('propertycategory') && 
                 !lowerD.includes('property_category') && 
                 !lowerD.includes('property-category');
        });
        
        const hasValidFirstError = responseData?.firstError && 
          !String(responseData.firstError).toLowerCase().includes('propertycategory') &&
          !String(responseData.firstError).toLowerCase().includes('property_category') &&
          !String(responseData.firstError).toLowerCase().includes('property-category');
        
        // Show the actual validation error from the API (if valid)
        if (hasValidFirstError) {
          errorMessage = responseData.firstError;
        } else if (relevantErrors.length > 0) {
          const firstError = relevantErrors[0];
          const fieldName = Array.isArray(firstError.path) ? firstError.path.join('.') : String(firstError.path || 'حقل');
          errorMessage = `يرجى التحقق من حقل "${fieldName}": ${firstError.message}`;
        } else if (relevantDetails.length > 0) {
          errorMessage = relevantDetails[0];
        } else {
          // If all errors were filtered out, show a generic message
          errorMessage = "يرجى التحقق من جميع الحقول والتأكد من صحة البيانات المدخلة.";
        }
        
        throw new Error(errorMessage);
      }

      toast({ title: "تم الإرسال", description: "تم تسجيل إعلانك بنجاح" });
      const extractedPropertyId = responseData?.propertyId || responseData?.id || null;
      setPropertyId(extractedPropertyId);
      setSubmitted(true);
      
      // Reset form
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

  // Filter cities and districts based on selected region
  const filteredCities = form.region
    ? cities?.filter((city) => city.regionId === Number(form.region)) || []
    : cities || [];

  const filteredDistricts = form.city
    ? districts?.filter((district) => district.cityId === Number(form.city)) || []
    : districts || [];

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
                onClick={() => setSubmitted(false)}
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
            أدخل تفاصيل عقارك وسيقوم فريقنا بمراجعته والاتصال بك قريباً لإتمام عملية النشر والتسويق.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative space-y-10 rounded-[32px] border border-white/80 bg-white/90 backdrop-blur-xl px-6 py-10 shadow-[0_35px_120px_rgba(148,163,184,0.18)]"
        >
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">بيانات العقار الأساسية</h2>
              <span className="text-sm text-slate-400">* الحقول الإلزامية</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">عنوان الإعلان *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              {/* Step-by-Step Property Category and Type Selection */}
              <div className="md:col-span-2">
                <label className="mb-3 block text-sm font-medium">تصنيف العقار *</label>
                
                {/* Step Tracker */}
                <div className="mb-4 flex items-center gap-2">
                  {/* Step 1: Category */}
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                      form.propertyCategory
                        ? "bg-emerald-600 text-white"
                        : form.propertyCategory === ""
                          ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-300"
                          : "bg-gray-200 text-gray-500"
                    )}>
                      {form.propertyCategory ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span>1</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      form.propertyCategory ? "text-emerald-600" : "text-gray-600"
                    )}>
                      فئة العقار
                    </span>
                  </div>
                  
                  {/* Connector Line */}
                  <div className={cn(
                    "h-0.5 flex-1 transition-colors",
                    form.propertyCategory ? "bg-emerald-600" : "bg-gray-300"
                  )} />
                  
                  {/* Step 2: Type */}
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                      form.propertyType
                        ? "bg-emerald-600 text-white"
                        : form.propertyCategory && !form.propertyType
                          ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-300"
                          : "bg-gray-200 text-gray-500"
                    )}>
                      {form.propertyType ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span>2</span>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      form.propertyType ? "text-emerald-600" : "text-gray-600"
                    )}>
                      نوع العقار
                    </span>
                  </div>
                </div>
                
                {/* Dropdowns */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Step 1: Category Dropdown */}
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
                                    <div className="text-xs mt-1">{categoriesError instanceof Error ? categoriesError.message : "خطأ غير معروف"}</div>
                                    <div className="text-xs mt-1 text-gray-500">يرجى تحديث الصفحة أو المحاولة مرة أخرى</div>
                                  </div>
                                </CommandItem>
                              ) : propertyCategories && Array.isArray(propertyCategories) && propertyCategories.length > 0 ? (
                                propertyCategories.map((category: any) => (
                                  <CommandItem
                                    key={category.code || category.id}
                                    value={String(category.code || category.id)}
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
                                    {category.nameAr || category.nameEn || category.code || category.name || "فئة"}
                                  </CommandItem>
                                ))
                              ) : (
                                <CommandItem disabled>
                                  <div className="text-gray-500 text-xs py-2">لا توجد فئات متاحة - يرجى التحقق من الاتصال</div>
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {form.propertyCategory && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        تم اختيار الفئة
                      </p>
                    )}
                  </div>
                  
                  {/* Step 2: Type Dropdown */}
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
                              ) : typesError ? (
                                <CommandItem disabled>
                                  <div className="text-red-600 text-xs py-2">
                                    <div>خطأ في تحميل الأنواع</div>
                                    <div className="text-xs mt-1">{typesError instanceof Error ? typesError.message : "خطأ غير معروف"}</div>
                                  </div>
                                </CommandItem>
                              ) : propertyTypes && Array.isArray(propertyTypes) && propertyTypes.length > 0 ? (
                                propertyTypes.map((type: any) => (
                                  <CommandItem
                                    key={type.code || type.id}
                                    value={String(type.code || type.id)}
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
                                    {type.nameAr || type.nameEn || type.code || type.name || "نوع"}
                                  </CommandItem>
                                ))
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
                    {form.propertyType && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        تم اختيار النوع
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm">نوع العرض *</label>
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
                <label className="mb-1 block text-sm">السعر (﷼) *</label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1 block text-sm">الوصف</label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-2xl"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">الموقع</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">المنطقة</label>
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
                            (regions || []).map((region: any) => (
                              <CommandItem
                                key={region.id}
                                value={String(region.id)}
                                onSelect={(currentValue) => {
                                  setForm({ 
                                    ...form, 
                                    region: currentValue === form.region ? "" : currentValue,
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
                                {region.nameAr || region.nameEn}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="mb-1 block text-sm">المدينة *</label>
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
                            filteredCities.map((city: any) => (
                              <CommandItem
                                key={city.id}
                                value={String(city.id)}
                                onSelect={(currentValue) => {
                                  setForm({ 
                                    ...form, 
                                    city: currentValue === form.city ? "" : currentValue,
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
                                {city.nameAr || city.nameEn}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="mb-1 block text-sm">الحي</label>
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
                      <CommandInput placeholder="ابحث عن الحي..." />
                      <CommandList>
                        <CommandEmpty>لم يتم العثور على الحي.</CommandEmpty>
                        <CommandGroup>
                          {filteredDistricts.length === 0 ? (
                            <CommandItem disabled>
                              <span>يرجى اختيار المدينة أولاً</span>
                            </CommandItem>
                          ) : (
                            filteredDistricts.map((district: any) => (
                              <CommandItem
                                key={district.id}
                                value={String(district.id)}
                                onSelect={(currentValue) => {
                                  setForm({ 
                                    ...form, 
                                    district: currentValue === form.district ? "" : currentValue
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
                                {district.nameAr || district.nameEn}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="mb-1 block text-sm">العنوان التفصيلي</label>
                <Input value={form.streetAddress} onChange={(e) => setForm({ ...form, streetAddress: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">خط العرض</label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">خط الطول</label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">المواصفات</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm">عدد الغرف</label>
                <Input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">عدد الحمامات</label>
                <Input type="number" min={0} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">عدد صالات المعيشة</label>
                <Input type="number" min={0} value={form.livingRooms} onChange={(e) => setForm({ ...form, livingRooms: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">عدد المطابخ</label>
                <Input type="number" min={0} value={form.kitchens} onChange={(e) => setForm({ ...form, kitchens: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">رقم الطابق</label>
                <Input type="number" value={form.floorNumber} onChange={(e) => setForm({ ...form, floorNumber: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">عدد الطوابق الكلي</label>
                <Input type="number" min={0} value={form.totalFloors} onChange={(e) => setForm({ ...form, totalFloors: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">المساحة (م²)</label>
                <Input type="number" min={0} value={form.areaSqm} onChange={(e) => setForm({ ...form, areaSqm: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">سنة البناء</label>
                <Input type="number" min={1900} max={new Date().getFullYear()} value={form.buildingYear} onChange={(e) => setForm({ ...form, buildingYear: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">تكرار الدفع</label>
                <Input value={form.paymentFrequency} onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value })} placeholder="مثال: شهري، سنوي" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">المميزات والمرافق</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.hasParking} onCheckedChange={(value) => setForm({ ...form, hasParking: Boolean(value) })} />
                يوجد موقف سيارة
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.hasElevator} onCheckedChange={(value) => setForm({ ...form, hasElevator: Boolean(value) })} />
                يوجد مصعد
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.hasMaidsRoom} onCheckedChange={(value) => setForm({ ...form, hasMaidsRoom: Boolean(value) })} />
                يحتوي على غرفة خادمة
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.hasDriverRoom} onCheckedChange={(value) => setForm({ ...form, hasDriverRoom: Boolean(value) })} />
                يحتوي على غرفة سائق
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.furnished} onCheckedChange={(value) => setForm({ ...form, furnished: Boolean(value) })} />
                مفروش
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.balcony} onCheckedChange={(value) => setForm({ ...form, balcony: Boolean(value) })} />
                يحتوي على شرفة
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.swimmingPool} onCheckedChange={(value) => setForm({ ...form, swimmingPool: Boolean(value) })} />
                يحتوي على مسبح
              </label>
              <label className="flex items-center justify-end gap-2 text-slate-600">
                <Checkbox checked={form.centralAc} onCheckedChange={(value) => setForm({ ...form, centralAc: Boolean(value) })} />
                تكييف مركزي
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">الصور</h2>
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
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-28 object-cover rounded-xl border border-slate-200" />
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
                <div className="text-sm text-slate-500">لم يتم اختيار صور بعد.</div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">معلومات التواصل</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm">اسم جهة الاتصال</label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">رقم الجوال *</label>
                <Input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} required />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-2xl bg-emerald-600 px-8 text-lg font-semibold text-white shadow-[0_20px_45px_rgba(16,185,129,0.25)] hover:bg-emerald-700 hover:shadow-[0_25px_60px_rgba(16,185,129,0.28)] disabled:opacity-60"
            >
              {loading ? "جاري الإرسال..." : "إرسال الإعلان"}
            </Button>
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
