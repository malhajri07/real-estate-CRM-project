/**
 * ReportExportPanel.tsx — Report Export Configuration & Preview Panel
 *
 * Location: apps/web/src/components/report/ReportExportPanel.tsx
 *
 * Features:
 * - Date range picker (from/to)
 * - Report type selector (leads, deals, revenue, properties, agents)
 * - Format selector (CSV, PDF)
 * - Preview data table with sample rows
 * - Download button
 * - Schedule recurring export option
 * - Loading and empty states
 *
 * Dependencies:
 * - @/components/ui/card
 * - @/components/ui/button
 * - @/components/ui/badge
 * - @/components/ui/select
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  Clock,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowDownToLine,
  Table,
  BarChart3,
  Users,
  Building2,
  DollarSign,
  UserCheck,
  type LucideIcon,
  Inbox,
  Loader2,
  CalendarClock,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReportType =
  | "leads"
  | "deals"
  | "revenue"
  | "properties"
  | "agents";

export type ExportFormat = "csv" | "pdf";

export type ScheduleFrequency =
  | "none"
  | "daily"
  | "weekly"
  | "monthly";

export interface PreviewColumn {
  key: string;
  header: string;
}

export interface PreviewRow {
  [key: string]: string | number;
}

export interface ReportExportPanelProps {
  onExport?: (config: ExportConfig) => void;
  onSchedule?: (config: ExportConfig & { frequency: ScheduleFrequency }) => void;
  previewData?: PreviewRow[];
  previewColumns?: PreviewColumn[];
  isExporting?: boolean;
  isLoadingPreview?: boolean;
  className?: string;
}

export interface ExportConfig {
  reportType: ReportType;
  format: ExportFormat;
  startDate: string;
  endDate: string;
}

// ─── Report Type Config ─────────────────────────────────────────────────────

interface ReportTypeConfig {
  icon: LucideIcon;
  label: string;
  description: string;
  columns: PreviewColumn[];
}

const REPORT_TYPES: Record<ReportType, ReportTypeConfig> = {
  leads: {
    icon: Users,
    label: "تقرير العملاء المحتملين",
    description: "ملخص بيانات العملاء المحتملين وحالاتهم ومصادرهم",
    columns: [
      { key: "name", header: "الاسم" },
      { key: "status", header: "الحالة" },
      { key: "source", header: "المصدر" },
      { key: "phone", header: "الهاتف" },
      { key: "createdAt", header: "تاريخ الإنشاء" },
    ],
  },
  deals: {
    icon: Building2,
    label: "تقرير الصفقات",
    description: "تفاصيل الصفقات ومراحلها وقيمها",
    columns: [
      { key: "client", header: "العميل" },
      { key: "property", header: "العقار" },
      { key: "value", header: "القيمة" },
      { key: "stage", header: "المرحلة" },
      { key: "date", header: "التاريخ" },
    ],
  },
  revenue: {
    icon: DollarSign,
    label: "تقرير الإيرادات",
    description: "إجمالي الإيرادات والعمولات حسب الفترة",
    columns: [
      { key: "period", header: "الفترة" },
      { key: "revenue", header: "الإيرادات" },
      { key: "commission", header: "العمولات" },
      { key: "deals", header: "عدد الصفقات" },
      { key: "growth", header: "النمو %" },
    ],
  },
  properties: {
    icon: Building2,
    label: "تقرير العقارات",
    description: "قائمة العقارات وحالاتها وأسعارها",
    columns: [
      { key: "title", header: "العنوان" },
      { key: "type", header: "النوع" },
      { key: "price", header: "السعر" },
      { key: "status", header: "الحالة" },
      { key: "city", header: "المدينة" },
    ],
  },
  agents: {
    icon: UserCheck,
    label: "تقرير الوكلاء",
    description: "أداء الوكلاء وعدد الصفقات والإيرادات",
    columns: [
      { key: "name", header: "الوكيل" },
      { key: "deals", header: "الصفقات" },
      { key: "revenue", header: "الإيرادات" },
      { key: "leads", header: "العملاء" },
      { key: "rating", header: "التقييم" },
    ],
  },
};

const FORMAT_OPTIONS: {
  value: ExportFormat;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    value: "csv",
    label: "CSV",
    icon: FileSpreadsheet,
    description: "ملف جداول بيانات (Excel)",
  },
  {
    value: "pdf",
    label: "PDF",
    icon: FileText,
    description: "مستند PDF للطباعة",
  },
];

const SCHEDULE_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: "none", label: "بدون جدولة" },
  { value: "daily", label: "يومياً" },
  { value: "weekly", label: "أسبوعياً" },
  { value: "monthly", label: "شهرياً" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  return {
    start: formatDate(thirtyDaysAgo),
    end: formatDate(now),
  };
}

function formatDisplayDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Preview Table ──────────────────────────────────────────────────────────

function PreviewTable({
  columns,
  rows,
  isLoading,
}: {
  columns: PreviewColumn[];
  rows: PreviewRow[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-8 bg-muted rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted/60 rounded" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          لا توجد بيانات للمعاينة. اختر نوع التقرير والفترة ثم انقر على معاينة.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-start text-xs font-bold text-muted-foreground whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-t border-border hover:bg-muted/30 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-3 py-2 text-sm text-foreground whitespace-nowrap"
                  >
                    {String(row[col.key] ?? "--")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 0 && (
        <div className="bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground text-center border-t border-border">
          معاينة أول {rows.length} سجل — سيتم تصدير جميع البيانات المطابقة
        </div>
      )}
    </div>
  );
}

// ─── Report Type Card ───────────────────────────────────────────────────────

function ReportTypeCard({
  type,
  config,
  isSelected,
  onClick,
}: {
  type: ReportType;
  config: ReportTypeConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all text-start w-full",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:border-primary/30 hover:bg-muted/30"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
          isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground truncate">
          {config.label}
        </p>
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {config.description}
        </p>
      </div>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ReportExportPanel({
  onExport,
  onSchedule,
  previewData = [],
  previewColumns,
  isExporting = false,
  isLoadingPreview = false,
  className,
}: ReportExportPanelProps) {
  const defaults = getDefaultDateRange();

  const [reportType, setReportType] = useState<ReportType>("leads");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [schedule, setSchedule] = useState<ScheduleFrequency>("none");
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const currentReportConfig = REPORT_TYPES[reportType];
  const columns = previewColumns ?? currentReportConfig.columns;

  const exportConfig: ExportConfig = useMemo(
    () => ({
      reportType,
      format,
      startDate,
      endDate,
    }),
    [reportType, format, startDate, endDate]
  );

  const handleExport = useCallback(() => {
    if (onExport) onExport(exportConfig);
  }, [exportConfig, onExport]);

  const handleSchedule = useCallback(() => {
    if (onSchedule) onSchedule({ ...exportConfig, frequency: schedule });
  }, [exportConfig, schedule, onSchedule]);

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="p-6 pb-3">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-primary" />
          تصدير التقارير
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-5">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            نوع التقرير
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.entries(REPORT_TYPES) as [ReportType, ReportTypeConfig][]).map(
              ([type, config]) => (
                <ReportTypeCard
                  key={type}
                  type={type}
                  config={config}
                  isSelected={reportType === type}
                  onClick={() => setReportType(type)}
                />
              )
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            الفترة الزمنية
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="export-start-date"
                className="text-xs text-muted-foreground mb-1 block"
              >
                من
              </label>
              <input
                id="export-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div>
              <label
                htmlFor="export-end-date"
                className="text-xs text-muted-foreground mb-1 block"
              >
                إلى
              </label>
              <input
                id="export-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {formatDisplayDate(startDate)} — {formatDisplayDate(endDate)}
          </p>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            صيغة التصدير
          </h4>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium flex-1",
                    format === opt.value
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "إخفاء المعاينة" : "معاينة البيانات"}
            {showPreview ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showPreview && (
            <div className="mt-3">
              <PreviewTable
                columns={columns}
                rows={previewData}
                isLoading={isLoadingPreview}
              />
            </div>
          )}
        </div>

        {/* Schedule Option */}
        {onSchedule && (
          <div>
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <CalendarClock className="h-4 w-4" />
              جدولة التصدير التلقائي
              {showSchedule ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showSchedule && (
              <div className="mt-3 space-y-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="space-y-1.5">
                  <label
                    htmlFor="schedule-frequency"
                    className="text-xs text-muted-foreground"
                  >
                    التكرار
                  </label>
                  <Select
                    value={schedule}
                    onValueChange={(v: string) =>
                      setSchedule(v as ScheduleFrequency)
                    }
                  >
                    <SelectTrigger id="schedule-frequency" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {schedule !== "none" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 w-full"
                    onClick={handleSchedule}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    حفظ الجدولة
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export Button */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              تصدير {currentReportConfig.label}
              <Badge variant="secondary" className="text-[10px] ms-1">
                {format.toUpperCase()}
              </Badge>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ReportExportPanel;
