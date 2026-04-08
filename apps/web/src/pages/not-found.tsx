import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight, Search, LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative">
          <p className="text-[120px] font-black text-primary/10 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-16 w-16 text-primary/40" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            "الصفحة غير موجودة"
          </h1>
          <p className="text-muted-foreground">
            الصفحة التي تبحث عنها غير موجودة أو تم نقلها
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {isLoggedIn ? (
            <Button onClick={() => setLocation("/home/platform")} className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              "لوحة التحكم"
            </Button>
          ) : (
            <>
              <Button onClick={() => setLocation("/")} className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                "الصفحة الرئيسية"
              </Button>
              <Button variant="outline" onClick={() => setLocation("/login")} className="gap-2 w-full sm:w-auto">
                <LogIn className="h-4 w-4" />
                "تسجيل الدخول"
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => window.history.back()} className="gap-2 w-full sm:w-auto">
            <ArrowRight className="h-4 w-4" />
            "العودة"
          </Button>
        </div>
      </div>
    </div>
  );
}
