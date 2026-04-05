/**
 * SarSymbol — Official Saudi Riyal currency symbol (SAMA 2025)
 *
 * Exact SVG paths from the Saudi Central Bank (SAMA) official download:
 * https://www.sama.gov.sa/ar-sa/Currency/Documents/Saudi_Riyal_Symbol-2.svg
 *
 * Reference: sama.gov.sa/en-US/Currency/SRS/Pages/Guidelines.aspx
 */

import { cn } from "@/lib/utils";

interface SarSymbolProps {
  className?: string;
  size?: number | string;
}

export function SarSymbol({ className, size = "1em" }: SarSymbolProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 1124.14 1256.39"
      fill="currentColor"
      className={cn("inline-block align-middle shrink-0", className)}
      aria-label="ريال سعودي"
      role="img"
    >
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z" />
      <path d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z" />
    </svg>
  );
}

/** Format a number with the SAMA Saudi Riyal SVG icon inline */
export function SarPrice({ value, className }: { value?: number | string | null; className?: string }) {
  if (value == null) return <span className={className}>—</span>;
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return <span className={className}>—</span>;
  const formatted = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {formatted}
      <SarSymbol size="0.75em" />
    </span>
  );
}
