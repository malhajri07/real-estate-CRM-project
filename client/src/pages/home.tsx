import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Dashboard from "@/pages/dashboard";

export default function Home() {
  const { user } = useAuth();
  const { t, dir } = useLanguage();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Show the dashboard as the home page for logged-in users
  return (
    <>
      <div className="absolute top-4 left-4 z-50">
        <Card className="min-w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <User size={16} />
                <span>{t('nav.welcome') || 'مرحباً'}, {user?.firstName || user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut size={16} />
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Dashboard />
    </>
  );
}