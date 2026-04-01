/**
 * post-listing.tsx - Post New Listing Page
 * 
 * Location: apps/web/src/ → Pages/ → Platform Pages → post-listing.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Page for creating new property listings. Provides:
 * - Property listing form
 * - Property details input
 * - Image upload
 * 
 * Route: /home/platform/post-listing or /post-listing
 * 
 * Related Files:
 * - apps/api/routes/listings.ts - Listing API routes
 */

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { apiPost } from "@/lib/apiClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const postListingSchema = z.object({
  title: z.string().min(1, "يرجى إدخال العنوان"),
  address: z.string().min(1, "يرجى إدخال العنوان التفصيلي"),
  city: z.string().min(1, "يرجى إدخال المدينة"),
  state: z.string().min(1, "يرجى إدخال المنطقة"),
  zipCode: z.string().min(1, "يرجى إدخال الرمز البريدي"),
  price: z.string().min(1, "يرجى إدخال السعر"),
  propertyType: z.string().optional(),
  propertyCategory: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type PostListingFormData = z.infer<typeof postListingSchema>;

export default function PostListingPage() {
  const { t, dir } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const form = useForm<PostListingFormData>({
    resolver: zodResolver(postListingSchema),
    defaultValues: {
      title: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      price: "",
      propertyType: "شقة",
      propertyCategory: "سكني",
      latitude: "",
      longitude: "",
    },
  });

  const onSubmit = async (data: PostListingFormData) => {
    setSubmitting(true);
    setMessage("");
    try {
      await apiPost('/api/listings', {
        ...data,
        latitude: data.latitude ? Number(data.latitude) : undefined,
        longitude: data.longitude ? Number(data.longitude) : undefined,
        moderationStatus: 'pending',
        status: 'draft',
      });
      setMessage('تم إرسال الإعلان للمراجعة');
      form.reset();
    } catch (err: any) {
      setMessage('تعذر إرسال الإعلان');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={PAGE_WRAPPER} dir={dir}>
      <PageHeader title={t("إضافة إعلان جديد")} subtitle={t("أضف إعلان عقاري جديد للمراجعة")} />
      <section className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="العنوان" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان التفصيلي</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="العنوان التفصيلي" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدينة</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="المدينة" />
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
                        <FormLabel>المنطقة</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="المنطقة" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الرمز البريدي</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="الرمز البريدي" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="السعر" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>النوع (مثال: شقة)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="النوع" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="propertyCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التصنيف (مثال: سكني)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="التصنيف" />
                        </FormControl>
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
                          <Input {...field} placeholder="خط العرض" />
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
                          <Input {...field} placeholder="خط الطول" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '...جاري الإرسال' : 'إرسال للمراجعة'}
                </Button>
                {message && <div className="text-xs text-muted-foreground mt-2">{message}</div>}
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
