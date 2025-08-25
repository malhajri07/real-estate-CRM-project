import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Lock, User } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple validation against hardcoded credentials
    if (username === "Admin1" && password === "123456") {
      toast({
        title: "نجح تسجيل الدخول",
        description: "مرحباً بك في نظام إدارة العقارات",
      });
      onLogin();
      // Redirect to dashboard after successful login
      setLocation("/");
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="شعار عقاراتي" 
              className="w-40 h-40 object-contain"
              style={{ 
                filter: 'drop-shadow(0 0 0 transparent)',
                background: 'transparent'
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            منصة عقاراتي
          </CardTitle>
          <p className="text-slate-600 mt-2">
            الرجاء تسجيل الدخول للوصول إلى لوحة التحكم
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center">
                <User size={16} className="ml-2" />
                اسم المستخدم
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                required
                data-testid="input-username"
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center">
                <Lock size={16} className="ml-2" />
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                required
                data-testid="input-password"
                className="text-right"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "جار تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>للاختبار: المستخدم: Admin1 | كلمة المرور: 123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}