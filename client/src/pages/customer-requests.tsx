import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Download, Mail, Phone, RefreshCcw } from "lucide-react";

const CONTRACT_LABELS: Record<string, string> = {
  buy: "شراء",
  rent: "إيجار",
};

const GENDER_LABELS: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
  other: "أخرى",
};

interface PropertySeekerRecord {
  seekerId?: string | null;
  seekerNum?: number | string | null;
  firstName?: string | null;
  lastName?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  nationality?: string | null;
  age?: number | string | null;
  monthlyIncome?: number | string | null;
  gender?: string | null;
  typeOfProperty?: string | null;
  typeOfContract?: string | null;
  numberOfRooms?: number | string | null;
  numberOfBathrooms?: number | string | null;
  numberOfLivingRooms?: number | string | null;
  houseDirection?: string | null;
  budgetSize?: number | string | null;
  hasMaidRoom?: boolean | null;
  hasDriverRoom?: boolean | null;
  kitchenInstalled?: boolean | null;
  hasElevator?: boolean | null;
  parkingAvailable?: boolean | null;
  city?: string | null;
  district?: string | null;
  region?: string | null;
  otherComments?: string | null;
  notes?: string | null;
  sqm?: number | string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === "object" && typeof (value as any).toString === "function") {
    const parsed = Number((value as any).toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatCurrency = (value: unknown): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "—";
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
  }).format(numeric);
};

const formatNumber = (value: unknown): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "—";
  return new Intl.NumberFormat("ar-SA").format(numeric);
};

