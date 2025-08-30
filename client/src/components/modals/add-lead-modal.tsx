import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { insertLeadSchema, type InsertLead } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, User, Phone, Mail, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLeadModal({ open, onOpenChange }: AddLeadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cityOpen, setCityOpen] = useState(false);

  // Fetch Saudi cities from the database
  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/saudi-cities"],
    enabled: open, // Only fetch when modal is open
  });

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      age: undefined,
      maritalStatus: "",
      numberOfDependents: 0,
      leadSource: "",
      interestType: "",
      budgetRange: "",
      status: "new",
      notes: "",
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "نجح", description: "تم إنشاء العميل المحتمل بنجاح" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "خطأ", 
        description: "فشل في إنشاء العميل المحتمل",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: InsertLead) => {
    createLeadMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-8 my-8 p-8 bg-gray-50" dir="rtl">
        <div className="pt-4"></div>
        <DialogHeader className="mb-6 text-right">
          <DialogTitle className="text-lg font-bold text-gray-900 font-droid-kufi">إضافة عميل محتمل جديد</DialogTitle>
          <DialogDescription className="text-xs text-gray-600 mt-2">
            املأ المعلومات التالية لإضافة عميل محتمل جديد إلى النظام
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Personal Information Section */}
            <div className="bg-blue-100 p-4 rounded-md" dir="rtl">
              <h3 className="text-sm font-bold text-gray-900 mb-3 font-droid-kufi text-right">
                المعلومات الشخصية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">الاسم الأول *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل الاسم الأول" {...field} className="text-xs h-8 font-normal text-right" dir="rtl" />
                      </FormControl>
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">اسم العائلة *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم العائلة" {...field} className="text-xs h-8 font-normal text-right" dir="rtl" />
                      </FormControl>
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">العمر</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="أدخل العمر" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          className="text-xs h-8 font-normal text-right"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="bg-green-100 p-4 rounded-md" dir="rtl">
              <h3 className="text-sm font-bold text-gray-900 mb-3 font-droid-kufi text-right">
                معلومات الاتصال
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">البريد الإلكتروني *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="أدخل عنوان البريد الإلكتروني" {...field} className="text-xs h-8 font-normal text-right" dir="rtl" />
                      </FormControl>
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">الهاتف</FormLabel>
                      <FormControl>
                        <Input 
                          type="tel" 
                          placeholder="05XXXXXXXX" 
                          {...field} 
                          value={field.value || ""} 
                          maxLength={9}
                          className="text-xs h-8 font-normal text-right"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">المدينة</FormLabel>
                      <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={cityOpen}
                              className={cn(
                                "w-full justify-between text-xs h-8 font-normal text-right",
                                !field.value && "text-muted-foreground"
                              )}
                              dir="rtl"
                            >
                              {field.value
                                ? (cities as any[])?.find((city: any) => city.nameArabic === field.value)?.nameArabic
                                : "اختر المدينة"}
                              <ChevronsUpDown className="mr-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="ابحث عن المدينة..." className="text-xs font-normal text-right" dir="rtl" />
                            <CommandList>
                              <CommandEmpty className="text-xs text-right">لم يتم العثور على المدينة.</CommandEmpty>
                              <CommandGroup>
                                {citiesLoading ? (
                                  <CommandItem disabled>
                                    <div className="flex items-center justify-center p-2">
                                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                      <span className="text-xs font-normal">جار التحميل...</span>
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
                                      className="text-xs font-normal text-right"
                                      dir="rtl"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-3 w-3",
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
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Demographics Section */}
            <div className="bg-yellow-100 p-4 rounded-md" dir="rtl">
              <h3 className="text-sm font-bold text-gray-900 mb-3 font-droid-kufi text-right">
                المعلومات الديموغرافية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">الحالة الاجتماعية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""} dir="rtl">
                        <FormControl>
                          <SelectTrigger className="text-xs h-8 font-normal text-right" dir="rtl">
                            <SelectValue placeholder="اختر الحالة الاجتماعية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="أعزب" className="text-xs font-normal text-right">أعزب</SelectItem>
                          <SelectItem value="متزوج" className="text-xs font-normal text-right">متزوج</SelectItem>
                          <SelectItem value="مطلق" className="text-xs font-normal text-right">مطلق</SelectItem>
                          <SelectItem value="أرمل" className="text-xs font-normal text-right">أرمل</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numberOfDependents"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">عدد المُعالين</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="أدخل عدد المُعالين" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                          value={field.value || 0}
                          className="text-xs h-8 font-normal text-right"
                          dir="rtl"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-right" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Business Information Section */}
            <div className="bg-purple-100 p-4 rounded-md" dir="rtl">
              <h3 className="text-sm font-bold text-gray-900 mb-3 font-droid-kufi text-right">
                المعلومات التجارية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="leadSource"
                  render={({ field }) => (
                    <FormItem className="text-right">
                      <FormLabel className="text-xs font-bold text-right">مصدر العميل المحتمل</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="اختر مصدر العميل المحتمل" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="website" className="text-xs">الموقع الإلكتروني</SelectItem>
                          <SelectItem value="referral" className="text-xs">إحالة</SelectItem>
                          <SelectItem value="social-media" className="text-xs">وسائل التواصل الاجتماعي</SelectItem>
                          <SelectItem value="walk-in" className="text-xs">زيارة مباشرة</SelectItem>
                          <SelectItem value="cold-call" className="text-xs">اتصال بارد</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budgetRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">نطاق الميزانية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="text-xs h-8">
                            <SelectValue placeholder="اختر نطاق الميزانية" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under-200k" className="text-xs">أقل من 200 ألف ﷼</SelectItem>
                          <SelectItem value="200k-400k" className="text-xs">200 - 400 ألف ﷼</SelectItem>
                          <SelectItem value="400k-600k" className="text-xs">400 - 600 ألف ﷼</SelectItem>
                          <SelectItem value="600k-800k" className="text-xs">600 - 800 ألف ﷼</SelectItem>
                          <SelectItem value="800k-plus" className="text-xs">أكثر من 800 ألف ﷼</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="interestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">نوع الاهتمام</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value || ""}
                          className="flex space-x-6 space-x-reverse"
                        >
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="buying" id="buying" />
                            <Label htmlFor="buying" className="text-xs">شراء</Label>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="selling" id="selling" />
                            <Label htmlFor="selling" className="text-xs">بيع</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-orange-100 p-4 rounded-md" dir="rtl">
              <h3 className="text-sm font-bold text-gray-900 mb-3 font-droid-kufi text-right">
                ملاحظات إضافية
              </h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="text-xs font-bold text-right">ملاحظات</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="ملاحظات إضافية حول العميل المحتمل"
                        {...field}
                        value={field.value || ""}
                        className="text-xs font-normal text-right"
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-right" />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-start space-x-3 space-x-reverse pt-4 border-t border-gray-200" dir="rtl">
              <Button 
                type="submit" 
                disabled={createLeadMutation.isPending}
                className="text-xs h-8 px-4 font-normal"
              >
                {createLeadMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    جار الحفظ...
                  </>
                ) : (
                  "حفظ العميل المحتمل"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="text-xs h-8 px-3 font-normal"
              >
                إلغاء
              </Button>
            </div>
          </form>
        </Form>
        <div className="pb-4"></div>
      </DialogContent>
    </Dialog>
  );
}