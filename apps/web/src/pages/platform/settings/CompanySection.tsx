/**
 * CompanySection.tsx — Organization/company info (corporate agents only)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2, MapPin, Phone, Mail, Globe, FileText,
  ShieldCheck, CheckCircle, AlertTriangle, Hash,
} from "lucide-react";
import { formatAdminDate } from "@/lib/formatters";

const FAL_TYPE_LABELS: Record<string, string> = {
  BROKERAGE_MARKETING: "وساطة وتسويق",
  PROPERTY_MANAGEMENT: "إدارة أملاك",
  FACILITY_MANAGEMENT: "إدارة مرافق",
  AUCTION: "مزادات عقارية",
  CONSULTING: "استشارات وتحليلات",
  ADVERTISING: "إعلانات عقارية",
};

interface Props {
  organization: any;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={16} className="text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function CompanySection({ organization }: Props) {
  if (!organization) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Building2 size={32} className="mx-auto mb-3 opacity-50" />
          <p>لا توجد بيانات شركة مرتبطة بحسابك</p>
        </CardContent>
      </Card>
    );
  }

  const org = organization;
  const hasFal = !!org.falLicenseNumber;
  const hasNationalAddress = !!(org.nationalAddressBuildingNo || org.nationalAddressStreet);

  return (
    <div className="space-y-6">
      {/* Company Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Building2 size={18} /></span>
              <div>
                <CardTitle>{org.tradeName || org.legalName}</CardTitle>
                <CardDescription>{org.industry || "وساطة عقارية"}</CardDescription>
              </div>
            </div>
            <Badge variant={org.status === "ACTIVE" ? "default" : "outline"}>
              {org.status === "ACTIVE" ? "نشط" : org.status === "SUSPENDED" ? "معلّق" : "قيد التحقق"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <InfoRow icon={Building2} label="الاسم القانوني" value={org.legalName} />
            <InfoRow icon={Building2} label="الاسم التجاري" value={org.tradeName} />
            <InfoRow icon={Hash} label="رقم السجل التجاري" value={org.crNumber || org.licenseNo} />
            <InfoRow icon={Hash} label="الرقم الضريبي (VAT)" value={org.vatNumber} />
            <InfoRow icon={Phone} label="هاتف الشركة" value={org.phone} />
            <InfoRow icon={Mail} label="البريد الإلكتروني" value={org.email} />
            <InfoRow icon={Globe} label="الموقع الإلكتروني" value={org.website} />
            <InfoRow icon={MapPin} label="المدينة" value={org.city} />
            <InfoRow icon={MapPin} label="المنطقة" value={org.region} />
            <InfoRow icon={MapPin} label="العنوان" value={org.address} />
          </div>
        </CardContent>
      </Card>

      {/* National Address */}
      {hasNationalAddress && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><MapPin size={18} /></span>
              <div>
                <CardTitle>العنوان الوطني</CardTitle>
                <CardDescription>العنوان المسجل في البريد السعودي</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {org.nationalAddressBuildingNo && (
                <div>
                  <p className="text-xs text-muted-foreground">رقم المبنى</p>
                  <p className="font-bold tabular-nums">{org.nationalAddressBuildingNo}</p>
                </div>
              )}
              {org.nationalAddressStreet && (
                <div>
                  <p className="text-xs text-muted-foreground">الشارع</p>
                  <p className="font-bold">{org.nationalAddressStreet}</p>
                </div>
              )}
              {org.nationalAddressPostalCode && (
                <div>
                  <p className="text-xs text-muted-foreground">الرمز البريدي</p>
                  <p className="font-bold tabular-nums">{org.nationalAddressPostalCode}</p>
                </div>
              )}
              {org.nationalAddressAdditionalNo && (
                <div>
                  <p className="text-xs text-muted-foreground">الرقم الإضافي</p>
                  <p className="font-bold tabular-nums">{org.nationalAddressAdditionalNo}</p>
                </div>
              )}
              {org.nationalAddressShortCode && (
                <div>
                  <p className="text-xs text-muted-foreground">الرمز المختصر</p>
                  <p className="font-bold tabular-nums">{org.nationalAddressShortCode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company FAL License */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><ShieldCheck size={18} /></span>
              <div>
                <CardTitle>رخصة فال للمنشأة</CardTitle>
                <CardDescription>بيانات ترخيص المنشأة من الهيئة العامة للعقار</CardDescription>
              </div>
            </div>
            {hasFal ? (
              <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                <CheckCircle size={12} />
                {org.falStatus === "VERIFIED" ? "موثّق" : "مسجّل"}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))]">
                <AlertTriangle size={12} />
                غير مسجّل
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">رقم رخصة فال</p>
              <p className="font-bold tabular-nums">{org.falLicenseNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">نوع الرخصة</p>
              <p className="font-bold">{org.falLicenseType ? FAL_TYPE_LABELS[org.falLicenseType] || org.falLicenseType : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الإصدار</p>
              <p className="font-bold">{org.falIssuedAt ? formatAdminDate(org.falIssuedAt) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الانتهاء</p>
              <p className="font-bold">{org.falExpiresAt ? formatAdminDate(org.falExpiresAt) : "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-4 pt-3 border-t">
            <FileText size={14} />
            <span>لتعديل بيانات المنشأة، تواصل مع الإدارة أو قم بالتحديث من بوابة <strong className="text-primary">rega.gov.sa</strong></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
