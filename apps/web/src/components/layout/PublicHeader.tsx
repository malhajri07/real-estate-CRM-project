import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserRole } from "@shared/rbac";

export default function PublicHeader() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAuth = !!user;
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  
  // Determine dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user?.roles) return "/home/platform";
    
    if (user.roles.includes(UserRole.WEBSITE_ADMIN)) {
      return "/admin/overview/main-dashboard";
    } else if (user.roles.some(role => 
      [UserRole.CORP_OWNER, UserRole.CORP_AGENT, UserRole.INDIV_AGENT, UserRole.SELLER, UserRole.BUYER].includes(role)
    )) {
      return "/home/platform";
    }
    
    return "/home/platform";
  };

  const navLinks = useMemo(
    () => [
      { href: "/search-properties", label: t("nav.search") },
            { href: "/home/platform/saved-searches", label: "عمليات البحث" },
      { href: "/contact", label: "اتصل بنا" }
    ],
    [t]
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        isScrolled
          ? "bg-white/85 backdrop-blur-2xl border-b border-white/60 shadow-soft"
          : "bg-white/60 backdrop-blur-xl border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex h-[64px] items-center justify-between px-4 sm:px-6 xl:px-8">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-3 rounded-full bg-white/80 px-3 py-1.5 shadow-sm ring-1 ring-white/60 transition hover:shadow hover:ring-white"
          >
            <img
              src={agarkomLogo}
              alt="عقاركم"
              width={72}
              height={40}
              loading="eager"
              decoding="async"
              className="h-8 w-auto"
            />
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          {navLinks.map((link) => {
            const isActive = currentPath.startsWith(link.href);
            return (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-full transition-colors duration-200",
                  isActive
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                )}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full border border-slate-200 text-slate-600"
            onClick={() => (window.location.href = isAuth ? getDashboardUrl() : "/login")}
            aria-label="فتح القائمة أو تسجيل الدخول"
          >
            <Menu className="h-4 w-4" />
          </Button>
          {isAuth ? (
            <Button
              variant="secondary"
              className="hidden md:inline-flex rounded-2xl bg-emerald-600 text-white shadow-soft hover:bg-emerald-700"
              onClick={() => (window.location.href = getDashboardUrl())}
            >
              {t("nav.dashboard")}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden md:inline-flex rounded-2xl text-emerald-600 hover:bg-emerald-50"
                onClick={() => (window.location.href = "/login")}
              >
                {t("nav.login")}
              </Button>
              <Button
                className="hidden md:inline-flex rounded-2xl bg-emerald-600 text-white shadow-soft hover:bg-emerald-700"
                onClick={() => (window.location.href = "/signup")}
              >
                {t("nav.signup")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
