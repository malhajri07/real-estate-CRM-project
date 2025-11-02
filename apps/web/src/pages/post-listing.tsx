import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY, BUTTON_PRIMARY_CLASSES } from "@/config/platform-theme";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PostListingPage() {
  const { t } = useLanguage();
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
    <main className={PAGE_WRAPPER} dir="rtl">
      <section className="space-y-6">
        <Card className={CARD_STYLES.container}>
          <CardHeader className={CARD_STYLES.header}>
            <CardTitle className={TYPOGRAPHY.pageTitle}>إضافة إعلان جديد</CardTitle>
          </CardHeader>
          <CardContent>
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
              <Button className={BUTTON_PRIMARY_CLASSES} disabled={submitting}>
                {submitting ? '...جاري الإرسال' : 'إرسال للمراجعة'}
              </Button>
              {message && <div className={cn(TYPOGRAPHY.caption, "mt-2")}>{message}</div>}
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
