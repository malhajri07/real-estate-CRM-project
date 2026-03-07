/**
 * settings/index.tsx - Workspace Settings Page
 *
 * Route: /home/platform/settings or /settings
 *
 * Workspace settings page. Keeps all state here, delegates rendering to:
 *   - ProfileSection      — profile editing form
 *   - AccountSection      — password change / security
 *   - PreferencesSection  — notification preferences
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Save, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useLanguage } from "@/contexts/LanguageContext";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import PageHeader from "@/components/ui/page-header";

import ProfileSection from "./ProfileSection";
import type { UserProfile } from "./ProfileSection";
import AccountSection from "./AccountSection";
import PreferencesSection from "./PreferencesSection";

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

export default function Settings() {
  const { toast } = useToast();
  const { t, dir } = useLanguage();

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
    contactEmail: "ahmed.ali@aqaraty.com",
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "محمد",
    lastName: "الأحمد",
    email: "mohammad.ahmad@aqaraty.com",
    phone: "+966501234567",
    title: "مدير المبيعات",
    department: "المبيعات",
    avatar: "",
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
    <div className={PAGE_WRAPPER} dir={dir}>
      <section className="space-y-8">
        <PageHeader title={t("الإعدادات")} subtitle={t("إدارة بيانات الشركة، الملف الشخصي، والأمان والإشعارات من مكان واحد")}>
          <Button size="sm" onClick={handleAccountSave}>
            <Save size={16} className="me-2" /> حفظ التغييرات
          </Button>
        </PageHeader>

        <div className="grid gap-6">
          {/* Company Info — kept inline as it was not requested for extraction */}
          <Collapsible open={companyOpen} onOpenChange={setCompanyOpen}>
            <Card>
              <CardHeader className="pb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 p-2 text-primary"><Building2 size={18} /></span>
                  <div className="text-end">
                    <CardTitle>معلومات الشركة</CardTitle>
                    <CardDescription>تفاصيل النشاط التجاري وقنوات التواصل الرسمية</CardDescription>
                  </div>
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full border border-border bg-white p-2 text-slate-500 transition hover:text-slate-700"
                    aria-label="تبديل عرض معلومات الشركة"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${companyOpen ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="block text-sm font-medium text-slate-700">اسم الشركة</Label>
                        <Input
                          id="companyName"
                          className="text-subtle"
                          value={accountDetails.companyName}
                          onChange={(e) => setAccountDetails({ ...accountDetails, companyName: e.target.value })}
                          data-testid="input-company-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="businessType" className="block text-sm font-medium text-slate-700">نوع النشاط</Label>
                        <Select value={accountDetails.businessType} onValueChange={(value) => setAccountDetails({ ...accountDetails, businessType: value })}>
                          <SelectTrigger className="text-subtle" data-testid="select-business-type">
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
                            className="text-subtle"
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
                            className="text-subtle"
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
                          className="text-subtle"
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
                          className="text-subtle"
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
                            className="text-subtle"
                            value={accountDetails.city}
                            onChange={(e) => setAccountDetails({ ...accountDetails, city: e.target.value })}
                            data-testid="input-city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode" className="block text-sm font-medium text-slate-700">الرمز البريدي</Label>
                          <Input
                            id="postalCode"
                            className="text-subtle"
                            value={accountDetails.postalCode}
                            onChange={(e) => setAccountDetails({ ...accountDetails, postalCode: e.target.value })}
                            data-testid="input-postal-code"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="block text-sm font-medium text-slate-700">البلد</Label>
                        <Select value={accountDetails.country} onValueChange={(value) => setAccountDetails({ ...accountDetails, country: value })}>
                          <SelectTrigger className="text-subtle" data-testid="select-country">
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
                            className="text-subtle"
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
                            className="text-subtle"
                            value={accountDetails.email}
                            onChange={(e) => setAccountDetails({ ...accountDetails, email: e.target.value })}
                            data-testid="input-company-email"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-4 border-b border-dashed border-border">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-primary/10 p-2 text-primary"><User size={18} /></span>
                        <div>
                          <CardTitle>جهة الاتصال الرئيسية</CardTitle>
                          <CardDescription>بيانات الشخص المسؤول عن إدارة الحساب</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700">الاسم الكامل</Label>
                          <Input
                            id="contactPerson"
                            className="text-subtle"
                            value={accountDetails.contactPerson}
                            onChange={(e) => setAccountDetails({ ...accountDetails, contactPerson: e.target.value })}
                            data-testid="input-contact-person"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactTitle" className="block text-sm font-medium text-slate-700">المسمى الوظيفي</Label>
                          <Input
                            id="contactTitle"
                            className="text-subtle"
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
                            className="text-subtle"
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
                            className="text-subtle"
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
                    </CardContent>
                  </Card>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <ProfileSection
            userProfile={userProfile}
            onUserProfileChange={setUserProfile}
            onSave={handleProfileSave}
            isOpen={profileOpen}
            onOpenChange={setProfileOpen}
          />

          <AccountSection isOpen={securityOpen} onOpenChange={setSecurityOpen} />

          <PreferencesSection isOpen={notificationsOpen} onOpenChange={setNotificationsOpen} />
        </div>
      </section>
    </div>
  );
}
