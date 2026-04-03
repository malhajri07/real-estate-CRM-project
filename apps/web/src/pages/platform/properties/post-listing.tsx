import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/ui/page-header";
import { apiPost } from "@/lib/apiClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, MapPin, Banknote, Bed, Bath, Maximize, ChevronDown,
  ImagePlus, CheckCircle2, ArrowRight, ArrowLeft, Home, Tag,
  Sofa, Layers, FileText,
} from "lucide-react";

const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة" },
  { value: "villa", label: "فيلا" },
  { value: "land", label: "أرض" },
  { value: "commercial", label: "تجاري" },
  { value: "office", label: "مكتب" },
  { value: "warehouse", label: "مستودع" },
  { value: "building", label: "مبنى" },
  { value: "chalet", label: "شاليه" },
];

const LISTING_TYPES = [
  { value: "sale", label: "للبيع" },
  { value: "rent", label: "للإيجار" },
];

const CATEGORIES = [
  { value: "residential", label: "سكني" },
  { value: "commercial", label: "تجاري" },
  { value: "industrial", label: "صناعي" },
  { value: "agricultural", label: "زراعي" },
];

const schema = z.object({
  // Step 1: Basic Info
  title: z.string().min(3, "العنوان مطلوب (3 أحرف على الأقل)"),
  description: z.string().min(10, "الوصف مطلوب (10 أحرف على الأقل)"),
  propertyType: z.string().min(1, "نوع العقار مطلوب"),
  listingType: z.string().min(1, "نوع الإعلان مطلوب"),
  propertyCategory: z.string().min(1, "التصنيف مطلوب"),
  // Step 2: Location
  city: z.string().min(1, "المدينة مطلوبة"),
  state: z.string().optional(),
  address: z.string().min(1, "العنوان التفصيلي مطلوب"),
  zipCode: z.string().optional(),
  // Step 3: Details & Price
  price: z.string().min(1, "السعر مطلوب"),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  livingRooms: z.string().optional(),
  area: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STEPS = [
  { id: 1, title: "معلومات العقار", icon: Building2 },
  { id: 2, title: "الموقع", icon: MapPin },
  { id: 3, title: "التفاصيل والسعر", icon: Banknote },
];

const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
  1: ["title", "description", "propertyType", "listingType", "propertyCategory"],
  2: ["city", "address"],
  3: ["price"],
};

export default function PostListingPage() {
  const { dir } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", description: "", propertyType: "apartment", listingType: "sale",
      propertyCategory: "residential", city: "", state: "", address: "", zipCode: "",
      price: "", bedrooms: "", bathrooms: "", livingRooms: "", area: "",
    },
  });

  const progress = (step / STEPS.length) * 100;

  const nextStep = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields);
    if (valid) setStep(s => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await apiPost("/api/listings", {
        ...data,
        price: Number(data.price) || 0,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
        bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
        livingRooms: data.livingRooms ? Number(data.livingRooms) : undefined,
        squareFeet: data.area ? Number(data.area) : undefined,
        status: "draft",
      });
      setSuccess(true);
      toast({ title: "تم بنجاح", description: "تم إرسال الإعلان للمراجعة" });
    } catch {
      toast({ title: "خطأ", description: "تعذر إرسال الإعلان", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={PAGE_WRAPPER} dir={dir}>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground mb-2">تم إرسال الإعلان بنجاح</h2>
            <p className="text-muted-foreground">سيتم مراجعة إعلانك من قبل فريق الإدارة وإشعارك عند الموافقة</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setSuccess(false); form.reset(); setStep(1); }}>
              إضافة إعلان آخر
            </Button>
            <Button onClick={() => setLocation("/home/platform/properties")}>
              عرض العقارات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader title="إضافة إعلان جديد" subtitle="أضف إعلان عقاري جديد للمراجعة والنشر" />

      {/* Step Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-colors ${
                  isDone ? "bg-primary border-primary text-primary-foreground" :
                  isActive ? "border-primary text-primary bg-primary/10" :
                  "border-border text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`text-sm font-bold hidden sm:inline ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
                {s.id < STEPS.length && <Separator className="w-8 sm:w-16 mx-2" />}
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="icon-container"><Building2 className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle>معلومات العقار</CardTitle>
                    <CardDescription>المعلومات الأساسية للإعلان العقاري</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان الإعلان *</FormLabel>
                    <FormControl><Input {...field} placeholder="مثال: شقة فاخرة 3 غرف في حي الياسمين" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف العقار *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="اكتب وصفاً تفصيلياً للعقار يشمل المميزات والتشطيبات..." rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Property Type */}
                  <FormField control={form.control} name="propertyType" render={() => (
                    <FormItem>
                      <FormLabel>نوع العقار *</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                            <span className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              {PROPERTY_TYPES.find(t => t.value === form.watch("propertyType"))?.label || "اختر"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {PROPERTY_TYPES.map(t => (
                            <DropdownMenuItem key={t.value} onClick={() => form.setValue("propertyType", t.value, { shouldValidate: true })}>
                              {t.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Listing Type */}
                  <FormField control={form.control} name="listingType" render={() => (
                    <FormItem>
                      <FormLabel>نوع الإعلان *</FormLabel>
                      <div className="flex gap-2">
                        {LISTING_TYPES.map(lt => (
                          <Button
                            key={lt.value}
                            type="button"
                            variant={form.watch("listingType") === lt.value ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => form.setValue("listingType", lt.value, { shouldValidate: true })}
                          >
                            {lt.label}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Category */}
                  <FormField control={form.control} name="propertyCategory" render={() => (
                    <FormItem>
                      <FormLabel>التصنيف *</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-between h-10 font-normal">
                            <span className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              {CATEGORIES.find(c => c.value === form.watch("propertyCategory"))?.label || "اختر"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                          {CATEGORIES.map(c => (
                            <DropdownMenuItem key={c.value} onClick={() => form.setValue("propertyCategory", c.value, { shouldValidate: true })}>
                              {c.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="icon-container"><MapPin className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle>موقع العقار</CardTitle>
                    <CardDescription>حدد موقع العقار بدقة</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة *</FormLabel>
                      <FormControl><Input {...field} placeholder="مثال: الرياض" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المنطقة</FormLabel>
                      <FormControl><Input {...field} placeholder="مثال: منطقة الرياض" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان التفصيلي *</FormLabel>
                    <FormControl><Input {...field} placeholder="مثال: حي الياسمين، شارع الأمير سلطان" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="zipCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرمز البريدي</FormLabel>
                    <FormControl><Input {...field} placeholder="مثال: 12345" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Map placeholder */}
                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold">خريطة الموقع (قريباً)</p>
                    <p className="text-xs">سيتم إضافة تحديد الموقع على الخريطة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Details & Price */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="icon-container"><Banknote className="h-5 w-5 text-primary" /></div>
                  <div>
                    <CardTitle>التفاصيل والسعر</CardTitle>
                    <CardDescription>أضف تفاصيل العقار والسعر المطلوب</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر (ريال سعودي) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} type="number" placeholder="0" className="pe-16 text-lg font-bold" />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">ر.س</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="bedrooms" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> غرف النوم</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bathrooms" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> دورات المياه</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="livingRooms" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Sofa className="h-3.5 w-3.5" /> الصالات</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="area" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> المساحة (م²)</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="0" /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <Separator />

                {/* Image upload placeholder */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">صور العقار</p>
                  <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer">
                    <ImagePlus className="h-10 w-10 mb-3 opacity-50" />
                    <p className="text-sm font-bold">اسحب الصور هنا أو انقر للرفع</p>
                    <p className="text-xs mt-1">PNG, JPG حتى 10 ميجابايت لكل صورة</p>
                  </div>
                </div>

                {/* Summary */}
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="pt-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">ملخص الإعلان</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">العنوان:</div>
                      <div className="font-bold">{form.watch("title") || "—"}</div>
                      <div className="text-muted-foreground">النوع:</div>
                      <div><Badge variant="secondary">{PROPERTY_TYPES.find(t => t.value === form.watch("propertyType"))?.label}</Badge></div>
                      <div className="text-muted-foreground">الإعلان:</div>
                      <div><Badge variant="outline">{LISTING_TYPES.find(t => t.value === form.watch("listingType"))?.label}</Badge></div>
                      <div className="text-muted-foreground">المدينة:</div>
                      <div className="font-bold">{form.watch("city") || "—"}</div>
                      <div className="text-muted-foreground">السعر:</div>
                      <div className="font-bold text-primary">{form.watch("price") ? `${Number(form.watch("price")).toLocaleString("en-US")} ر.س` : "—"}</div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1} className="gap-2">
              <ArrowRight className="h-4 w-4" /> السابق
            </Button>
            <div className="text-sm text-muted-foreground font-bold">
              الخطوة {step} من {STEPS.length}
            </div>
            {step < STEPS.length ? (
              <Button type="button" onClick={nextStep} className="gap-2">
                التالي <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? "جاري الإرسال..." : "إرسال للمراجعة"}
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
