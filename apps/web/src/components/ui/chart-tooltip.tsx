/**
 * ChartTooltip — Unified tooltip for all recharts charts
 */
import { CHART_TOOLTIP_CLASSES } from "@/config/design-tokens";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
  formatter?: (value: number) => string;
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={CHART_TOOLTIP_CLASSES}>
      {label && <p className="font-medium mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <ColorDot color={entry.color} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ColorDot({ color }: { color?: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color || "currentColor" }}
    />
  );
}
