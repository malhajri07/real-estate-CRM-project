import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Mail, Phone, MapPin, Globe, Save, Upload, Shield, Bell, CreditCard } from "lucide-react";

interface AccountDetails {
  companyName: string;
  businessType: string;
  taxId: string;
  website: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  contactPerson: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  avatar: string;
}

export default function Settings() {
  const { toast } = useToast();
  
  const [accountDetails, setAccountDetails] = useState<AccountDetails>({
    companyName: "شركة عقاراتي للتطوير العقاري",
    businessType: "تطوير عقاري",
    taxId: "1234567890",
    website: "https://aqaraty.com",
    description: "شركة رائدة في مجال التطوير العقاري في المملكة العربية السعودية",
    address: "طريق الملك فهد، حي العليا",
    city: "الرياض",
    country: "المملكة العربية السعودية",
    postalCode: "11564",
    phone: "+966112345678",
    email: "info@aqaraty.com",
    contactPerson: "أحمد محمد العلي",
    contactTitle: "مدير التطوير",
    contactPhone: "+966501234567",
    contactEmail: "ahmed.ali@aqaraty.com"
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "محمد",
    lastName: "الأحمد",
    email: "mohammad.ahmad@aqaraty.com",
    phone: "+966501234567",
    title: "مدير المبيعات",
    department: "المبيعات",
    avatar: ""
  });

  const handleAccountSave = () => {
    // Here you would typically save to the backend
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم تحديث تفاصيل الحساب بنجاح",
      variant: "default",
    });
  };

  const handleProfileSave = () => {
    // Here you would typically save to the backend
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم تحديث الملف الشخصي بنجاح",
      variant: "default",
    });
  };

  return (
    <main className="container mx-auto py-8 px-6 max-w-6xl" dir="rtl">
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-2">إدارة إعدادات الحساب والملف الشخصي</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center gap-2 flex-row-reverse">
            <Building2 size={16} />
            تفاصيل الحساب
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2 flex-row-reverse">
            <User size={16} />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 flex-row-reverse">
            <Shield size={16} />
            الأمان
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 flex-row-reverse">
            <Bell size={16} />
            الإشعارات
          </TabsTrigger>
        </TabsList>

        {/* Account Details Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
                  <Building2 size={20} className="text-primary" />
                  معلومات الشركة
                </CardTitle>
                <CardDescription className="text-right">
                  تفاصيل الشركة الأساسية وبيانات التواصل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-right">اسم الشركة</Label>
                  <Input
                    id="companyName"
                    dir="rtl"
                    value={accountDetails.companyName}
                    onChange={(e) => setAccountDetails({...accountDetails, companyName: e.target.value})}
                    data-testid="input-company-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType" className="text-right">نوع النشاط</Label>
                  <Select value={accountDetails.businessType} onValueChange={(value) => setAccountDetails({...accountDetails, businessType: value})}>
                    <SelectTrigger data-testid="select-business-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="تطوير عقاري">تطوير عقاري</SelectItem>
                      <SelectItem value="وساطة عقارية">وساطة عقارية</SelectItem>
                      <SelectItem value="إدارة عقارات">إدارة عقارات</SelectItem>
                      <SelectItem value="استثمار عقاري">استثمار عقاري</SelectItem>
                      <SelectItem value="تقييم عقاري">تقييم عقاري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId" className="text-right">الرقم الضريبي</Label>
                  <Input
                    id="taxId"
                    dir="rtl"
                    value={accountDetails.taxId}
                    onChange={(e) => setAccountDetails({...accountDetails, taxId: e.target.value})}
                    data-testid="input-tax-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-right">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    type="url"
                    dir="rtl"
                    value={accountDetails.website}
                    onChange={(e) => setAccountDetails({...accountDetails, website: e.target.value})}
                    data-testid="input-website"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-right">وصف الشركة</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    dir="rtl"
                    value={accountDetails.description}
                    onChange={(e) => setAccountDetails({...accountDetails, description: e.target.value})}
                    data-testid="textarea-description"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
                  <MapPin size={20} className="text-primary" />
                  معلومات التواصل والعنوان
                </CardTitle>
                <CardDescription className="text-right">
                  عنوان الشركة وبيانات التواصل الرسمية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-right">العنوان</Label>
                  <Input
                    id="address"
                    dir="rtl"
                    value={accountDetails.address}
                    onChange={(e) => setAccountDetails({...accountDetails, address: e.target.value})}
                    data-testid="input-address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-right">المدينة</Label>
                    <Input
                      id="city"
                      dir="rtl"
                      value={accountDetails.city}
                      onChange={(e) => setAccountDetails({...accountDetails, city: e.target.value})}
                      data-testid="input-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-right">الرمز البريدي</Label>
                    <Input
                      id="postalCode"
                      dir="rtl"
                      value={accountDetails.postalCode}
                      onChange={(e) => setAccountDetails({...accountDetails, postalCode: e.target.value})}
                      data-testid="input-postal-code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-right">البلد</Label>
                  <Select value={accountDetails.country} onValueChange={(value) => setAccountDetails({...accountDetails, country: value})}>
                    <SelectTrigger data-testid="select-country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="المملكة العربية السعودية">المملكة العربية السعودية</SelectItem>
                      <SelectItem value="الإمارات العربية المتحدة">الإمارات العربية المتحدة</SelectItem>
                      <SelectItem value="الكويت">الكويت</SelectItem>
                      <SelectItem value="قطر">قطر</SelectItem>
                      <SelectItem value="البحرين">البحرين</SelectItem>
                      <SelectItem value="عمان">عمان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-right">هاتف الشركة</Label>
                  <Input
                    id="phone"
                    type="tel"
                    dir="rtl"
                    value={accountDetails.phone}
                    onChange={(e) => setAccountDetails({...accountDetails, phone: e.target.value})}
                    data-testid="input-company-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-right">البريد الإلكتروني للشركة</Label>
                  <Input
                    id="email"
                    type="email"
                    dir="rtl"
                    value={accountDetails.email}
                    onChange={(e) => setAccountDetails({...accountDetails, email: e.target.value})}
                    data-testid="input-company-email"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Primary Contact */}
            <Card className="apple-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
                  <User size={20} className="text-primary" />
                  جهة الاتصال الرئيسية
                </CardTitle>
                <CardDescription className="text-right">
                  بيانات الشخص المسؤول عن الحساب
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson" className="text-right">الاسم الكامل</Label>
                    <Input
                      id="contactPerson"
                      dir="rtl"
                      value={accountDetails.contactPerson}
                      onChange={(e) => setAccountDetails({...accountDetails, contactPerson: e.target.value})}
                      data-testid="input-contact-person"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactTitle" className="text-right">المسمى الوظيفي</Label>
                    <Input
                      id="contactTitle"
                      dir="rtl"
                      value={accountDetails.contactTitle}
                      onChange={(e) => setAccountDetails({...accountDetails, contactTitle: e.target.value})}
                      data-testid="input-contact-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="text-right">رقم الهاتف</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      dir="rtl"
                      value={accountDetails.contactPhone}
                      onChange={(e) => setAccountDetails({...accountDetails, contactPhone: e.target.value})}
                      data-testid="input-contact-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-right">البريد الإلكتروني</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      dir="rtl"
                      value={accountDetails.contactEmail}
                      onChange={(e) => setAccountDetails({...accountDetails, contactEmail: e.target.value})}
                      data-testid="input-contact-email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-start">
            <Button onClick={handleAccountSave} className="flex items-center gap-2 flex-row-reverse" data-testid="button-save-account">
              <Save size={16} />
              حفظ تفاصيل الحساب
            </Button>
          </div>
        </TabsContent>

        {/* User Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="text-right">الملف الشخصي</CardTitle>
              <CardDescription className="text-right">
                إدارة بياناتك الشخصية وصورتك الشخصية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 flex-row-reverse">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={userProfile.avatar} />
                  <AvatarFallback className="text-lg">
                    {userProfile.firstName[0]}{userProfile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-right">
                  <Button variant="outline" className="flex items-center gap-2 flex-row-reverse" data-testid="button-upload-avatar">
                    <Upload size={16} />
                    تغيير الصورة الشخصية
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    يفضل استخدام صور بحجم 400x400 بكسل أو أكبر
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-right">الاسم الأول</Label>
                  <Input
                    id="firstName"
                    dir="rtl"
                    value={userProfile.firstName}
                    onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-right">اسم العائلة</Label>
                  <Input
                    id="lastName"
                    dir="rtl"
                    value={userProfile.lastName}
                    onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                    data-testid="input-last-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail" className="text-right">البريد الإلكتروني</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    dir="rtl"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    data-testid="input-user-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPhone" className="text-right">رقم الهاتف</Label>
                  <Input
                    id="userPhone"
                    type="tel"
                    dir="rtl"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                    data-testid="input-user-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-right">المسمى الوظيفي</Label>
                  <Input
                    id="title"
                    dir="rtl"
                    value={userProfile.title}
                    onChange={(e) => setUserProfile({...userProfile, title: e.target.value})}
                    data-testid="input-user-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-right">القسم</Label>
                  <Select value={userProfile.department} onValueChange={(value) => setUserProfile({...userProfile, department: value})}>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="المبيعات">المبيعات</SelectItem>
                      <SelectItem value="التسويق">التسويق</SelectItem>
                      <SelectItem value="خدمة العملاء">خدمة العملاء</SelectItem>
                      <SelectItem value="التطوير">التطوير</SelectItem>
                      <SelectItem value="الإدارة">الإدارة</SelectItem>
                      <SelectItem value="المالية">المالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-start">
                <Button onClick={handleProfileSave} className="flex items-center gap-2 flex-row-reverse" data-testid="button-save-profile">
                  <Save size={16} />
                  حفظ الملف الشخصي
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
                <Shield size={20} className="text-primary" />
                الأمان وكلمة المرور
              </CardTitle>
              <CardDescription className="text-right">
                إعدادات الأمان وإدارة كلمة المرور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-right">كلمة المرور الحالية</Label>
                <Input id="currentPassword" type="password" dir="rtl" data-testid="input-current-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-right">كلمة المرور الجديدة</Label>
                <Input id="newPassword" type="password" dir="rtl" data-testid="input-new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-right">تأكيد كلمة المرور الجديدة</Label>
                <Input id="confirmPassword" type="password" dir="rtl" data-testid="input-confirm-password" />
              </div>
              <Button className="flex items-center gap-2 flex-row-reverse" data-testid="button-change-password">
                <Shield size={16} />
                تغيير كلمة المرور
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="apple-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
                <Bell size={20} className="text-primary" />
                إعدادات الإشعارات
              </CardTitle>
              <CardDescription className="text-right">
                اختر أنواع الإشعارات التي تريد استلامها
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <input type="checkbox" defaultChecked className="toggle" data-testid="toggle-new-leads" />
                <div className="text-right">
                  <p className="font-medium">عملاء محتملين جدد</p>
                  <p className="text-sm text-muted-foreground">إشعار عند إضافة عملاء محتملين جدد</p>
                </div>
              </div>
              <div className="flex items-center justify-between flex-row-reverse">
                <input type="checkbox" defaultChecked className="toggle" data-testid="toggle-task-updates" />
                <div className="text-right">
                  <p className="font-medium">تحديثات المهام</p>
                  <p className="text-sm text-muted-foreground">إشعار عند اكتمال أو تحديث المهام</p>
                </div>
              </div>
              <div className="flex items-center justify-between flex-row-reverse">
                <input type="checkbox" defaultChecked className="toggle" data-testid="toggle-new-deals" />
                <div className="text-right">
                  <p className="font-medium">صفقات جديدة</p>
                  <p className="text-sm text-muted-foreground">إشعار عند إنشاء صفقات جديدة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}