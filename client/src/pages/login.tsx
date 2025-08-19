import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userLevel: number;
  companyName: string;
  tenantId: string;
}

const TEST_USERS: User[] = [
  {
    id: "admin-1",
    email: "admin@aqaraty.com",
    firstName: "مدير",
    lastName: "المنصة",
    userLevel: 1,
    companyName: "منصة عقاراتي",
    tenantId: "admin-1"
  },
  {
    id: "owner-1", 
    email: "ahmed@company1.com",
    firstName: "أحمد",
    lastName: "الأحمد",
    userLevel: 2,
    companyName: "شركة الأحمد العقارية",
    tenantId: "owner-1"
  },
  {
    id: "owner-2",
    email: "fatima@company2.com", 
    firstName: "فاطمة",
    lastName: "السالم",
    userLevel: 2,
    companyName: "مؤسسة السالم للعقارات",
    tenantId: "owner-2"
  },
  {
    id: "sub-1",
    email: "mohammed@company1.com",
    firstName: "محمد", 
    lastName: "الأحمد",
    userLevel: 3,
    companyName: "شركة الأحمد العقارية",
    tenantId: "owner-1"
  },
  {
    id: "sub-2",
    email: "khalid@company2.com",
    firstName: "خالد",
    lastName: "السالم", 
    userLevel: 3,
    companyName: "مؤسسة السالم للعقارات",
    tenantId: "owner-2"
  }
];

const getUserLevelLabel = (level: number) => {
  switch (level) {
    case 1: return "مدير المنصة";
    case 2: return "مالك الحساب";
    case 3: return "حساب فرعي";
    default: return "مستخدم";
  }
};

export default function Login() {
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!selectedUser) {
      setError("يرجى اختيار المستخدم");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const user = TEST_USERS.find(u => u.id === selectedUser);
      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      // Store user data in localStorage for demo authentication
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("authToken", `demo-token-${user.id}`);
      localStorage.setItem("userLevel", user.userLevel.toString());
      localStorage.setItem("tenantId", user.tenantId);

      // Wait a moment then navigate to dashboard
      setTimeout(() => {
        setLocation("/");
        // Also trigger a custom event to refresh auth state immediately
        window.dispatchEvent(new Event('storage'));
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            منصة عقاراتي
          </CardTitle>
          <p className="text-green-600">اختر المستخدم لتسجيل الدخول</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="user-select">المستخدم</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger data-testid="user-select">
                <SelectValue placeholder="اختر المستخدم..." />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {TEST_USERS.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col text-right">
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getUserLevelLabel(user.userLevel)} - {user.companyName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="p-4 bg-green-50 rounded-lg border">
              <h4 className="font-medium text-green-800 mb-2">تفاصيل المستخدم:</h4>
              {(() => {
                const user = TEST_USERS.find(u => u.id === selectedUser);
                return user ? (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">الاسم:</span> {user.firstName} {user.lastName}</p>
                    <p><span className="font-medium">البريد الإلكتروني:</span> {user.email}</p>
                    <p><span className="font-medium">المستوى:</span> {getUserLevelLabel(user.userLevel)}</p>
                    <p><span className="font-medium">الشركة:</span> {user.companyName}</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <Button 
            onClick={handleLogin}
            disabled={!selectedUser || isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
            data-testid="login-button"
          >
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">مستويات الوصول:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>مدير المنصة</span>
                <span className="text-xs bg-purple-100 px-2 py-1 rounded">رؤية شاملة</span>
              </div>
              <div className="flex items-center justify-between">
                <span>مالك الحساب</span>
                <span className="text-xs bg-blue-100 px-2 py-1 rounded">إدارة الشركة</span>
              </div>
              <div className="flex items-center justify-between">
                <span>حساب فرعي</span>
                <span className="text-xs bg-green-100 px-2 py-1 rounded">وصول محدود</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}