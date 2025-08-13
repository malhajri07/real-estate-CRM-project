import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Dashboard from "@/pages/dashboard";
import type { User as UserType } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  const typedUser = user as UserType | undefined;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Show the dashboard as the home page for logged-in users
  return (
    <div className="min-h-screen bg-background">
      {/* User info header - positioned at the top without overlap */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-foreground">
                {t('nav.welcome') || 'مرحباً'}, {typedUser?.firstName || typedUser?.email || 'مستخدم'}
              </div>
              <div className="text-sm text-muted-foreground">
                نظام إدارة العقارات
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="rounded-xl apple-transition"
            data-testid="button-logout"
          >
            <LogOut size={16} className="ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
      
      {/* Dashboard content */}
      <Dashboard />
    </div>
  );
}