/**
 * useExport.ts - Data Export Hook
 *
 * Location: apps/web/src/ -> Hooks/ -> useExport.ts
 *
 * Handles exporting tabular data to CSV, JSON, or PDF.
 * Manages loading state, column selection, and triggers browser downloads.
 *
 * @example
 * const { exportCSV, exportJSON, isExporting } = useExport({
 *   data: rows,
 *   filename: 'leads',
 * });
 */

import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export type ExportFormat = "csv" | "json" | "pdf";

export interface ExportColumn {
  /** Key in the data object */
  key: string;
  /** Human-readable header label */
  label: string;
}

export interface UseExportOptions<T extends Record<string, unknown>> {
  /** Data rows to export */
  data: T[];
  /** Base filename without extension */
  filename?: string;
  /** Column definitions — if omitted, all keys from the first row are used */
  columns?: ExportColumn[];
}

export interface UseExportReturn {
  /** Whether an export is currently in progress */
  isExporting: boolean;
  /** Export data as CSV */
  exportCSV: (selectedColumns?: string[]) => void;
  /** Export data as JSON */
  exportJSON: (selectedColumns?: string[]) => void;
  /** Export data as PDF (prints a formatted table) */
  exportPDF: () => void;
  /** All available column keys derived from data or explicit columns */
  availableColumns: ExportColumn[];
}

/** Trigger a browser file download from a Blob. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** Escape a CSV cell value. */
function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Hook for exporting data to various formats.
 */
export function useExport<T extends Record<string, unknown>>({
  data,
  filename = "export",
  columns,
}: UseExportOptions<T>): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const availableColumns: ExportColumn[] =
    columns ??
    (data.length > 0
      ? Object.keys(data[0]).map((key) => ({ key, label: key }))
      : []);

  const filterColumns = useCallback(
    (selectedKeys?: string[]): ExportColumn[] => {
      if (!selectedKeys || selectedKeys.length === 0) return availableColumns;
      return availableColumns.filter((col) => selectedKeys.includes(col.key));
    },
    [availableColumns],
  );

  const exportCSV = useCallback(
    (selectedColumns?: string[]) => {
      if (data.length === 0) {
        toast({ variant: "destructive", title: "لا توجد بيانات للتصدير" });
        return;
      }

      setIsExporting(true);
      try {
        const cols = filterColumns(selectedColumns);
        const headerRow = cols.map((c) => escapeCSVCell(c.label)).join(",");
        const bodyRows = data.map((row) =>
          cols.map((c) => escapeCSVCell(row[c.key])).join(","),
        );
        const csvContent = [headerRow, ...bodyRows].join("\n");
        const blob = new Blob(["\uFEFF" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        downloadBlob(blob, `${filename}.csv`);
        toast({
          title: "تم التصدير بنجاح",
          description: `تم تصدير ${data.length} سجل إلى CSV`,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [data, filename, filterColumns],
  );

  const exportJSON = useCallback(
    (selectedColumns?: string[]) => {
      if (data.length === 0) {
        toast({ variant: "destructive", title: "لا توجد بيانات للتصدير" });
        return;
      }

      setIsExporting(true);
      try {
        const cols = filterColumns(selectedColumns);
        const keys = cols.map((c) => c.key);
        const filtered = data.map((row) => {
          const obj: Record<string, unknown> = {};
          for (const key of keys) {
            obj[key] = row[key];
          }
          return obj;
        });
        const jsonContent = JSON.stringify(filtered, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        downloadBlob(blob, `${filename}.json`);
        toast({
          title: "تم التصدير بنجاح",
          description: `تم تصدير ${data.length} سجل إلى JSON`,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [data, filename, filterColumns],
  );

  const exportPDF = useCallback(() => {
    if (data.length === 0) {
      toast({ variant: "destructive", title: "لا توجد بيانات للتصدير" });
      return;
    }

    setIsExporting(true);
    try {
      const cols = availableColumns;
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast({ variant: "destructive", title: "يرجى السماح بالنوافذ المنبثقة" });
        return;
      }

      const tableRows = data
        .map(
          (row) =>
            `<tr>${cols.map((c) => `<td style="border:1px solid #ddd;padding:6px 10px;font-size:12px;">${row[c.key] ?? ""}</td>`).join("")}</tr>`,
        )
        .join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head><meta charset="utf-8"><title>${filename}</title></head>
        <body style="font-family:system-ui,sans-serif;padding:20px;">
          <h2 style="margin-bottom:16px;">${filename}</h2>
          <table style="border-collapse:collapse;width:100%;">
            <thead>
              <tr>${cols.map((c) => `<th style="border:1px solid #ddd;padding:8px 10px;background:#f5f5f5;font-size:12px;text-align:start;">${c.label}</th>`).join("")}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <p style="margin-top:16px;font-size:11px;color:#888;">تم التصدير في ${new Date().toLocaleString("ar-SA")}</p>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${data.length} سجل إلى PDF`,
      });
    } finally {
      setIsExporting(false);
    }
  }, [data, filename, availableColumns]);

  return {
    isExporting,
    exportCSV,
    exportJSON,
    exportPDF,
    availableColumns,
  };
}
