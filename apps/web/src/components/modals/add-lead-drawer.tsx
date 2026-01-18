/**
 * add-lead-drawer.tsx - Add Lead Drawer Component
 * 
 * Location: apps/web/src/ → Components/ → Feature Components → modals/ → add-lead-drawer.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Drawer component for adding new leads. Provides:
 * - Lead creation form in drawer format
 * - Form validation
 * - Lead submission
 * 
 * Related Files:
 * - apps/web/src/components/modals/add-lead-modal.tsx - Modal variant
 * - apps/web/src/pages/leads.tsx - Leads page uses this
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
import { insertLeadSchema, type InsertLead } from "@shared/types";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Drawer from "@/components/ui/drawer";

interface AddLeadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLeadDrawer({ open, onOpenChange }: AddLeadDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cityOpen, setCityOpen] = useState(false);

  // Fetch Saudi cities from the database
  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/saudi-cities"],
    enabled: open, // Only fetch when drawer is open
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
    <Drawer 
      open={open} 
      onOpenChange={onOpenChange}
      title="إضافة عميل محتمل جديد"
      description="املأ المعلومات التالية لإضافة عميل محتمل جديد إلى النظام"
      side="left"
    >
      <div className="p-6 pb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal & Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                المعلومات الشخصية والاتصال
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأول *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل الاسم الأول" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم العائلة *</FormLabel>
                        <FormControl>
                          <Input placeholder="أدخل اسم العائلة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="أدخل عنوان البريد الإلكتروني" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الهاتف</FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="05XXXXXXXX" 
                            {...field} 
                            value={field.value || ""} 
                            maxLength={9}
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
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العمر</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="أدخل العمر" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة</FormLabel>
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
                </div>
              </div>
            </div>

            {/* Demographics & Business Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                المعلومات الديموغرافية والتجارية
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maritalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الحالة الاجتماعية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الحالة الاجتماعية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="أعزب">أعزب</SelectItem>
                            <SelectItem value="متزوج">متزوج</SelectItem>
                            <SelectItem value="مطلق">مطلق</SelectItem>
                            <SelectItem value="أرمل">أرمل</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numberOfDependents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عدد المُعالين</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="أدخل عدد المُعالين" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                            value={field.value || 0}
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
                    name="leadSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مصدر العميل المحتمل</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر مصدر العميل المحتمل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="website">الموقع الإلكتروني</SelectItem>
                            <SelectItem value="referral">إحالة</SelectItem>
                            <SelectItem value="social-media">وسائل التواصل الاجتماعي</SelectItem>
                            <SelectItem value="walk-in">زيارة مباشرة</SelectItem>
                            <SelectItem value="cold-call">اتصال بارد</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budgetRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نطاق الميزانية</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نطاق الميزانية" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="under-200k">أقل من 200 ألف ﷼</SelectItem>
                            <SelectItem value="200k-400k">200 - 400 ألف ﷼</SelectItem>
                            <SelectItem value="400k-600k">400 - 600 ألف ﷼</SelectItem>
                            <SelectItem value="600k-800k">600 - 800 ألف ﷼</SelectItem>
                            <SelectItem value="800k-plus">أكثر من 800 ألف ﷼</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="interestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الاهتمام</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value || ""}
                          className="flex space-x-4 rtl:space-x-reverse"
                        >
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <RadioGroupItem value="buying" id="buying" />
                            <Label htmlFor="buying">شراء</Label>
                          </div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <RadioGroupItem value="selling" id="selling" />
                            <Label htmlFor="selling">بيع</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="ملاحظات إضافية حول العميل المحتمل"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                  disabled={createLeadMutation.isPending}
                  style={{ backgroundColor: 'rgb(128 193 165)', color: 'white' }}
                  className="hover:opacity-90 disabled:opacity-50"
                >
                  {createLeadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      جار الحفظ...
                    </>
                  ) : (
                    "حفظ العميل المحتمل"
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
