/**
 * mortgage.tsx — حاسبة التمويل العقاري
 *
 * Monthly payment calculator for Saudi bank financing.
 * Inputs: property price, down payment %, interest rate, tenure years.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calculator, Home, Percent, Calendar, Banknote, Share2, Save, History, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import { MortgageSkeleton } from "@/components/skeletons/page-skeletons";
import { PAGE_WRAPPER } from "@/config/platform-theme";
import { SarPrice } from "@/components/ui/sar-symbol";
import { useMinLoadTime } from "@/hooks/useMinLoadTime";
import { cn } from "@/lib/utils";

/** Saved mortgage calculation (E14). Stored in localStorage. */
interface SavedCalc { id: string; name: string; price: string; downPaymentPct: string; interestRate: string; tenureYears: string; monthly: number; savedAt: string }
const STORAGE_KEY = "aqarkom_mortgage_calcs";

export default function MortgageCalculator() {
  const showSkeleton = useMinLoadTime();
  const [price, setPrice] = useState("1000000");
  const [downPaymentPct, setDownPaymentPct] = useState("10");
  const [interestRate, setInterestRate] = useState("5.5");
  const [tenureYears, setTenureYears] = useState("25");

  const result = useMemo(() => {
    const p = Number(price) || 0;
    const dp = (Number(downPaymentPct) || 0) / 100;
    const rate = (Number(interestRate) || 0) / 100 / 12;
    const months = (Number(tenureYears) || 1) * 12;

    const loanAmount = p * (1 - dp);
    const downPayment = p * dp;

    if (loanAmount <= 0 || rate <= 0 || months <= 0) {
      return { monthly: 0, total: 0, totalInterest: 0, loanAmount: 0, downPayment: 0 };
    }

    const monthly = (loanAmount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const total = monthly * months;
    const totalInterest = total - loanAmount;

    return {
      monthly: Math.round(monthly),
      total: Math.round(total),
      totalInterest: Math.round(totalInterest),
      loanAmount: Math.round(loanAmount),
      downPayment: Math.round(downPayment),
    };
  }, [price, downPaymentPct, interestRate, tenureYears]);

  const formatNum = (n: number) => n.toLocaleString("en-US");

  /** Load saved calculations from localStorage (E14). */
  const [savedCalcs, setSavedCalcs] = useState<SavedCalc[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  /** Save current calculation to localStorage (E14). */
  const saveCalc = () => {
    const name = prompt("اسم الحساب:");
    if (!name?.trim()) return;
    const calc: SavedCalc = {
      id: Date.now().toString(),
      name: name.trim(),
      price, downPaymentPct, interestRate, tenureYears,
      monthly: result.monthly,
      savedAt: new Date().toISOString(),
    };
    const updated = [calc, ...savedCalcs].slice(0, 20);
    setSavedCalcs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /** Load a saved calculation (E14). */
  const loadCalc = (c: SavedCalc) => {
    setPrice(c.price); setDownPaymentPct(c.downPaymentPct);
    setInterestRate(c.interestRate); setTenureYears(c.tenureYears);
  };

  /** Delete a saved calculation (E14). */
  const deleteCalc = (id: string) => {
    const updated = savedCalcs.filter((c) => c.id !== id);
    setSavedCalcs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  /** Share result via WhatsApp (E14). */
  const shareWhatsApp = () => {
    const text = `حاسبة التمويل العقاري\n\nسعر العقار: ${formatNum(Number(price))} ر.س\nالدفعة المقدمة: ${downPaymentPct}%\nنسبة الربح: ${interestRate}%\nالمدة: ${tenureYears} سنة\n\nالقسط الشهري: ${formatNum(result.monthly)} ر.س\nإجمالي المسدد: ${formatNum(result.total)} ر.س\nإجمالي الأرباح: ${formatNum(result.totalInterest)} ر.س`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (showSkeleton) {
    return (
      <div className={PAGE_WRAPPER}>
        <PageHeader title="حاسبة التمويل العقاري" subtitle="احسب القسط الشهري والتكلفة الإجمالية للتمويل" />
        <MortgageSkeleton />
      </div>
    );
  }

  return (
    <div className={PAGE_WRAPPER}>
      <PageHeader title="حاسبة التمويل العقاري" subtitle="احسب القسط الشهري والتكلفة الإجمالية للتمويل" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary"><Calculator size={18} /></span>
              <div>
                <CardTitle>بيانات التمويل</CardTitle>
                <CardDescription>أدخل تفاصيل العقار والتمويل</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-bold mb-1.5 block flex items-center gap-1.5">
                <Home size={14} />سعر العقار (ر.س)
              </label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                dir="ltr"
                className="text-start text-lg tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold mb-1.5 block flex items-center gap-1.5">
                  <Percent size={14} />الدفعة المقدمة %
                </label>
                <Input
                  type="number"
                  min={0}
                  max={90}
                  value={downPaymentPct}
                  onChange={(e) => setDownPaymentPct(e.target.value)}
                  dir="ltr"
                  className="text-start tabular-nums"
                />
              </div>
              <div>
                <label className="text-sm font-bold mb-1.5 block flex items-center gap-1.5">
                  <Percent size={14} />نسبة الربح السنوية %
                </label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  dir="ltr"
                  className="text-start tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold mb-1.5 block flex items-center gap-1.5">
                <Calendar size={14} />مدة التمويل (سنوات)
              </label>
              <Input
                type="number"
                min={1}
                max={30}
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
                dir="ltr"
                className="text-start tabular-nums"
              />
              <div className="flex gap-2 mt-2">
                {[10, 15, 20, 25, 30].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setTenureYears(String(y))}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs transition-colors",
                      Number(tenureYears) === y ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {y} سنة
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {/* Monthly Payment — Hero Card */}
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">القسط الشهري</p>
              <p className="text-4xl font-black text-primary tabular-nums">{formatNum(result.monthly)}</p>
              <p className="text-xs text-muted-foreground mt-1">ريال سعودي / شهر</p>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Banknote size={16} />ملخص التمويل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">سعر العقار</span>
                <span className="font-bold tabular-nums">{formatNum(Number(price) || 0)} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الدفعة المقدمة ({downPaymentPct}%)</span>
                <span className="font-bold tabular-nums">{formatNum(result.downPayment)} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">مبلغ التمويل</span>
                <span className="font-bold tabular-nums text-primary">{formatNum(result.loanAmount)} ر.س</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">إجمالي المبلغ المسدد</span>
                <span className="font-bold tabular-nums">{formatNum(result.total)} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">إجمالي الأرباح (الفوائد)</span>
                <span className="font-bold tabular-nums text-[hsl(var(--warning))]">{formatNum(result.totalInterest)} ر.س</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">عدد الأقساط</span>
                <span className="font-bold tabular-nums">{(Number(tenureYears) || 0) * 12} قسط</span>
              </div>
            </CardContent>
          </Card>

          {/* Share + Save buttons (E14) */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={shareWhatsApp}>
              <Share2 size={14} /> مشاركة عبر واتساب
            </Button>
            <Button variant="outline" className="flex-1 gap-1.5" onClick={saveCalc}>
              <Save size={14} /> حفظ الحساب
            </Button>
          </div>

          {/* Quick Note */}
          <p className="text-[11px] text-muted-foreground text-center">
            الحساب تقريبي ولا يشمل رسوم التأمين أو الرسوم الإدارية. يرجى مراجعة البنك للحصول على عرض دقيق.
          </p>
        </div>
      </div>

      {/* Saved Calculations History (E14) */}
      {savedCalcs.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><History size={16} /> الحسابات المحفوظة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedCalcs.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50" onClick={() => loadCalc(c)}>
                  <div>
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNum(c.monthly)} ر.س / شهر</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteCalc(c.id); }}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
