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
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/page-header";

export default function PostListingPage() {
  const { t, dir } = useLanguage();
  const [form, setForm] = useState({
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const onChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          moderationStatus: 'pending',
          status: 'draft',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setMessage('تم إرسال الإعلان للمراجعة');
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
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">العنوان</Label>
                <Input id="title" name="title" value={form.title} onChange={onChange} placeholder="العنوان" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان التفصيلي</Label>
                <Input id="address" name="address" value={form.address} onChange={onChange} placeholder="العنوان التفصيلي" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input id="city" name="city" value={form.city} onChange={onChange} placeholder="المدينة" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">المنطقة</Label>
                  <Input id="state" name="state" value={form.state} onChange={onChange} placeholder="المنطقة" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">الرمز البريدي</Label>
                  <Input id="zipCode" name="zipCode" value={form.zipCode} onChange={onChange} placeholder="الرمز البريدي" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">السعر</Label>
                <Input id="price" name="price" value={form.price} onChange={onChange} placeholder="السعر" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">النوع (مثال: شقة)</Label>
                  <Input id="propertyType" name="propertyType" value={form.propertyType} onChange={onChange} placeholder="النوع" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyCategory">التصنيف (مثال: سكني)</Label>
                  <Input id="propertyCategory" name="propertyCategory" value={form.propertyCategory} onChange={onChange} placeholder="التصنيف" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" name="latitude" value={form.latitude} onChange={onChange} placeholder="Latitude" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" name="longitude" value={form.longitude} onChange={onChange} placeholder="Longitude" />
                </div>
              </div>
              <Button disabled={submitting}>
                {submitting ? '...جاري الإرسال' : 'إرسال للمراجعة'}
              </Button>
              {message && <div className="text-xs text-muted-foreground mt-2">{message}</div>}
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
