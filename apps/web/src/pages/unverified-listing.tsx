import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, UploadCloud, X } from "lucide-react";
import { useLocation } from "wouter";

const MAX_IMAGE_COUNT = 15;
const MAX_VIDEO_COUNT = 5;
const MAX_VIDEO_SIZE_BYTES = 1024 * 1024; // 1 MB

const AMENITIES = [
  "مكيفات",
  "مصعد",
  "موقف سيارات",
  "غرفة خادمة",
  "مسبح",
  "تدفئة مركزية",
  "شرفة",
  "مطبخ مجهز",
  "خدمات أمنية",
  "قرب المدارس",
  "قرب الأسواق",
  "إطلالة بانورامية",
];

const INITIAL_FORM = {
  title: "",
  description: "",
  propertyType: "شقة",
  propertyCategory: "سكني",
  listingType: "بيع",
  price: "",
  city: "",
  state: "",
  district: "",
  zipCode: "",
  address: "",
  bedrooms: "",
  bathrooms: "",
  areaSqm: "",
  landArea: "",
  latitude: "",
  longitude: "",
  completionYear: "",
  furnishing: "بدون فرش",
  occupancy: "خالي",
  maintenanceFees: "",
  paymentPlan: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  contactPreferredTime: "",
  additionalNotes: "",
};

type MediaItem = {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
  type: string;
};

type MessageState = { type: "success" | "error"; text: string } | null;

type ErrorState = string[];