const formatDateTime = (value: unknown): string => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value as any);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function CustomerRequestsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<PropertySeekerRecord[], Error>({
    queryKey: ["property-seekers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/requests");
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const message = body && typeof body === "object" && body && "message" in body
          ? String((body as any).message)
          : "تعذر تحميل الطلبات";
        throw new Error(message);
      }
      if (!Array.isArray(body)) {
        return [];
      }
      return body as PropertySeekerRecord[];
    },
    staleTime: 60_000,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const seekers = data ?? [];

  const filteredSeekers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return seekers;
    return seekers.filter((item) => {
      const values = [
        item.firstName,
        item.lastName,
        item.email,
        item.mobileNumber,
        item.city,
        item.district,
        item.region,
        item.typeOfProperty,
        item.typeOfContract,
        item.nationality,
        item.seekerId,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return values.some((value) => value.includes(term));
    });
  }, [seekers, searchTerm]);

  const contractSummary = useMemo(() => {
    return seekers.reduce(
      (acc, seeker) => {
        const value = (seeker.typeOfContract ?? "").toLowerCase();
        if (value === "buy") acc.buy += 1;
        if (value === "rent") acc.rent += 1;
        return acc;
      },
      { buy: 0, rent: 0 }
    );
  }, [seekers]);

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 text-right">
              <CardTitle className="text-2xl font-bold text-slate-900">
                قاعدة بيانات العملاء الباحثين عن العقار
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {`إجمالي ${seekers.length} طلب مسجل`} • {`شراء: ${contractSummary.buy}`} • {`إيجار: ${contractSummary.rent}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="تحديث القائمة"
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" asChild>
                <a href="/api/requests/export" target="_blank" rel="noreferrer">
                  <Download className="ml-2 h-4 w-4" />
                  تحميل CSV
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredSeekers.length === seekers.length
                  ? `يعرض جميع الطلبات`
                  : `يعرض ${filteredSeekers.length} من ${seekers.length} طلب`}
              </div>
              <div className="w-full sm:w-72">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="بحث بالاسم، المدينة، البريد أو الجوال"
                  className="text-right"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-right">
                <p className="text-base font-semibold text-destructive">تعذر تحميل قائمة الطلبات</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {error?.message || "حدث خطأ غير متوقع"}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                  إعادة المحاولة
                </Button>
              </div>
            ) : filteredSeekers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                لا توجد طلبات مطابقة لخيارات البحث الحالية.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[16%]">الاسم</TableHead>
                      <TableHead className="w-[20%]">بيانات التواصل</TableHead>
                      <TableHead className="w-[20%]">التفضيلات</TableHead>
                      <TableHead className="w-[18%]">الميزانية والدخل</TableHead>
                      <TableHead className="w-[14%]">الموقع</TableHead>
                      <TableHead className="w-[12%]">تاريخ التسجيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSeekers.map((seeker, index) => {
                      const fullName = `${seeker.firstName ?? ""} ${seeker.lastName ?? ""}`.trim() || "—";
                      const contractLabel = seeker.typeOfContract
                        ? CONTRACT_LABELS[seeker.typeOfContract] ?? seeker.typeOfContract
                        : null;
                      const genderLabel = seeker.gender ? GENDER_LABELS[seeker.gender] ?? seeker.gender : null;
                      const createdLabel = formatDateTime(seeker.createdAt);
                      const updatedLabel = formatDateTime(seeker.updatedAt);
                      const rowKey = seeker.seekerId
                        ?? (seeker.seekerNum !== undefined && seeker.seekerNum !== null
                          ? String(seeker.seekerNum)
                          : `${seeker.email ?? ""}-${seeker.mobileNumber ?? index}`);

                      return (
                        <TableRow key={rowKey}>
                          <TableCell>
                            <div className="flex flex-col items-end gap-1 text-right">
                              <span className="font-semibold text-slate-900">{fullName}</span>
                              {seeker.seekerId && (
                                <span className="text-xs text-muted-foreground">معرف: {seeker.seekerId}</span>
                              )}
                              {genderLabel && (
                                <span className="text-xs text-muted-foreground">الجنس: {genderLabel}</span>
                              )}
                              {seeker.age && (
                                <span className="text-xs text-muted-foreground">العمر: {seeker.age}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2 text-right text-sm">
                              {seeker.mobileNumber && (
                                <div className="flex items-center justify-end gap-2">
                                  <span>{seeker.mobileNumber}</span>
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              {seeker.email && (
                                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                  <span className="max-w-[220px] truncate ltr:text-left rtl:text-right">{seeker.email}</span>
                                  <Mail className="h-3.5 w-3.5" />
                                </div>
                              )}
                              {seeker.nationality && (
                                <div className="text-xs text-muted-foreground">الجنسية: {seeker.nationality}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-end gap-2 text-right text-sm">
                              {seeker.typeOfProperty && (
                                <Badge variant="secondary" className="w-fit">
                                  {seeker.typeOfProperty}
                                </Badge>
                              )}
                              {contractLabel && (
                                <Badge variant="outline" className="w-fit">
                                  {contractLabel}
                                </Badge>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span>غرف: {seeker.numberOfRooms ?? "—"}</span>
                                <span>حمامات: {seeker.numberOfBathrooms ?? "—"}</span>
                                <span>صالات: {seeker.numberOfLivingRooms ?? "—"}</span>
                              </div>
                              {seeker.houseDirection && (
                                <span className="text-xs text-muted-foreground">
                                  اتجاه: {seeker.houseDirection}
                                </span>
                              )}
                              {(seeker.otherComments || seeker.notes) && (
                                <span className="text-xs text-muted-foreground max-w-xs truncate">
                                  ملاحظات: {(seeker.otherComments || seeker.notes) ?? ""}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-end gap-1 text-right text-sm">
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(seeker.budgetSize)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                الدخل الشهري: {formatCurrency(seeker.monthlyIncome)}
                              </span>
                              {seeker.sqm && (
                                <span className="text-xs text-muted-foreground">
                                  المساحة: {formatNumber(seeker.sqm)} م²
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-end gap-1 text-right text-sm">
                              <span>
                                {[seeker.city, seeker.district].filter(Boolean).join("، ") || "—"}
                              </span>
                              {seeker.region && (
                                <span className="text-xs text-muted-foreground">المنطقة: {seeker.region}</span>
                              )}
                              {seeker.hasMaidRoom && (
                                <span className="text-xs text-muted-foreground">غرفة خادمة</span>
                              )}
                              {seeker.hasDriverRoom && (
                                <span className="text-xs text-muted-foreground">غرفة سائق</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-end gap-1 text-right text-sm">
                              <span>{createdLabel}</span>
                              {seeker.updatedAt && updatedLabel !== createdLabel && (
                                <span className="text-xs text-muted-foreground">
                                  آخر تحديث: {updatedLabel}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
