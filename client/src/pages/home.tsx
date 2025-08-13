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
      <div className="absolute top-6 left-6 z-50">
        <Card className="min-w-72 bg-card/95 backdrop-blur-sm border border-border/50 rounded-2xl apple-shadow-large">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="font-medium tracking-tight">{t('nav.welcome') || 'مرحباً'}, {user?.firstName || user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 w-8 p-0 rounded-xl hover:bg-destructive/10 apple-transition"
                data-testid="button-logout"
              >
                <LogOut size={16} className="text-muted-foreground hover:text-destructive" />
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Dashboard />
    </>
  );
}