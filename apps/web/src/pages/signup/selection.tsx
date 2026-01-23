/**
 * signup-selection.tsx - Signup Type Selection Page
 * 
 * Location: apps/web/src/ → Pages/ → Public Pages → signup-selection.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Signup type selection page. Allows users to choose between:
 * - Individual agent signup
 * - Corporate signup
 * 
 * Route: /signup
 * 
 * Related Files:
 * - apps/web/src/pages/signup-individual.tsx - Individual signup page
 * - apps/web/src/pages/signup-corporate.tsx - Corporate signup page
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { UserRound, Check, Home } from "lucide-react";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

export default function SignupSelection() {
  const [, setLocation] = useLocation();

  const goHome = () => setLocation("/");
  const handleIndividualSignup = () => setLocation("/signup/individual");
  const handleCorporateSignup = () => setLocation("/signup/corporate");
  const handleBuyerPool = () => setLocation("/real-estate-requests");
  const handleSellerListing = () => setLocation("/home/platform/post-listing");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <header className="bg-white/90 backdrop-blur-xl border-b border-white/60 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[82px]">
            <Button
              onClick={goHome}
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              العودة للرئيسية
            </Button>
            <button
              onClick={goHome}
              className="flex flex-row-reverse items-center"
            >
              <span className="sr-only">الانتقال إلى الصفحة الرئيسية</span>
              <img
                src={agarkomLogo}
                alt="شعار منصة عقاراتي"
                width={114}
                height={64}
                loading="eager"
                decoding="async"
                className="h-16 w-auto object-contain"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-16">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="space-y-4 text-right">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              اختر الطريقة الأنسب للانضمام إلى المنصة
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed">
              لست بحاجة إلى إعدادات معقدة. اختر المسار الذي يعكس دورك وستحصل على تجربة مصممة بعناية لإدارة العقارات والعملاء بكل سلاسة.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[32px] border border-white/80 bg-white/80 backdrop-blur-xl shadow-[0_40px_120px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_50px_140px_rgba(15,23,42,0.12)]">
              <CardHeader className="space-y-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <div className="space-y-2 text-right">
                    <CardTitle className="text-2xl font-semibold text-slate-900">
                      وسيط عقاري معتمد
                    </CardTitle>
                    <p className="text-sm text-slate-500 leading-7">
                      لوحة تحكم تعكس المعايير الاحترافية للوسطاء والشركات مع أدوات دقيقة لتنظيم الصفقات والفرق.
                    </p>
                  </div>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700">
                    <UserRound className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleIndividualSignup}
                    className="h-12 rounded-2xl bg-emerald-600 text-white text-base font-semibold shadow-[0_20px_45px_rgba(16,185,129,0.25)] hover:bg-emerald-700"
                  >
                    وسيط مستقل
                  </Button>
                  <Button
                    onClick={handleCorporateSignup}
                    variant="outline"
                    className="h-12 rounded-2xl border-emerald-200 text-emerald-700 text-base font-semibold hover:border-emerald-300"
                  >
                    منشأة عقارية
                  </Button>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center justify-end gap-3">
                    <span>إدارة متقدمة للمحفظة والصفقات ومتابعة الأداء اليومي للفريق.</span>
                    <span className="rounded-xl border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-600">
                      <Check className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </li>
                  <li className="flex items-center justify-end gap-3">
                    <span>مركز موحد لمتابعة العملاء المحتملين والتواصل معهم باحترافية.</span>
                    <span className="rounded-xl border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-600">
                      <Check className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </li>
                  <li className="flex items-center justify-end gap-3">
                    <span>تقارير فورية تساعدك على اتخاذ قرارات دقيقة دون عناء.</span>
                    <span className="rounded-xl border border-emerald-100 bg-emerald-50 p-1.5 text-emerald-600">
                      <Check className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border border-white/80 bg-white/80 backdrop-blur-xl shadow-[0_40px_120px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_50px_140px_rgba(15,23,42,0.12)]">
              <CardHeader className="space-y-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <div className="space-y-2 text-right">
                    <CardTitle className="text-2xl font-semibold text-slate-900">
                      باحث عن عقار أو مالك عقار
                    </CardTitle>
                    <p className="text-sm text-slate-500 leading-7">
                      شاركنا تفضيلاتك أو تفاصيل عقارك لتحصل على دعم نخبة الوسطاء المعتمدين بسرعة واحترافية.
                    </p>
                  </div>
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 text-blue-700">
                    <Home className="h-7 w-7" strokeWidth={1.6} />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={handleBuyerPool}
                    className="h-12 rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-[0_20px_45px_rgba(37,99,235,0.22)] hover:bg-blue-700"
                  >
                    انضم كمشتري
                  </Button>
                  <Button
                    onClick={handleSellerListing}
                    variant="outline"
                    className="h-12 rounded-2xl border-blue-200 text-blue-700 text-base font-semibold hover:border-blue-300"
                  >
                    أدرج عقارك للبيع
                  </Button>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center justify-end gap-3">
                    <span>مواءمة فورية بين احتياجاتك وقاعدة بيانات العقارات الموثوقة.</span>
                    <span className="rounded-xl border border-blue-100 bg-blue-50 p-1.5 text-blue-600">
                      <Check className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </li>
                  <li className="flex items-center justify-end gap-3">
                    <span>تواصل مباشر مع وسطاء مختارين بعناية لضمان أعلى جودة للخدمة.</span>
                    <span className="rounded-xl border border-blue-100 bg-blue-50 p-1.5 text-blue-600">
                      <Check className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </li>
                  <li className="flex items-center justify-end gap-3">
                    <span>تجربة مبسطة لإدراج عقارك مع دعم فني في كل خطوة.</span>
                    <span className="rounded-xl border border-blue-100 bg-blue-50 p-1.5 text-blue-600">
                      <Check className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-3 text-right">
            <p className="text-sm text-slate-500">
              لديك حساب بالفعل؟
              <a href="/rbac-login" className="mr-2 font-semibold text-emerald-600 hover:text-emerald-700">
                تسجيل الدخول
              </a>
            </p>
            <Button
              variant="ghost"
              onClick={goHome}
              className="text-slate-500 hover:text-slate-700"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </main>

      <footer className="px-4 pb-10">
        <div className="max-w-5xl mx-auto text-center text-xs text-slate-400">
          جميع الحقوق محفوظة © {new Date().getFullYear()} منصة عقاراتي
        </div>
      </footer>
    </div>
  );
}