export default function UnverifiedListingPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<ErrorState>([]);
  const [message, setMessage] = useState<MessageState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const totalMediaCount = useMemo(() => images.length + videos.length, [images, videos]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  };

  const readAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newErrors: string[] = [];
    const newItems: MediaItem[] = [];

    if (images.length + files.length > MAX_IMAGE_COUNT) {
      newErrors.push(`يمكن رفع ${MAX_IMAGE_COUNT} صور كحد أقصى.`);
    }

    for (const file of Array.from(files)) {
      if (images.length + newItems.length >= MAX_IMAGE_COUNT) break;

      try {
        const dataUrl = await readAsDataUrl(file);
        newItems.push({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          size: file.size,
          type: file.type,
        });
      } catch (error) {
        newErrors.push(`تعذر قراءة الصورة ${file.name}`);
      }
    }

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
    }
    if (newErrors.length > 0) {
      setErrors((prev) => [...prev, ...newErrors]);
    }

    event.target.value = "";
  };

  const handleVideoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newErrors: string[] = [];
    const newItems: MediaItem[] = [];

    for (const file of Array.from(files)) {
      if (videos.length + newItems.length >= MAX_VIDEO_COUNT) {
        newErrors.push(`يمكن رفع ${MAX_VIDEO_COUNT} مقاطع فيديو كحد أقصى.`);
        break;
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        newErrors.push(`لا يمكن رفع الفيديو ${file.name} لأنه يتجاوز 1 ميجابايت.`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        newItems.push({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl,
          size: file.size,
          type: file.type,
        });
      } catch (error) {
        newErrors.push(`تعذر قراءة الفيديو ${file.name}`);
      }
    }

    if (newItems.length > 0) {
      setVideos((prev) => [...prev, ...newItems]);
    }
    if (newErrors.length > 0) {
      setErrors((prev) => [...prev, ...newErrors]);
    }

    event.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  const removeVideo = (id: string) => {
    setVideos((prev) => prev.filter((item) => item.id !== id));
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    if (!form.title.trim()) newErrors.push("يرجى كتابة عنوان واضح للإعلان.");
    if (!form.description.trim() || form.description.trim().length < 30) newErrors.push("الوصف يجب أن يحتوي على 30 حرفًا على الأقل.");
    if (!form.price || Number.isNaN(Number(form.price))) newErrors.push("السعر مطلوب ويجب أن يكون رقمًا صحيحًا.");
    if (!form.city.trim()) newErrors.push("المدينة مطلوبة.");
    if (!form.address.trim()) newErrors.push("العنوان التفصيلي مطلوب.");
    if (!form.contactName.trim()) newErrors.push("يرجى إدخال اسم مقدم الطلب.");
    if (!form.contactPhone.trim() && !form.contactEmail.trim()) newErrors.push("يرجى توفير رقم تواصل أو بريد إلكتروني.");

    return newErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);
    setMessage(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        propertyType: form.propertyType,
        propertyCategory: form.propertyCategory,
        listingType: form.listingType,
        price: Number(form.price),
        city: form.city.trim(),
        state: form.state.trim() || null,
        district: form.district.trim() || null,
        zipCode: form.zipCode.trim() || null,
        address: form.address.trim(),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        areaSqm: form.areaSqm ? Number(form.areaSqm) : null,
        landArea: form.landArea ? Number(form.landArea) : null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        completionYear: form.completionYear ? Number(form.completionYear) : null,
        furnishing: form.furnishing || null,
        occupancy: form.occupancy || null,
        maintenanceFees: form.maintenanceFees ? Number(form.maintenanceFees) : null,
        paymentPlan: form.paymentPlan || null,
        amenities: selectedAmenities,
        additionalNotes: form.additionalNotes || null,
        contact: {
          name: form.contactName.trim(),
          email: form.contactEmail.trim() || null,
          phone: form.contactPhone.trim() || null,
          preferredTime: form.contactPreferredTime.trim() || null,
        },
        media: {
          images: images.map((item) => item.dataUrl),
          videos: videos.map((item) => item.dataUrl),
        },
      };

      const response = await fetch("/api/unverified-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.message ?? "تعذر إرسال الإعلان، حاول مرة أخرى.");
      }

      setMessage({ type: "success", text: "تم استلام إعلانك بنجاح! سيتواصل معك أحد الوسطاء المعتمدين بعد مراجعة التفاصيل." });
      setForm(INITIAL_FORM);
      setSelectedAmenities([]);
      setImages([]);
      setVideos([]);
    } catch (error) {
      console.error("Unverified listing submission error", error);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "حدث خطأ غير متوقع." });
    } finally {
      setSubmitting(false);
    }
  };

  const goBackToLanding = () => {
    window.location.hash = "";
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">أرسل إعلان عقارك</h1>
            <p className="text-slate-600 mt-2 max-w-3xl">
              هذه الصفحة مخصصة لأصحاب العقارات غير المعتمدين لإدخال تفاصيل عقارهم. بعد الإرسال، سيتم مراجعة البيانات من قبل وسيط عقاري معتمد للتسويق والترويج بالنيابة عنك.
            </p>
          </div>
          <button
            type="button"
            onClick={goBackToLanding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </button>
        </div>

        <div className="bg-white shadow-lg rounded-3xl border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">بيانات العقار</h2>
              <p className="text-slate-500 text-sm">املأ كافة التفاصيل لمساعدة الوكلاء على تقييم عقارك بسرعة.</p>
            </div>
            <div className="text-xs text-slate-400">
              {`تم رفع ${images.length} صورة و ${videos.length} فيديو (الحد الأقصى ${MAX_IMAGE_COUNT} صورة و ${MAX_VIDEO_COUNT} فيديو)`}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-10">
            {errors.length > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4 leading-relaxed">
                <strong className="block font-semibold mb-2">يرجى مراجعة البيانات التالية:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {message && (
              <div
                className={`rounded-2xl border p-4 ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-slate-600">عنوان الإعلان *</span>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="مثال: فيلا فاخرة في حي الياسمين"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">نوع العقار *</span>
                  <select
                    name="propertyType"
                    value={form.propertyType}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="شقة">شقة</option>
                    <option value="فيلا">فيلا</option>
                    <option value="دوبلكس">دوبلكس</option>
                    <option value="مكتب">مكتب</option>
                    <option value="محل تجاري">محل تجاري</option>
                    <option value="مستودع">مستودع</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">تصنيف العقار *</span>
                  <select
                    name="propertyCategory"
                    value={form.propertyCategory}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="سكني">سكني</option>
                    <option value="تجاري">تجاري</option>
                    <option value="استثماري">استثماري</option>
                    <option value="زراعي">زراعي</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">نوع العرض *</span>
                  <select
                    name="listingType"
                    value={form.listingType}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="بيع">بيع</option>
                    <option value="إيجار">إيجار</option>
                    <option value="استثمار">استثمار</option>
                  </select>
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-slate-600">السعر المطلوب *</span>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="مثال: 750000"
                    type="number"
                    min="0"
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-slate-600">عدد الغرف</span>
                    <input
                      name="bedrooms"
                      value={form.bedrooms}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                      type="number"
                      min="0"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600">عدد دورات المياه</span>
                    <input
                      name="bathrooms"
                      value={form.bathrooms}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                      type="number"
                      min="0"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-slate-600">المساحة بالمتر المربع</span>
                    <input
                      name="areaSqm"
                      value={form.areaSqm}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                      type="number"
                      min="0"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600">مساحة الأرض (اختياري)</span>
                    <input
                      name="landArea"
                      value={form.landArea}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                      type="number"
                      min="0"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm text-slate-600">سنة الإكمال المتوقعة</span>
                  <input
                    name="completionYear"
                    value={form.completionYear}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <label className="block">
                <span className="text-sm text-slate-600">وصف تفصيلي *</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  className="mt-1 w-full min-h-[140px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="قم بوصف مميزات العقار والموقع وأي تفاصيل إضافية تهم المسوقين والمشترين."
                  required
                />
              </label>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">موقع العقار</h3>
                <label className="block">
                  <span className="text-sm text-slate-600">المدينة *</span>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-slate-600">الحي</span>
                    <input
                      name="district"
                      value={form.district}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600">المنطقة/المحافظة</span>
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm text-slate-600">العنوان التفصيلي *</span>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="مثال: شارع أحمد بن حنبل، حي الياسمين"
                    required
                  />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-slate-600">الرمز البريدي</span>
                    <input
                      name="zipCode"
                      value={form.zipCode}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-600">إحداثيات جوجل (خط العرض)</span>
                    <input
                      name="latitude"
                      value={form.latitude}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                      type="number"
                      step="any"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm text-slate-600">إحداثيات جوجل (خط الطول)</span>
                  <input
                    name="longitude"
                    value={form.longitude}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    type="number"
                    step="any"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">حالة العقار</h3>
                <label className="block">
                  <span className="text-sm text-slate-600">حالة التأثيث</span>
                  <select
                    name="furnishing"
                    value={form.furnishing}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="بدون فرش">بدون فرش</option>
                    <option value="مفروش جزئياً">مفروش جزئياً</option>
                    <option value="مفروش بالكامل">مفروش بالكامل</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">حالة الإشغال</span>
                  <select
                    name="occupancy"
                    value={form.occupancy}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="خالي">خالي</option>
                    <option value="مؤجر">مؤجر</option>
                    <option value="مسكون من المالك">مسكون من المالك</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">رسوم الصيانة الشهرية (إن وجد)</span>
                  <input
                    name="maintenanceFees"
                    value={form.maintenanceFees}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    type="number"
                    min="0"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">خطة الدفع أو التقسيط</span>
                  <input
                    name="paymentPlan"
                    value={form.paymentPlan}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="مثال: دفعة أولى 30% والباقي على 12 شهر"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">ملاحظات إضافية</span>
                  <textarea
                    name="additionalNotes"
                    value={form.additionalNotes}
                    onChange={handleInputChange}
                    className="mt-1 w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="أضف أي تفاصيل مهمة مثل حالة الصك أو إمكانية التفاوض"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">وسائل الراحة والمميزات</h3>
              <div className="flex flex-wrap gap-3">
                {AMENITIES.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full px-4 py-2 text-sm transition border ${
                        isSelected
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">الصور ومقاطع الفيديو</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800">صور العقار (اختياري)</h4>
                      <p className="text-sm text-slate-500">يمكن تحميل حتى {MAX_IMAGE_COUNT} صورة.</p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer transition">
                      <UploadCloud className="w-4 h-4" /> رفع صور
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((item) => (
                        <div key={item.id} className="relative group">
                          <img src={item.dataUrl} alt={item.name} className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => removeImage(item.id)}
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

                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-800">مقاطع الفيديو (اختياري)</h4>
                      <p className="text-sm text-slate-500">الحد الأقصى {MAX_VIDEO_COUNT} مقاطع، حجم كل فيديو 1 ميجابايت.</p>
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer transition">
                      <UploadCloud className="w-4 h-4" /> رفع فيديو
                      <input type="file" accept="video/*" multiple className="hidden" onChange={handleVideoUpload} />
                    </label>
                  </div>
                  {videos.length > 0 ? (
                    <div className="space-y-3">
                      {videos.map((item) => (
                        <div key={item.id} className="relative rounded-xl border border-slate-200 overflow-hidden">
                          <video controls className="w-full h-36 object-cover bg-black">
                            <source src={item.dataUrl} type={item.type || "video/mp4"} />
                            المتصفح لا يدعم تشغيل الفيديو.
                          </video>
                          <button
                            type="button"
                            onClick={() => removeVideo(item.id)}
                            className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1"
                            aria-label="إزالة الفيديو"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">لم يتم اختيار مقاطع فيديو بعد.</div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">معلومات التواصل *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-sm text-slate-600">اسم المالك أو الممثل *</span>
                  <input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">رقم التواصل (يفضل الجوال)</span>
                  <input
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="مثال: 05XXXXXXXX"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">البريد الإلكتروني</span>
                  <input
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    type="email"
                    placeholder="example@email.com"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-600">وقت التواصل المفضل</span>
                  <input
                    name="contactPreferredTime"
                    value={form.contactPreferredTime}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="مثال: من 4 مساءً إلى 9 مساءً"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                سيتم مشاركة بيانات التواصل مع الوكلاء المعتمدين فقط بعد الموافقة على الإعلان، ولن يتم عرضها للعامة.
              </p>
            </section>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-slate-100">
              <div className="text-sm text-slate-500">
                بإرسالك للبيانات فإنك تقر بصحة المعلومات وتفوض منصة عقاراتي بالتواصل معك لمتابعة النشر والتسويق.
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "جاري إرسال الإعلان..." : "إرسال الإعلان للمراجعة"}
              </button>
            </div>
          </form>
        </div>

        <footer className="mt-12 text-center text-sm text-slate-500">
          إجمالي الملفات المرفوعة: {totalMediaCount} عنصر.
        </footer>
      </div>
    </div>
  );
}
