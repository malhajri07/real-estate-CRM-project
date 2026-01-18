/**
 * kyc-submitted.tsx - KYC Submission Confirmation Page
 * 
 * Location: apps/web/src/ → Pages/ → Public Pages → kyc-submitted.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * KYC submission confirmation page. Displays:
 * - KYC submission confirmation
 * - Review status information
 * 
 * Route: /signup/kyc-submitted
 * 
 * Related Files:
 * - apps/web/src/pages/signup-individual.tsx - Individual signup with KYC
 */

import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Mail, Phone } from "lucide-react";
import { useLocation } from "wouter";

export default function KYCSubmitted() {
  const [, setLocation] = useLocation();

  const handleBackToLanding = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="space-y-6 rounded-[32px] border border-white/80 bg-white/90 p-10 text-right shadow-[0_35px_120px_rgba(16,185,129,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-end gap-4">
            <div className="rounded-3xl bg-emerald-100 p-4 text-emerald-600">
              <Clock className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">طلب الحساب المؤسسي قيد المراجعة</h1>
              <p className="mt-2 leading-7 text-slate-500">
                شكراً لإرسال بيانات شركتكم. بدأ فريقنا الآن بمراجعة الطلب وسنتواصل معكم فور اكتمال الخطوات المطلوبة.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6">
            <h2 className="mb-4 text-lg font-semibold text-emerald-800">مراحل التحقق</h2>
            <ul className="space-y-3 text-emerald-700">
              <li className="flex flex-row-reverse items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span>مراجعة أولية لبيانات السجل التجاري ومسؤول الاتصال خلال 48 ساعة عمل.</span>
              </li>
              <li className="flex flex-row-reverse items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span>قد نتواصل لطلب مستندات إضافية أو توضيحات حول نشاط الشركة.</span>
              </li>
              <li className="flex flex-row-reverse items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span>ترتيب مكالمة تعريفية لشرح احتياجاتكم وخطط التفعيل.</span>
              </li>
              <li className="flex flex-row-reverse items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span>إرسال بيانات الدخول وتفعيل لوحة التحكم المؤسسية عند إتمام التحقق.</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3 text-emerald-600">
                <Mail className="h-5 w-5" />
                <span className="font-semibold">البريد الإلكتروني</span>
              </div>
              <p className="text-slate-700">info@aqaraty.sa</p>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white/80 p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3 text-emerald-600">
                <Phone className="h-5 w-5" />
                <span className="font-semibold">الهاتف</span>
              </div>
              <p className="text-slate-700">+966 50 123 4567</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-4 pt-4">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-300 text-slate-600 hover:bg-slate-100"
              onClick={handleBackToLanding}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة إلى الصفحة الرئيسية
            </Button>
            <Button
              className="rounded-2xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
              onClick={() => setLocation('/login')}
            >
              متابعة تسجيل الدخول لاحقاً
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
