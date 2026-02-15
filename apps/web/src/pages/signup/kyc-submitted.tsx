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
 */

import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Mail, Phone, Home } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import PublicHeader from "@/components/layout/PublicHeader";

export default function KYCSubmitted() {
  const [, setLocation] = useLocation();

  const handleBackToLanding = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden" dir="rtl">
      <div className="fixed inset-0 aurora-bg opacity-30 pointer-events-none" />
      <PublicHeader />

      <main className="relative pt-32 pb-20 px-4 flex items-center justify-center min-h-[80vh]">
        {/* Background Blobs */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl"
        >
          <div className="glass rounded-[32px] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />

            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600 shadow-lg shadow-emerald-500/20"
              >
                <Clock className="h-10 w-10" />
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                طلب الحساب المؤسسي <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-teal-600">قيد المراجعة</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10">
                شكراً لإرسال بيانات شركتكم. بدأ فريقنا الآن بمراجعة الطلب وسنتواصل معكم فور اكتمال الخطوات المطلوبة لضمان جودة الخدمة.
              </p>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-start">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
                  <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    مراحل التحقق
                  </h3>
                  <ul className="space-y-4 text-sm text-emerald-900/80 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">1</div>
                      <span>مراجعة أولية لبيانات السجل التجاري ومسؤول الاتصال خلال 48 ساعة عمل.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">2</div>
                      <span>قد نتواصل لطلب مستندات إضافية أو توضيحات حول نشاط الشركة.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">3</div>
                      <span>تفعيل لوحة التحكم المؤسسية وإرسال بيانات الدخول.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white/50 p-6 hover:border-emerald-200 transition-colors">
                    <div className="mb-2 flex items-center gap-3 text-emerald-600">
                      <Mail className="h-5 w-5" />
                      <span className="font-semibold">للاستفسارات العاجلة</span>
                    </div>
                    <p className="text-slate-600 text-sm">info@aqaraty.sa</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-slate-200 bg-white/50 p-6 hover:border-emerald-200 transition-colors">
                    <div className="mb-2 flex items-center gap-3 text-emerald-600">
                      <Phone className="h-5 w-5" />
                      <span className="font-semibold">الدعم المباشر</span>
                    </div>
                    <p className="text-slate-600 text-sm text-start" dir="ltr">+966 50 123 4567</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  className="rounded-xl h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                  onClick={() => setLocation('/login')}
                >
                  الذهاب لصفحة الدخول
                  <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-8 border-slate-200 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-200 w-full sm:w-auto"
                  onClick={handleBackToLanding}
                >
                  <Home className="ml-2 h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
