/**
 * roi.tsx — حاسبة العائد الاستثماري + مقارنة الإيجار والشراء
 *
 * Two tabs: ROI Calculator + Rent vs Buy comparison.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Home, Calculator, BarChart3 } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-US");

export default function ROICalculator() {
  // ROI state
  const [purchasePrice, setPurchasePrice] = useState("1000000");
  const [annualRent, setAnnualRent] = useState("60000");
  const [annualExpenses, setAnnualExpenses] = useState("10000");
  const [vacancyRate, setVacancyRate] = useState("5");

  // Rent vs Buy state
  const [buyPrice, setBuyPrice] = useState("1000000");
  const [downPct, setDownPct] = useState("10");
  const [interestRate, setInterestRate] = useState("5.5");
  const [monthlyRentCost, setMonthlyRentCost] = useState("4000");
  const [years, setYears] = useState("10");
  const [appreciation, setAppreciation] = useState("3");

  // ROI calculations
  const roi = useMemo(() => {
    const price = Number(purchasePrice) || 0;
    const rent = Number(annualRent) || 0;
    const expenses = Number(annualExpenses) || 0;
    const vacancy = (Number(vacancyRate) || 0) / 100;
    if (price <= 0) return null;

    const effectiveRent = rent * (1 - vacancy);
    const noi = effectiveRent - expenses;
    const capRate = (noi / price) * 100;
    const grossYield = (rent / price) * 100;
    const netYield = (noi / price) * 100;
    const paybackYears = noi > 0 ? price / noi : 0;

    return { effectiveRent, noi, capRate, grossYield, netYield, paybackYears };
  }, [purchasePrice, annualRent, annualExpenses, vacancyRate]);

  // Rent vs Buy calculations
  const rvb = useMemo(() => {
    const price = Number(buyPrice) || 0;
    const dp = (Number(downPct) || 0) / 100;
    const rate = (Number(interestRate) || 0) / 100 / 12;
    const rent = Number(monthlyRentCost) || 0;
    const yrs = Number(years) || 1;
    const appr = (Number(appreciation) || 0) / 100;
    const months = yrs * 12;
    if (price <= 0 || rate <= 0) return null;

    const loan = price * (1 - dp);
    const monthly = (loan * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalMortgage = monthly * months + price * dp;
    const totalRent = rent * months;
    const futureValue = price * Math.pow(1 + appr, yrs);
    const equity = futureValue - loan; // simplified
    const netCostBuy = totalMortgage - equity;

    return { monthly: Math.round(monthly), totalMortgage: Math.round(totalMortgage), totalRent: Math.round(totalRent), futureValue: Math.round(futureValue), equity: Math.round(equity), netCostBuy: Math.round(netCostBuy), buyIsBetter: netCostBuy < totalRent };
  }, [buyPrice, downPct, interestRate, monthlyRentCost, years, appreciation]);

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="الأدوات المالية" subtitle="حاسبة العائد الاستثماري ومقارنة الإيجار والشراء" />

      <Tabs defaultValue="roi" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="roi" className="gap-1.5"><TrendingUp size={14} />العائد الاستثماري</TabsTrigger>
          <TabsTrigger value="rvb" className="gap-1.5"><Home size={14} />إيجار أم شراء</TabsTrigger>
        </TabsList>

        {/* ═══ ROI TAB ═══ */}
        <TabsContent value="roi">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2 text-primary"><Calculator size={18} /></span>
                  <div>
                    <CardTitle>بيانات العقار الاستثماري</CardTitle>
                    <CardDescription>أدخل تفاصيل العقار لحساب العائد</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-bold mb-1.5 block">سعر الشراء (ر.س)</label>
                  <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">الإيجار السنوي (ر.س)</label>
                  <Input type="number" value={annualRent} onChange={(e) => setAnnualRent(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">المصاريف السنوية (صيانة، إدارة)</label>
                  <Input type="number" value={annualExpenses} onChange={(e) => setAnnualExpenses(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                </div>
                <div>
                  <label className="text-sm font-bold mb-1.5 block">نسبة الشغور %</label>
                  <Input type="number" min={0} max={50} value={vacancyRate} onChange={(e) => setVacancyRate(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                </div>
              </CardContent>
            </Card>

            {roi && (
              <div className="space-y-4">
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">صافي العائد السنوي</p>
                    <p className="text-4xl font-black text-primary tabular-nums">{roi.netYield.toFixed(1)}%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">العائد الإجمالي</span><span className="font-bold">{roi.grossYield.toFixed(1)}%</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">معدل الرسملة (Cap Rate)</span><span className="font-bold">{roi.capRate.toFixed(1)}%</span></div>
                    <Separator />
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">الإيجار الفعلي (بعد الشغور)</span><span className="font-bold tabular-nums">{fmt(Math.round(roi.effectiveRent))} ر.س</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">صافي الدخل التشغيلي (NOI)</span><span className="font-bold text-primary tabular-nums">{fmt(Math.round(roi.noi))} ر.س</span></div>
                    <Separator />
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">فترة الاسترداد</span><span className="font-bold">{roi.paybackYears > 0 ? `${roi.paybackYears.toFixed(1)} سنة` : "—"}</span></div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ RENT VS BUY TAB ═══ */}
        <TabsContent value="rvb">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2 text-primary"><Home size={18} /></span>
                  <div>
                    <CardTitle>مقارنة الإيجار والشراء</CardTitle>
                    <CardDescription>أيهما أوفر على المدى الطويل؟</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold mb-1.5 block">سعر الشراء</label>
                    <Input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1.5 block">الدفعة المقدمة %</label>
                    <Input type="number" min={0} max={90} value={downPct} onChange={(e) => setDownPct(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold mb-1.5 block">نسبة الربح %</label>
                    <Input type="number" min={0} max={15} step={0.1} value={interestRate} onChange={(e) => setInterestRate(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1.5 block">الإيجار الشهري</label>
                    <Input type="number" value={monthlyRentCost} onChange={(e) => setMonthlyRentCost(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold mb-1.5 block">المدة (سنوات)</label>
                    <Input type="number" min={1} max={30} value={years} onChange={(e) => setYears(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1.5 block">نمو قيمة العقار %</label>
                    <Input type="number" min={0} max={20} step={0.5} value={appreciation} onChange={(e) => setAppreciation(e.target.value)} dir="ltr" className="text-start tabular-nums" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {rvb && (
              <div className="space-y-4">
                <Card className={cn("border-2", rvb.buyIsBetter ? "border-primary bg-primary/5" : "border-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.05)]")}>
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-1">الخيار الأفضل خلال {years} سنوات</p>
                    <p className="text-3xl font-black">{rvb.buyIsBetter ? "الشراء أوفر" : "الإيجار أوفر"}</p>
                    <p className="text-sm text-muted-foreground mt-1">فرق: {fmt(Math.abs(rvb.totalRent - rvb.netCostBuy))} ر.س</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">الشراء</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">القسط الشهري</span><span className="font-bold tabular-nums">{fmt(rvb.monthly)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">إجمالي المدفوع</span><span className="font-bold tabular-nums">{fmt(rvb.totalMortgage)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">قيمة العقار المستقبلية</span><span className="font-bold text-primary tabular-nums">{fmt(rvb.futureValue)}</span></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-muted-foreground">صافي التكلفة</span><span className="font-black tabular-nums">{fmt(rvb.netCostBuy)}</span></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">الإيجار</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">الإيجار الشهري</span><span className="font-bold tabular-nums">{fmt(Number(monthlyRentCost))}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">إجمالي المدفوع</span><span className="font-bold tabular-nums">{fmt(rvb.totalRent)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">قيمة متبقية</span><span className="font-bold text-muted-foreground">0</span></div>
                      <Separator />
                      <div className="flex justify-between"><span className="text-muted-foreground">صافي التكلفة</span><span className="font-black tabular-nums">{fmt(rvb.totalRent)}</span></div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
