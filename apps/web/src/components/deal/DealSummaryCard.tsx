/**
 * DealSummaryCard.tsx — Deal Sidebar Summary Component
 *
 * Location: apps/web/src/components/deal/DealSummaryCard.tsx
 *
 * Features:
 * - Customer info with avatar and contact
 * - Property link with address
 * - Current deal value formatted in SAR
 * - Expected close date with days remaining
 * - Days in current stage calculation
 * - Win probability meter
 * - Quick action buttons (edit, call, email)
 *
 * Dependencies:
 * - @/components/ui/card
 * - @/components/ui/button
 * - @/components/ui/badge
 * - lucide-react icons
 * - @/lib/utils (cn)
 */

import React, { useMemo } from "react";
import {
  User,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  TrendingUp,
  Phone,
  Mail,
  Pencil,
  ExternalLink,
  MapPin,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DealCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  company?: string;
}

export interface DealProperty {
  id: string;
  title: string;
  address?: string;
  city?: string;
  type?: string;
  price?: number;
}

export interface DealSummaryData {
  id: string;
  customer?: DealCustomer;
  property?: DealProperty;
  value?: number;
  expectedCloseDate?: string;
  currentStage: string;
  stageEnteredAt?: string;
  winProbability?: number;
  commission?: number;
  source?: string;
}

