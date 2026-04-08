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
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export default function KYCSubmitted() {
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  const handleBackToLanding = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans text-foreground overflow-x-hidden">
      
      <PublicHeader />

      <main className="pt-20 pb-12 px-4 flex items-center justify-center min-h-[80vh]">

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl"
        >
          <div className="rounded-xl border bg-card p-6 md:p-8 text-center shadow-sm relative overflow-hidden">
            

            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary shadow-lg shadow-primary/20"
              >
                <Clock className="h-10 w-10" />
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                طلب الحساب المؤسسي <span className="text-primary">قيد المراجعة</span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
                شكراً لإرسال بيانات شركتكم. بدأ فريقنا الآن بمراجعة الطلب وسنتواصل معكم فور اكتمال الخطوات المطلوبة لضمان جودة الخدمة.
              </p>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
                  <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/10" />
                    مراحل التحقق
                  </h3>
                  <ul className="space-y-4 text-sm text-primary/70 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">1</div>
                      <span>مراجعة أولية لبيانات السجل التجاري ومسؤول الاتصال خلال 48 ساعة عمل.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">2</div>
                      <span>قد نتواصل لطلب مستندات إضافية أو توضيحات حول نشاط الشركة.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">3</div>
                      <span>تفعيل لوحة التحكم المؤسسية وإرسال بيانات الدخول.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex-1 rounded-2xl border border-border bg-card/50 p-6 hover:border-primary/20 transition-colors">
                    <div className="mb-2 flex items-center gap-3 text-primary">
                      <Mail className="h-5 w-5" />
                      <span className="font-bold">للاستفسارات العاجلة</span>
                    </div>
                    <p className="text-muted-foreground text-sm">info@aqaraty.sa</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-card/50 p-6 hover:border-primary/20 transition-colors">
                    <div className="mb-2 flex items-center gap-3 text-primary">
                      <Phone className="h-5 w-5" />
                      <span className="font-bold">الدعم المباشر</span>
                    </div>
                    <p className="text-muted-foreground text-sm" dir="ltr">+966 50 123 4567</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button
                  className="rounded-xl h-12 px-8 bg-primary/10 hover:bg-primary/10 text-white shadow-lg shadow-primary/20 w-full sm:w-auto"
                  onClick={() => setLocation('/rbac-login')}
                >
                  الذهاب لصفحة الدخول
                  <ArrowRight className={cn("me-2", "h-4 w-4 rotate-180")} />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-8 border-border hover:bg-muted/30 hover:text-primary hover:border-primary/20 w-full sm:w-auto"
                  onClick={handleBackToLanding}
                >
                  <Home className={cn("me-2", "h-4 w-4")} />
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
