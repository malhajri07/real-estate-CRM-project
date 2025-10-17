import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Save, Upload, Shield, Bell, Users, CheckCircle, TrendingUp, ChevronDown } from "lucide-react";

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

  const [companyOpen, setCompanyOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(true);
  const [securityOpen, setSecurityOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(true);

  const handleAccountSave = () => {
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم تحديث تفاصيل الحساب بنجاح",
      variant: "default",
    });
  };

  const handleProfileSave = () => {
    toast({
      title: "تم الحفظ بنجاح",
      description: "تم تحديث الملف الشخصي بنجاح",
      variant: "default",
    });
  };

  return (
    <div className="space-y-8">
      <div className="apple-card px-6 py-5 flex flex-col gap-4">
        <div>
          <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-3 py-1 rounded-full text-xs">
            إعدادات المنصة والملف الشخصي
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">الإعدادات</h1>
          <p className="text-muted-foreground mt-2">إدارة بيانات الشركة، الملف الشخصي، والأمان والإشعارات من مكان واحد</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={handleAccountSave}>
            <Save size={16} className="ml-2" /> حفظ التغييرات
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="apple-card">
          <CardHeader className="border-b border-white/60 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Building2 size={18} /></span>
              <div className="text-right">
                <CardTitle className="text-xl font-semibold text-slate-900">معلومات الشركة</CardTitle>
                <CardDescription className="text-sm text-slate-500">تفاصيل النشاط التجاري وقنوات التواصل الرسمية</CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompanyOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
              aria-label="تبديل عرض معلومات الشركة"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${companyOpen ? "rotate-180" : ""}`} />
            </button>
          </CardHeader>
          <CardContent className={`space-y-6 pt-6 ${companyOpen ? "" : "hidden"}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="block text-sm font-medium text-slate-700">اسم الشركة</Label>
                  <Input
                    id="companyName"
                    className="text-fade"
                    value={accountDetails.companyName}
                    onChange={(e) => setAccountDetails({ ...accountDetails, companyName: e.target.value })}
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType" className="block text-sm font-medium text-slate-700">نوع النشاط</Label>
                  <Select value={accountDetails.businessType} onValueChange={(value) => setAccountDetails({ ...accountDetails, businessType: value })}>
                    <SelectTrigger className="text-fade" data-testid="select-business-type">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="taxId" className="block text-sm font-medium text-slate-700">الرقم الضريبي</Label>
                    <Input
                      id="taxId"
                      className="text-fade"
                      value={accountDetails.taxId}
                      onChange={(e) => setAccountDetails({ ...accountDetails, taxId: e.target.value })}
                      data-testid="input-tax-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="block text-sm font-medium text-slate-700">الموقع الإلكتروني</Label>
                    <Input
                      id="website"
                      type="url"
                      className="text-fade"
                      value={accountDetails.website}
                      onChange={(e) => setAccountDetails({ ...accountDetails, website: e.target.value })}
                      data-testid="input-website"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="block text-sm font-medium text-slate-700">وصف الشركة</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    className="text-fade"
                    value={accountDetails.description}
                    onChange={(e) => setAccountDetails({ ...accountDetails, description: e.target.value })}
                    data-testid="textarea-description"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="block text-sm font-medium text-slate-700">العنوان</Label>
                  <Input
                    id="address"
                    className="text-fade"
                    value={accountDetails.address}
                    onChange={(e) => setAccountDetails({ ...accountDetails, address: e.target.value })}
                    data-testid="input-address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="block text-sm font-medium text-slate-700">المدينة</Label>
                    <Input
                      id="city"
                      className="text-fade"
                      value={accountDetails.city}
                      onChange={(e) => setAccountDetails({ ...accountDetails, city: e.target.value })}
                      data-testid="input-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="block text-sm font-medium text-slate-700">الرمز البريدي</Label>
                    <Input
                      id="postalCode"
                      className="text-fade"
                      value={accountDetails.postalCode}
                      onChange={(e) => setAccountDetails({ ...accountDetails, postalCode: e.target.value })}
                      data-testid="input-postal-code"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="block text-sm font-medium text-slate-700">البلد</Label>
                  <Select value={accountDetails.country} onValueChange={(value) => setAccountDetails({ ...accountDetails, country: value })}>
                    <SelectTrigger className="text-fade" data-testid="select-country">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="block text-sm font-medium text-slate-700">هاتف الشركة</Label>
                    <Input
                      id="phone"
                      type="tel"
                      className="text-fade"
                      value={accountDetails.phone}
                      onChange={(e) => setAccountDetails({ ...accountDetails, phone: e.target.value })}
                      data-testid="input-company-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="block text-sm font-medium text-slate-700">البريد الإلكتروني للشركة</Label>
                    <Input
                      id="email"
                      type="email"
                      className="text-fade"
                      value={accountDetails.email}
                      onChange={(e) => setAccountDetails({ ...accountDetails, email: e.target.value })}
                      data-testid="input-company-email"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white/70 p-6 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-dashed border-slate-200">
                <span className="rounded-full bg-primary/10 p-2 text-primary"><User size={18} /></span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">جهة الاتصال الرئيسية</h3>
                  <p className="text-sm text-slate-500">بيانات الشخص المسؤول عن إدارة الحساب</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700">الاسم الكامل</Label>
                  <Input
                    id="contactPerson"
                    className="text-fade"
                    value={accountDetails.contactPerson}
                    onChange={(e) => setAccountDetails({ ...accountDetails, contactPerson: e.target.value })}
                    data-testid="input-contact-person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactTitle" className="block text-sm font-medium text-slate-700">المسمى الوظيفي</Label>
                  <Input
                    id="contactTitle"
                    className="text-fade"
                    value={accountDetails.contactTitle}
                    onChange={(e) => setAccountDetails({ ...accountDetails, contactTitle: e.target.value })}
                    data-testid="input-contact-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="block text-sm font-medium text-slate-700">رقم الهاتف</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    className="text-fade"
                    value={accountDetails.contactPhone}
                    onChange={(e) => setAccountDetails({ ...accountDetails, contactPhone: e.target.value })}
                    data-testid="input-contact-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="block text-sm font-medium text-slate-700">البريد الإلكتروني</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    className="text-fade"
                    value={accountDetails.contactEmail}
                    onChange={(e) => setAccountDetails({ ...accountDetails, contactEmail: e.target.value })}
                    data-testid="input-contact-email"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-start">
                <Button onClick={handleAccountSave} className="flex items-center gap-2" data-testid="button-save-account">
                  <Save size={16} />
                  حفظ تفاصيل الحساب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="border-b border-white/60 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Users size={18} /></span>
              <div className="text-right">
                <CardTitle className="text-xl font-semibold text-slate-900">الملف الشخصي للفريق</CardTitle>
                <CardDescription className="text-sm text-slate-500">تحكم ببياناتك الشخصية وصورتك الظاهرة في المنصة</CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
              aria-label="تبديل عرض الملف الشخصي"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>
          </CardHeader>
          <CardContent className={`space-y-6 pt-6 ${profileOpen ? "" : "hidden"}`}>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile.avatar} />
                <AvatarFallback className="text-lg">
                  {userProfile.firstName[0]}{userProfile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" className="flex items-center gap-2" data-testid="button-upload-avatar">
                  <Upload size={16} />
                  تغيير الصورة الشخصية
                </Button>
                <p className="text-sm text-muted-foreground">يفضل استخدام صور بحجم 400x400 بكسل أو أكبر</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="block text-sm font-medium text-slate-700">الاسم الأول</Label>
                <Input
                  id="firstName"
                  className="text-fade"
                  value={userProfile.firstName}
                  onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="block text-sm font-medium text-slate-700">اسم العائلة</Label>
                <Input
                  id="lastName"
                  className="text-fade"
                  value={userProfile.lastName}
                  onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail" className="block text-sm font-medium text-slate-700">البريد الإلكتروني</Label>
                <Input
                  id="userEmail"
                  type="email"
                  className="text-fade"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  data-testid="input-user-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPhone" className="block text-sm font-medium text-slate-700">رقم الهاتف</Label>
                <Input
                  id="userPhone"
                  type="tel"
                  className="text-fade"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  data-testid="input-user-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="block text-sm font-medium text-slate-700">المسمى الوظيفي</Label>
                <Input
                  id="title"
                  className="text-fade"
                  value={userProfile.title}
                  onChange={(e) => setUserProfile({ ...userProfile, title: e.target.value })}
                  data-testid="input-user-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="block text-sm font-medium text-slate-700">القسم</Label>
                <Select value={userProfile.department} onValueChange={(value) => setUserProfile({ ...userProfile, department: value })}>
                  <SelectTrigger className="text-fade" data-testid="select-department">
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
              <Button onClick={handleProfileSave} className="flex items-center gap-2" data-testid="button-save-profile">
                <Save size={16} />
                حفظ الملف الشخصي
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="border-b border-white/60 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Shield size={18} /></span>
              <div className="text-right">
                <CardTitle className="text-xl font-semibold text-slate-900">الأمان وكلمة المرور</CardTitle>
                <CardDescription className="text-sm text-slate-500">قم بتحديث كلمة المرور الخاصة بك بانتظام لحماية الحساب</CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSecurityOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
              aria-label="تبديل عرض إعدادات الأمان"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${securityOpen ? "rotate-180" : ""}`} />
            </button>
          </CardHeader>
          <CardContent className={`space-y-4 pt-6 ${securityOpen ? "" : "hidden"}`}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">كلمة المرور الحالية</Label>
              <Input id="currentPassword" type="password" className="text-fade" data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">كلمة المرور الجديدة</Label>
              <Input id="newPassword" type="password" className="text-fade" data-testid="input-new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">تأكيد كلمة المرور الجديدة</Label>
              <Input id="confirmPassword" type="password" className="text-fade" data-testid="input-confirm-password" />
            </div>
            <Button className="mt-4 flex items-center gap-2" data-testid="button-change-password">
              <Shield size={16} />
              تغيير كلمة المرور
            </Button>
          </CardContent>
        </Card>

        <Card className="apple-card">
          <CardHeader className="border-b border-white/60 pb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Bell size={18} /></span>
              <div className="text-right">
                <CardTitle className="text-xl font-semibold text-slate-900">إعدادات الإشعارات</CardTitle>
                <CardDescription className="text-sm text-slate-500">حدد الإشعارات التي ترغب باستلامها عن نشاط المنصة</CardDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
              aria-label="تبديل عرض إعدادات الإشعارات"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${notificationsOpen ? "rotate-180" : ""}`} />
            </button>
          </CardHeader>
          <CardContent className={`space-y-4 pt-6 ${notificationsOpen ? "" : "hidden"}`}>
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <input type="checkbox" defaultChecked className="toggle ml-4" data-testid="toggle-new-leads" />
              <div className="flex-1 pr-4">
                <div className="font-medium text-slate-900 mb-1">عملاء محتملين جدد</div>
                <div className="text-sm text-slate-500">إشعار عند إضافة عملاء محتملين جدد</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Users size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <input type="checkbox" defaultChecked className="toggle ml-4" data-testid="toggle-task-updates" />
              <div className="flex-1 pr-4">
                <div className="font-medium text-slate-900 mb-1">تحديثات المهام</div>
                <div className="text-sm text-slate-500">إشعار عند اكتمال أو تحديث المهام</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <input type="checkbox" defaultChecked className="toggle ml-4" data-testid="toggle-new-deals" />
              <div className="flex-1 pr-4">
                <div className="font-medium text-slate-900 mb-1">صفقات جديدة</div>
                <div className="text-sm text-slate-500">إشعار عند إنشاء صفقات جديدة</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <TrendingUp size={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