export interface DealSummaryCardProps {
  deal: DealSummaryData;
  onEdit?: () => void;
  onCallCustomer?: () => void;
  onEmailCustomer?: () => void;
  onViewProperty?: (propertyId: string) => void;
  className?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSAR(value?: number): string {
  if (value === undefined || value === null) return "غير محدد";
  return `${value.toLocaleString("ar-SA")}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "غير محدد";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function computeDaysRemaining(expectedClose?: string): {
  days: number;
  label: string;
  isOverdue: boolean;
} {
  if (!expectedClose) return { days: 0, label: "غير محدد", isOverdue: false };
  try {
    const diff = new Date(expectedClose).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0)
      return {
        days: Math.abs(days),
        label: `متأخر بـ ${Math.abs(days)} يوم`,
        isOverdue: true,
      };
    if (days === 0) return { days: 0, label: "اليوم", isOverdue: false };
    if (days === 1) return { days: 1, label: "غداً", isOverdue: false };
    return { days, label: `${days} يوم متبقي`, isOverdue: false };
  } catch {
    return { days: 0, label: "غير محدد", isOverdue: false };
  }
}

function computeDaysInStage(stageEnteredAt?: string): number {
  if (!stageEnteredAt) return 0;
  try {
    const diff = Date.now() - new Date(stageEnteredAt).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

function formatDaysInStage(days: number): string {
  if (days === 0) return "أقل من يوم";
  if (days === 1) return "يوم واحد";
  if (days <= 10) return `${days} أيام`;
  return `${days} يوم`;
}

const STAGE_LABELS: Record<string, string> = {
  PROSPECTING: "استكشاف",
  prospecting: "استكشاف",
  QUALIFICATION: "تأهيل",
  qualification: "تأهيل",
  PROPOSAL: "عرض",
  proposal: "عرض",
  NEGOTIATION: "تفاوض",
  negotiation: "تفاوض",
  CLOSING: "إغلاق",
  closing: "إغلاق",
  CLOSED_WON: "مكسب",
  CLOSED_LOST: "خسارة",
};

function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

function getCustomerInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Probability Meter ──────────────────────────────────────────────────────

function ProbabilityMeter({ probability }: { probability: number }) {
  const clamped = Math.min(100, Math.max(0, probability));
  const color =
    clamped >= 70
      ? "bg-primary/100"
      : clamped >= 40
        ? "bg-[hsl(var(--warning)/0.1)]0"
        : "bg-destructive/100";
  const textColor =
    clamped >= 70
      ? "text-primary"
      : clamped >= 40
        ? "text-[hsl(var(--warning))]"
        : "text-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          احتمالية الفوز
        </span>
        <span className={cn("text-sm font-bold", textColor)}>{clamped}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            color
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ─── Info Row ───────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={cn("text-sm font-bold text-foreground", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DealSummaryCard({
  deal,
  onEdit,
  onCallCustomer,
  onEmailCustomer,
  onViewProperty,
  className,
}: DealSummaryCardProps) {
  const daysInStage = useMemo(
    () => computeDaysInStage(deal.stageEnteredAt),
    [deal.stageEnteredAt]
  );
  const closeDateInfo = useMemo(
    () => computeDaysRemaining(deal.expectedCloseDate),
    [deal.expectedCloseDate]
  );

  return (
    <Card className={cn("rounded-2xl shadow-sm", className)}>
      <CardHeader className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            ملخص الصفقة
          </CardTitle>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-5">
        {/* Customer Section */}
        {deal.customer && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              العميل
            </h4>
            <div className="flex items-center gap-3">
              {deal.customer.avatarUrl ? (
                <img
                  src={deal.customer.avatarUrl}
                  alt={deal.customer.name}
                  className="h-10 w-10 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {getCustomerInitials(deal.customer.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground truncate">
                  {deal.customer.name}
                </p>
                {deal.customer.company && (
                  <p className="text-xs text-muted-foreground truncate">
                    {deal.customer.company}
                  </p>
                )}
              </div>
            </div>

            {/* Quick contact actions */}
            <div className="flex gap-2">
              {deal.customer.phone && onCallCustomer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={onCallCustomer}
                >
                  <Phone className="h-3.5 w-3.5" />
                  اتصال
                </Button>
              )}
              {deal.customer.email && onEmailCustomer && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={onEmailCustomer}
                >
                  <Mail className="h-3.5 w-3.5" />
                  بريد
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Property Section */}
        {deal.property && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              العقار
            </h4>
            <div
              className={cn(
                "rounded-xl border border-border p-3 space-y-1",
                onViewProperty && "cursor-pointer hover:bg-muted/30 transition-colors"
              )}
              onClick={
                onViewProperty
                  ? () => onViewProperty(deal.property!.id)
                  : undefined
              }
              role={onViewProperty ? "button" : undefined}
              tabIndex={onViewProperty ? 0 : undefined}
              onKeyDown={
                onViewProperty
                  ? (e) =>
                      e.key === "Enter" && onViewProperty(deal.property!.id)
                  : undefined
              }
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground truncate flex-1">
                  {deal.property.title}
                </p>
                {onViewProperty && (
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </div>
              {deal.property.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {deal.property.address}
                  {deal.property.city && ` - ${deal.property.city}`}
                </p>
              )}
              {deal.property.type && (
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {deal.property.type}
                </Badge>
              )}
              {deal.property.price !== undefined && (
                <p className="text-xs font-bold text-primary mt-0.5">
                  {formatSAR(deal.property.price)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Deal Details */}
        <div className="space-y-0">
          <InfoRow
            icon={DollarSign}
            label="قيمة الصفقة"
            value={formatSAR(deal.value)}
            valueClassName="text-primary"
          />
          <InfoRow
            icon={Building2}
            label="المرحلة الحالية"
            value={getStageLabel(deal.currentStage)}
          />
          <InfoRow
            icon={Timer}
            label="أيام في المرحلة"
            value={formatDaysInStage(daysInStage)}
          />
          <InfoRow
            icon={Calendar}
            label="تاريخ الإغلاق المتوقع"
            value={formatDate(deal.expectedCloseDate)}
          />
          <InfoRow
            icon={Clock}
            label="الوقت المتبقي"
            value={closeDateInfo.label}
            valueClassName={closeDateInfo.isOverdue ? "text-destructive" : undefined}
          />
          {deal.commission !== undefined && (
            <InfoRow
              icon={TrendingUp}
              label="العمولة"
              value={`${deal.commission}%`}
            />
          )}
          {deal.source && (
            <InfoRow icon={User} label="المصدر" value={deal.source} />
          )}
        </div>

        {/* Win Probability */}
        {deal.winProbability !== undefined && (
          <ProbabilityMeter probability={deal.winProbability} />
        )}
      </CardContent>
    </Card>
  );
}

export default DealSummaryCard;
