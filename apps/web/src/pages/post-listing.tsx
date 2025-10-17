import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
    <>
      <form onSubmit={onSubmit} className="apple-card p-6 space-y-4">
        <input className="border p-2 w-full" placeholder="العنوان" name="title" value={form.title} onChange={onChange} required />
        <input className="border p-2 w-full" placeholder="العنوان التفصيلي" name="address" value={form.address} onChange={onChange} required />
        <div className="grid grid-cols-3 gap-2">
          <input className="border p-2" placeholder="المدينة" name="city" value={form.city} onChange={onChange} required />
          <input className="border p-2" placeholder="المنطقة" name="state" value={form.state} onChange={onChange} required />
          <input className="border p-2" placeholder="الرمز البريدي" name="zipCode" value={form.zipCode} onChange={onChange} required />
        </div>
        <input className="border p-2 w-full" placeholder="السعر" name="price" value={form.price} onChange={onChange} required />
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" placeholder="النوع (مثال: شقة)" name="propertyType" value={form.propertyType} onChange={onChange} />
          <input className="border p-2" placeholder="التصنيف (مثال: سكني)" name="propertyCategory" value={form.propertyCategory} onChange={onChange} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" placeholder="Latitude" name="latitude" value={form.latitude} onChange={onChange} />
          <input className="border p-2" placeholder="Longitude" name="longitude" value={form.longitude} onChange={onChange} />
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded" disabled={submitting}>{submitting ? '...جاري الإرسال' : 'إرسال للمراجعة'}</button>
        {message && <div className="text-sm mt-2">{message}</div>}
      </form>
    </>
  );
}
