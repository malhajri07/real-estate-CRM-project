/**
 * ExportButton.tsx - Export Functionality Component
 *
 * Location: apps/web/src/ -> Components/ -> export/ -> ExportButton.tsx
 *
 * Dropdown button for exporting data in multiple formats (CSV, JSON, PDF).
 * Extends the patterns from AdminExport with additional features:
 * - Column selection dialog
 * - Date range for scoped exports
 * - Loading state during export
 * - Configurable formats
 *
 * Dependencies:
 * - @/hooks/useExport
 * - @/components/ui/* (Button, DropdownMenu, Dialog, Checkbox, Label)
 * - lucide-react icons
 */

import React, { useState, useCallback } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileImage,
  Loader2,
  Check,
  Columns3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/lib/utils";
import { useExport, type ExportColumn, type ExportFormat } from "@/hooks/useExport";
import type { DateRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportButtonProps<T extends Record<string, unknown>> {
  /** Data to export */
  data: T[];
  /** Filename without extension */
  filename?: string;
  /** Available export formats (default: csv, json, pdf) */
  formats?: ExportFormat[];
  /** Explicit column definitions */
  columns?: ExportColumn[];
  /** Show column selection dialog before CSV export */
  showColumnSelector?: boolean;
  /** Show date range filter for export scope */
  showDateRange?: boolean;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Label text */
  label?: string;
  /** Hide label (icon only) */
  iconOnly?: boolean;
  /** Additional className */
  className?: string;
  /** Called before export starts - return false to cancel */
  onBeforeExport?: (format: ExportFormat) => boolean | void;
  /** Called after export completes */
  onAfterExport?: (format: ExportFormat) => void;
}

// ---------------------------------------------------------------------------
// Format config
// ---------------------------------------------------------------------------

interface FormatConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const FORMAT_CONFIGS: Record<ExportFormat, FormatConfig> = {
  csv: {
    icon: FileSpreadsheet,
    label: "CSV",
    description: "ملف جدول بيانات",
  },
  json: {
    icon: FileText,
    label: "JSON",
    description: "ملف بيانات منظم",
  },
  pdf: {
    icon: FileImage,
    label: "PDF",
    description: "ملف قابل للطباعة",
  },
};

// ---------------------------------------------------------------------------
// Column Selector Dialog
// ---------------------------------------------------------------------------

function ColumnSelectorDialog({
  open,
  onOpenChange,
  columns,
  selectedColumns,
  onSelectedColumnsChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ExportColumn[];
  selectedColumns: string[];
  onSelectedColumnsChange: (cols: string[]) => void;
  onConfirm: () => void;
}) {
  const toggleColumn = (key: string) => {
    if (selectedColumns.includes(key)) {
      onSelectedColumnsChange(selectedColumns.filter((k) => k !== key));
    } else {
      onSelectedColumnsChange([...selectedColumns, key]);
    }
  };

  const toggleAll = () => {
    if (selectedColumns.length === columns.length) {
      onSelectedColumnsChange([]);
    } else {
      onSelectedColumnsChange(columns.map((c) => c.key));
    }
  };

  const allSelected = selectedColumns.length === columns.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>اختر الأعمدة للتصدير</DialogTitle>
          <DialogDescription>
            حدد الأعمدة التي تريد تضمينها في ملف التصدير.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto py-2">
          {/* Select all */}
          <label className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-semibold">تحديد الكل</span>
          </label>

          <div className="h-px bg-border" />

          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={selectedColumns.includes(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
              />
              <span className="text-sm">{col.label}</span>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={selectedColumns.length === 0}
          >
            <Download className="h-4 w-4 ms-1.5" />
            تصدير ({selectedColumns.length} عمود)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ExportButton<T extends Record<string, unknown>>({
  data,
  filename = "export",
  formats = ["csv", "json", "pdf"],
  columns,
  showColumnSelector = false,
  showDateRange = false,
  variant = "outline",
  size = "sm",
  label = "تصدير",
  iconOnly = false,
  className,
  onBeforeExport,
  onAfterExport,
}: ExportButtonProps<T>) {
  const { isExporting, exportCSV, exportJSON, exportPDF, availableColumns } =
    useExport({ data, filename, columns });

  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns.map((c) => c.key),
  );
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (onBeforeExport) {
        const result = onBeforeExport(format);
        if (result === false) return;
      }

      // If column selector is needed for CSV
      if (format === "csv" && showColumnSelector) {
        setPendingFormat("csv");
        setShowColumnDialog(true);
        return;
      }

      switch (format) {
        case "csv":
          exportCSV();
          break;
        case "json":
          exportJSON();
          break;
        case "pdf":
          exportPDF();
          break;
      }

      onAfterExport?.(format);
    },
    [onBeforeExport, onAfterExport, exportCSV, exportJSON, exportPDF, showColumnSelector],
  );

  const handleColumnSelectConfirm = useCallback(() => {
    setShowColumnDialog(false);
    if (pendingFormat === "csv") {
      exportCSV(selectedColumns);
      onAfterExport?.("csv");
    }
    setPendingFormat(null);
  }, [pendingFormat, selectedColumns, exportCSV, onAfterExport]);

  const hasData = data.length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={!hasData || isExporting}
            className={cn("gap-1.5", className)}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {!iconOnly && <span>{label}</span>}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* Optional date range */}
          {showDateRange && (
            <>
              <div className="px-2 py-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  نطاق التاريخ
                </Label>
                <DateRangePicker
                  value={dateRange}
                  onValueChange={setDateRange}
                  placeholder="اختر فترة"
                  className="w-full"
                />
              </div>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Format options */}
          {formats.map((format) => {
            const config = FORMAT_CONFIGS[format];
            if (!config) return null;
            const FormatIcon = config.icon;

            return (
              <DropdownMenuItem
                key={format}
                onClick={() => handleExport(format)}
                className="gap-3 py-2.5"
              >
                <FormatIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">تصدير كملف {config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </DropdownMenuItem>
            );
          })}

          {/* Column selector shortcut */}
          {showColumnSelector && formats.includes("csv") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setPendingFormat("csv");
                  setShowColumnDialog(true);
                }}
                className="gap-3 py-2.5"
              >
                <Columns3 className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">CSV مع اختيار الأعمدة</p>
                  <p className="text-xs text-muted-foreground">حدد الأعمدة المطلوبة</p>
                </div>
              </DropdownMenuItem>
            </>
          )}

          {/* Data count */}
          <DropdownMenuSeparator />
          <div className="px-3 py-2 text-xs text-muted-foreground text-center">
            {data.length} سجل متاح للتصدير
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column selector dialog */}
      <ColumnSelectorDialog
        open={showColumnDialog}
        onOpenChange={setShowColumnDialog}
        columns={availableColumns}
        selectedColumns={selectedColumns}
        onSelectedColumnsChange={setSelectedColumns}
        onConfirm={handleColumnSelectConfirm}
      />
    </>
  );
}

export default ExportButton;
