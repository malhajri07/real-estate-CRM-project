/**
 * signup-success.tsx - Signup Success Page
 * 
 * Location: apps/web/src/ → Pages/ → Public Pages → signup-success.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Signup success confirmation page. Displays:
 * - Success message
 * - Next steps information
 * 
 * Route: /signup/success
 * 
 * Related Files:
 * - apps/web/src/pages/signup-individual.tsx - Individual signup
 * - apps/web/src/pages/signup-corporate.tsx - Corporate signup
 */

import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function SignupSuccess() {
  const [, setLocation] = useLocation();

  const handleBackToLanding = () => {
    setLocation("/");
  };

  const handleGoToLogin = () => {
    setLocation("/rbac-login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-16" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="space-y-6 rounded-[32px] border border-white/80 bg-white/90 p-10 text-right shadow-[0_35px_120px_rgba(16,185,129,0.18)] backdrop-blur-xl" dir="rtl">
          <div className="flex items-center justify-end gap-4">
            <div className="rounded-3xl bg-emerald-100 p-4 text-emerald-600">
              {/* Success icon mirrors the real-estate request confirmation layout for a unified brand feel. */}
              <CheckCircle className="h-10 w-10" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-slate-900">تم إرسال طلبك بنجاح!</h1>
              <p className="mt-2 text-slate-500 leading-7">
                شكراً لتسجيلك في منصة عقاراتي. سنراجع بياناتك ونتواصل معك قريباً لإكمال خطوات التفعيل.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-6" dir="rtl">
            <h2 className="mb-4 text-lg font-semibold text-emerald-800 text-right">الخطوات التالية</h2>
            <ul className="space-y-3 text-emerald-700 list-none pr-0" dir="rtl">
              <li className="flex flex-row-reverse items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span className="text-right">سيتم مراجعة طلبك خلال 24 ساعة عمل.</span>
              </li>
              <li className="flex flex-row-reverse items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span className="text-right">سنتواصل معك عبر البريد الإلكتروني أو الجوال لإبلاغك بالخطوات القادمة.</span>
              </li>
              <li className="flex flex-row-reverse items-start gap-3">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                <span className="text-right">ستصلك بيانات الدخول فور اعتماد حسابك.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-4 pt-4" dir="rtl">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-300 text-slate-600 hover:bg-slate-100"
              onClick={handleBackToLanding}
            >
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              العودة إلى الصفحة الرئيسية
            </Button>
            <Button
              className="rounded-2xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
              onClick={handleGoToLogin}
            >
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
