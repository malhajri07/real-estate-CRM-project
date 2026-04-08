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
 */

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { UserRound, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import PublicHeader from "@/components/layout/PublicHeader";

export default function SignupSelection() {
  const [, setLocation] = useLocation();
  const { dir } = useLanguage();

  const handleIndividualSignup = () => setLocation("/signup/individual");
  const handleCorporateSignup = () => setLocation("/signup/corporate");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans text-foreground overflow-x-hidden">
      {/* Background Effects */}
            
      <PublicHeader />

      <main className="relative pt-32 pb-20 px-4 min-h-[85vh] flex flex-col items-center justify-center">
        {/* Background Blobs */}



        <div className="w-full max-w-5xl mx-auto relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="text-center space-y-6 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium">
                <UserRound className="w-4 h-4" />
                <span>حساب جديد</span>
              </span>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                اختر نوع الحساب للانضمام إلى <span className="text-primary">منصة عقاراتي</span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                سواء كنت وسيطاً مستقلاً أو تمثل منشأة عقارية، لدينا الأدوات المناسبة لمساعدتك في إدارة أعمالك وتنمية استثماراتك.
              </p>
            </motion.div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Individual Card */}
              <motion.div variants={itemVariants}>
                <div 
                  onClick={handleIndividualSignup}
                  className="rounded-xl border bg-card p-6 md:p-8 h-full cursor-pointer group hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-border"
                >
                  <div className="absolute top-0 start-0 w-1 h-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="flex flex-col h-full gap-6">
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-2xl icon-container group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                        <UserRound className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/70 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <ArrowRight className={cn("w-5 h-5", dir === 'rtl' ? "rotate-180" : "")} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">وسيط مستقل</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        مصمم للأفراد والوسطاء المستقلين. ابدأ رحلتك في السوق العقاري مع أدوات احترافية لإدارة عملائك وعروضك.
                      </p>
                    </div>

                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20">إدارة عملاء</span>
                      <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20">تسويق عقاري</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Corporate Card */}
              <motion.div variants={itemVariants}>
                <div 
                  onClick={handleCorporateSignup}
                  className="rounded-xl border bg-card p-6 md:p-8 h-full cursor-pointer group hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-border"
                >
                  <div className="absolute top-0 start-0 w-1 h-full bg-accent0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="flex flex-col h-full gap-6">
                    <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground group-hover:scale-110 group-hover:bg-accent transition-all duration-300">
                        <Building2 className="w-8 h-8" strokeWidth={1.5} />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground/70 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <ArrowRight className={cn("w-5 h-5", dir === 'rtl' ? "rotate-180" : "")} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">منشأة عقارية</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        حل متكامل للشركات والمكاتب العقارية. إدارة صلاحيات الفريق، متابعة الأداء، وتقارير تفصيلية متقدمة.
                      </p>
                    </div>

                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-medium border border-primary/15/50">إدارة فريق</span>
                      <span className="px-3 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-medium border border-primary/15/50">تقارير أداء</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Login Link */}
            <motion.div variants={itemVariants} className="text-center pt-8">
              <p className="text-muted-foreground text-sm">
                لديك حساب بالفعل؟{' '}
                <Button
                  variant="link"
                  onClick={() => setLocation('/rbac-login')}
                  className="font-bold text-primary hover:text-primary/80 hover:underline transition-colors p-0 h-auto"
                >
                  تسجيل الدخول
                </Button>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
