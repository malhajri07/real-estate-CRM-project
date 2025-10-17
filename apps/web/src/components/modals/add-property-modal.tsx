import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertPropertySchema, type InsertProperty } from "@shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPropertyModal({ open, onOpenChange }: AddPropertyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      latitude: "",
      longitude: "",
      price: 0,
      propertyType: "",
      status: "active",
      bedrooms: 0,
      bathrooms: 0,
      livingRooms: 0,
      squareFeet: 0,
      photoUrls: [],
      features: [],
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({ title: "Success", description: "Property created successfully" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create property",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: InsertProperty) => {
    const payload: InsertProperty = {
      ...data,
      photoUrls: (data.photoUrls ?? []).map((url) => url.trim()).filter(Boolean),
      features: data.features ?? [],
    };
    createPropertyMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl backdrop-blur-xl bg-white/90 ring-1 ring-emerald-200/40 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">إضافة عقار جديد</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع العقار *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع العقار" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="house">منزل</SelectItem>
                        <SelectItem value="condo">شقة فاخرة</SelectItem>
                        <SelectItem value="apartment">شقة</SelectItem>
                        <SelectItem value="commercial">تجاري</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="وصف العقار"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>العنوان *</FormLabel>
                    <FormControl>
                      <Input placeholder="عنوان الشارع" {...field} />
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
                    <FormLabel>المدينة *</FormLabel>
                    <FormControl>
                      <Input placeholder="المدينة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المنطقة *</FormLabel>
                    <FormControl>
                      <Input placeholder="المنطقة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Coordinates for Google Maps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-xl border border-border">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">📍 إحداثيات الموقع (اختياري)</h3>
                <p className="text-xs text-muted-foreground mb-3">أضف الإحداثيات لعرض العقار على خرائط جوجل</p>
              </div>
              <div></div>
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
                        placeholder="مثال: 24.7136" 
                        {...field} 
                        value={field.value || ""}
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
                        placeholder="مثال: 46.6753" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الرمز البريدي *</FormLabel>
                    <FormControl>
                      <Input placeholder="الرمز البريدي" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="السعر"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>غرف النوم</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="غرف النوم"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                    <FormLabel>دورات المياه</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="دورات المياه"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
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
                    <FormLabel>صالات المعيشة</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="عدد صالات المعيشة"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="squareFeet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المساحة بالمتر المربع</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="المساحة بالمتر المربع"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photoUrls"
                render={({ field }) => {
                  const urls = Array.isArray(field.value) ? field.value : [];
                  return (
                    <FormItem>
                      <FormLabel>روابط الصور (الحد الأقصى 10)</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          {urls.map((url, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder={`رابط الصورة ${index + 1}`}
                                value={url}
                                onChange={(e) => {
                                  const newUrls = [...urls];
                                  newUrls[index] = e.target.value;
                                  field.onChange(newUrls);
                                }}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newUrls = urls.filter((_, i) => i !== index);
                                  field.onChange(newUrls);
                                }}
                                className="h-10 w-10 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                          {urls.length < 10 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange([...urls, ""])}
                              className="w-full"
                            >
                              + إضافة رابط صورة ({urls.length}/10)
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse pt-4">
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
              >
                {createPropertyMutation.isPending ? "جار الحفظ..." : "حفظ العقار"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
