/**
 * add-property-drawer.tsx - Add Property Drawer Component
 * 
 * Location: apps/web/src/ → Components/ → Feature Components → modals/ → add-property-drawer.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Drawer component for adding new properties. Provides:
 * - Property creation form in drawer format
 * - Form validation
 * - Property submission
 * 
 * Related Files:
 * - apps/web/src/components/modals/add-property-modal.tsx - Modal variant
 * - apps/web/src/pages/properties.tsx - Properties page uses this
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertPropertySchema, type InsertProperty } from "@shared/types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown, Home, MapPin, Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import Drawer from "@/components/ui/drawer";

interface AddPropertyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPropertyDrawer({ open, onOpenChange }: AddPropertyDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch regions, cities and districts from the database
  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ["/api/regions"],
    enabled: open,
  });

  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/saudi-cities"],
    enabled: open,
  });

  const { data: districts, isLoading: districtsLoading } = useQuery({
    queryKey: ["/api/districts"],
    enabled: open,
  });

  const form = useForm<InsertProperty & { listingType?: string; region?: string; district?: string; area?: number }>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      squareFeet: 0,
      bedrooms: 0,
      bathrooms: 0,
      livingRooms: 0,
      propertyType: "",
      city: "",
      state: "",
      address: "",
      latitude: "",
      longitude: "",
      features: [],
      status: "active",
    },
  });

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Check total file size (10MB limit)
    const totalSize = [...selectedImages, ...files].reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "إجمالي حجم الصور يجب أن يكون أقل من 10 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    // Check maximum number of images (10 limit)
    if (selectedImages.length + files.length > 10) {
      toast({
        title: "خطأ",
        description: "يمكن رفع 10 صور كحد أقصى",
        variant: "destructive"
      });
      return;
    }

    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const createPropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const formData = new FormData();

      // Append property data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Append images
      selectedImages.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await fetch('/api/listings', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create property');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم إنشاء العقار بنجاح" });
      onOpenChange(false);
      form.reset();
      setSelectedImages([]);
      setImagePreviews([]);
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء العقار",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: InsertProperty & { listingType?: string; region?: string; district?: string; area?: number }) => {
    const submitData: InsertProperty = {
      ...data,
      latitude: data.latitude || "",
      longitude: data.longitude || "",
    };
    createPropertyMutation.mutate(submitData);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="إضافة عقار جديد"
      description="املأ المعلومات التالية لإضافة عقار جديد إلى النظام"
      side="left"
    >
      <div className="p-6 pb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Property Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                المعلومات الأساسية للعقار
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان العقار *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل عنوان العقار" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف العقار</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="أدخل وصف مفصل للعقار"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر (ريال) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="أدخل السعر"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="squareFeet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المساحة (م²) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="أدخل المساحة"
                            {...field}
                            value={typeof field.value === 'number' ? field.value : Number(field.value) || 0}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد الغرف</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          />
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
                        <FormLabel>عدد الحمامات</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Property Type and Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                نوع العقار والموقع
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع العقار *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع العقار" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="apartment">شقة</SelectItem>
                            <SelectItem value="villa">فيلا</SelectItem>
                            <SelectItem value="townhouse">تاون هاوس</SelectItem>
                            <SelectItem value="duplex">دوبلكس</SelectItem>
                            <SelectItem value="commercial">محل تجاري</SelectItem>
                            <SelectItem value="office">مكتب</SelectItem>
                            <SelectItem value="land">أرض</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="listingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الإعلان *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={typeof field.value === 'string' ? field.value : ""}
                            className="flex space-x-4 rtl:space-x-reverse"
                          >
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <RadioGroupItem value="sale" id="sale" />
                              <Label htmlFor="sale">بيع</Label>
                            </div>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <RadioGroupItem value="rent" id="rent" />
                              <Label htmlFor="rent">إيجار</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المنطقة *</FormLabel>
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
                                  ? (regions as any[])?.find((region: any) => region.nameArabic === field.value)?.nameArabic
                                  : "اختر المنطقة"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="ابحث عن المنطقة..." />
                              <CommandList>
                                <CommandEmpty>لم يتم العثور على المنطقة.</CommandEmpty>
                                <CommandGroup>
                                  {regionsLoading ? (
                                    <CommandItem disabled>
                                      <div className="flex items-center justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span>جار التحميل...</span>
                                      </div>
                                    </CommandItem>
                                  ) : (
                                    regions && Array.isArray(regions) ? regions.map((region: any) => (
                                      <CommandItem
                                        key={region.id}
                                        value={region.nameArabic}
                                        onSelect={(currentValue) => {
                                          field.onChange(currentValue === field.value ? "" : currentValue)
                                          setRegionOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === region.nameArabic ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {region.nameArabic}
                                      </CommandItem>
                                    )) : null
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة *</FormLabel>
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
                              >
                                {field.value
                                  ? (cities as any[])?.find((city: any) => city.nameArabic === field.value)?.nameArabic
                                  : "اختر المدينة"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="ابحث عن المدينة..." />
                              <CommandList>
                                <CommandEmpty>لم يتم العثور على المدينة.</CommandEmpty>
                                <CommandGroup>
                                  {citiesLoading ? (
                                    <CommandItem disabled>
                                      <div className="flex items-center justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span>جار التحميل...</span>
                                      </div>
                                    </CommandItem>
                                  ) : (
                                    cities && Array.isArray(cities) ? cities.map((city: any) => (
                                      <CommandItem
                                        key={city.id}
                                        value={city.nameArabic}
                                        onSelect={(currentValue) => {
                                          field.onChange(currentValue === field.value ? "" : currentValue)
                                          setCityOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === city.nameArabic ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {city.nameArabic}
                                      </CommandItem>
                                    )) : null
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
                        <FormLabel>الحي</FormLabel>
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
                              >
                                {field.value
                                  ? (districts as any[])?.find((district: any) => district.nameArabic === field.value)?.nameArabic
                                  : "اختر الحي"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="ابحث عن الحي..." />
                              <CommandList>
                                <CommandEmpty>لم يتم العثور على الحي.</CommandEmpty>
                                <CommandGroup>
                                  {districtsLoading ? (
                                    <CommandItem disabled>
                                      <div className="flex items-center justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span>جار التحميل...</span>
                                      </div>
                                    </CommandItem>
                                  ) : (
                                    districts && Array.isArray(districts) ? districts.map((district: any) => (
                                      <CommandItem
                                        key={district.id}
                                        value={district.nameArabic}
                                        onSelect={(currentValue) => {
                                          field.onChange(currentValue === field.value ? "" : currentValue)
                                          setDistrictOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === district.nameArabic ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {district.nameArabic}
                                      </CommandItem>
                                    )) : null
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>خط العرض</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="24.7136"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
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
                        <FormLabel>خط الطول</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="46.6753"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان التفصيلي</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="أدخل العنوان التفصيلي للعقار"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                صور العقار
              </h3>
              <div className="space-y-4">
                {/* Upload Button */}
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">اضغط لرفع الصور</span> أو اسحبها هنا
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG حتى 10 ميجابايت (حد أقصى 10 صور)
                      </p>
                    </div>
                    <input
                      id="image-upload"
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Count and Size Info */}
                {selectedImages.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p>
                      تم رفع {selectedImages.length} من 10 صور
                    </p>
                    <p>
                      الحجم الإجمالي: {(selectedImages.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024)).toFixed(2)} ميجابايت
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Sticky at bottom */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 -mx-6 -mb-6 mt-6">
              <div className="flex justify-end space-x-3 space-x-reverse">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createPropertyMutation.isPending}
                  style={{ backgroundColor: 'rgb(128 193 165)', color: 'white' }}
                  className="hover:opacity-90 disabled:opacity-50"
                >
                  {createPropertyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      جار الحفظ...
                    </>
                  ) : (
                    "حفظ العقار"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </Drawer>
  );
}
