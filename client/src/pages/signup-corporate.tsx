import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, User, Phone, Mail, MapPin, Upload, ArrowRight, FileText } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "@assets/Aqaraty_logo_selected_1755461935189.png";

export default function SignupCorporate() {
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [commercialRegistration, setCommercialRegistration] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [establishmentDate, setEstablishmentDate] = useState("");
  const [employeesCount, setEmployeesCount] = useState("");
  
  // Contact Person Info
  const [contactName, setContactName] = useState("");
  const [contactPosition, setContactPosition] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  // Documents
  const [commercialRegDoc, setCommercialRegDoc] = useState<FileList | null>(null);
  const [vatCertificate, setVatCertificate] = useState<FileList | null>(null);
  const [companyProfile, setCompanyProfile] = useState<FileList | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!companyName || !companyType || !commercialRegistration || !contactName || !contactEmail || !contactPhone) {
      toast({
        title: "خطأ في البيانات",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast({
        title: "البريد الإلكتروني غير صحيح",
        description: "الرجاء إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate phone
    if (!/^(05|5)\d{8}$/.test(contactPhone)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "الرجاء إدخال رقم جوال سعودي صحيح",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Submit KYC application to backend
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

      toast({
        title: "تم إرسال طلبك بنجاح",
        description: "سيقوم فريقنا بمراجعة طلبك والتواصل معك خلال 48 ساعة",
      });

      setLocation("/signup/kyc-submitted");
    } catch (error) {
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء إرسال طلبك، الرجاء المحاولة مرة أخرى",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="شعار عقاراتي" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            طلب حساب مؤسسي
          </CardTitle>
          <p className="text-slate-600 mt-2">
            أدخل تفاصيل شركتك لبدء عملية التحقق والموافقة
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Information */}
            <div className="bg-blue-50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <Building2 className="w-5 h-5 ml-2" />
                معلومات الشركة
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    اسم الشركة *
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="أدخل اسم الشركة"
                    required
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyType">
                    نوع الشركة *
                  </Label>
                  <Select value={companyType} onValueChange={setCompanyType} required>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر نوع الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llc">شركة ذات مسؤولية محدودة</SelectItem>
                      <SelectItem value="corporation">شركة مساهمة</SelectItem>
                      <SelectItem value="partnership">شركة تضامن</SelectItem>
                      <SelectItem value="sole-proprietorship">مؤسسة فردية</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commercialRegistration">
                    رقم السجل التجاري *
                  </Label>
                  <Input
                    id="commercialRegistration"
                    type="text"
                    value={commercialRegistration}
                    onChange={(e) => setCommercialRegistration(e.target.value)}
                    placeholder="أدخل رقم السجل التجاري"
                    required
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxNumber">
                    الرقم الضريبي
                  </Label>
                  <Input
                    id="taxNumber"
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="أدخل الرقم الضريبي"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="establishmentDate">
                    تاريخ التأسيس
                  </Label>
                  <Input
                    id="establishmentDate"
                    type="date"
                    value={establishmentDate}
                    onChange={(e) => setEstablishmentDate(e.target.value)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeesCount">
                    عدد الموظفين
                  </Label>
                  <Select value={employeesCount} onValueChange={setEmployeesCount}>
                    <SelectTrigger className="text-right">
                      <SelectValue placeholder="اختر عدد الموظفين" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 موظفين</SelectItem>
                      <SelectItem value="11-50">11-50 موظف</SelectItem>
                      <SelectItem value="51-200">51-200 موظف</SelectItem>
                      <SelectItem value="200+">أكثر من 200 موظف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyAddress">
                  عنوان الشركة
                </Label>
                <Input
                  id="companyAddress"
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="أدخل العنوان التفصيلي"
                  className="text-right"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyCity">
                    المدينة
                  </Label>
                  <Input
                    id="companyCity"
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    placeholder="أدخل المدينة"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">
                    الموقع الإلكتروني
                  </Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">
                  نبذة عن الشركة
                </Label>
                <Textarea
                  id="companyDescription"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="اكتب نبذة مختصرة عن نشاط الشركة وخدماتها..."
                  className="text-right h-24"
                />
              </div>
            </div>

            {/* Contact Person Information */}
            <div className="bg-green-50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                <User className="w-5 h-5 ml-2" />
                معلومات الشخص المسؤول
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    الاسم الكامل *
                  </Label>
                  <Input
                    id="contactName"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                    required
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPosition">
                    المنصب
                  </Label>
                  <Input
                    id="contactPosition"
                    type="text"
                    value={contactPosition}
                    onChange={(e) => setContactPosition(e.target.value)}
                    placeholder="أدخل المنصب الوظيفي"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    البريد الإلكتروني *
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="example@company.com"
                    required
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    رقم الجوال *
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    required
                    className="text-right"
                  />
                </div>
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-orange-50 p-6 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-orange-800 flex items-center">
                <FileText className="w-5 h-5 ml-2" />
                المستندات المطلوبة (اختيارية)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commercialRegDoc">
                    صورة السجل التجاري
                  </Label>
                  <Input
                    id="commercialRegDoc"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setCommercialRegDoc(e.target.files)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatCertificate">
                    شهادة التسجيل في ضريبة القيمة المضافة
                  </Label>
                  <Input
                    id="vatCertificate"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setVatCertificate(e.target.files)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyProfile">
                    ملف تعريف الشركة
                  </Label>
                  <Input
                    id="companyProfile"
                    type="file"
                    accept="application/pdf,.doc,.docx"
                    onChange={(e) => setCompanyProfile(e.target.files)}
                    className="text-right"
                  />
                </div>
              </div>

              <p className="text-sm text-orange-600">
                يمكنك رفع هذه المستندات الآن أو إرسالها لاحقاً عبر البريد الإلكتروني
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "جار إرسال الطلب..." : "إرسال طلب التحقق"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation("/signup")}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى خيارات التسجيل
            </Button>
          </div>

          {/* What happens next */}
          <div className="mt-8 bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">ماذا يحدث بعد ذلك؟</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• سيقوم فريق المراجعة بدراسة طلبك خلال 48 ساعة</li>
              <li>• قد نطلب مستندات إضافية أو توضيحات</li>
              <li>• سنتواصل معك لترتيب مكالمة تعريفية</li>
              <li>• عند الموافقة، سيتم إنشاء حسابكم وإرسال بيانات الدخول</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}