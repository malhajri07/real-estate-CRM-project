import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building, Building2, Lock, User, Phone, Mail, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import agarkomLogo from "@assets/Aqarkom (3)_1756501849666.png";

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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setLocation("/")}>
              <img src={agarkomLogo} alt="عقارکم" className="h-36" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-primary to-primary/90 px-8 py-12 text-center">
            <div className="flex justify-center mb-6">
              <img 
                src={agarkomLogo} 
                alt="عقارکم" 
                className="h-60 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Droid Arabic Kufi, Janat Bold, Noto Sans Arabic' }}>
              تسجيل الدخول
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              مرحباً بك في عقارکم
            </p>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-right font-medium text-gray-700">اسم المستخدم</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="أدخل اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pr-12 h-12 border-gray-200 bg-white/70 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-right font-medium text-gray-700">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-12 h-12 border-gray-200 bg-white/70 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                disabled={isLoading}
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                ليس لديك حساب؟ 
                <a href="/signup" className="text-green-600 hover:text-green-700 font-semibold mr-2 transition-colors">
                  إنشاء حساب جديد
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Building className="h-8 w-8 text-green-400 ml-3" />
                <span className="text-xl font-bold">منصة عقاراتي</span>
              </div>
              <p className="text-gray-400 mb-4">
                نظام شامل لإدارة العقارات والعملاء والصفقات مع واجهة حديثة وسهلة الاستخدام
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-green-400">الرئيسية</a></li>
                <li><a href="#features" className="hover:text-green-400">المميزات</a></li>
                <li><a href="#solutions" className="hover:text-green-400">الحلول</a></li>
                <li><a href="#pricing" className="hover:text-green-400">الأسعار</a></li>
                <li><a href="#contact" className="hover:text-green-400">اتصل بنا</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">الدعم</h3>
              <ul className="space-y-2 text-gray-400">
                <li>الهاتف: +966 50 123 4567</li>
                <li>البريد: info@aqaraty.sa</li>
                <li>الدعم الفني متاح 24/7</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>جميع الحقوق محفوظة © 2025 منصة عقاراتي لإدارة العقارات</p>
          </div>
        </div>
      </footer>
    </div>
  );
}