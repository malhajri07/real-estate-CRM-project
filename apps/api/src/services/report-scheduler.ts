/**
 * report-scheduler.ts — Scheduled Report Delivery (Session 5.15)
 *
 * Cron-like service: email weekly/monthly reports to configured recipients.
 * Generates report data on schedule and stores for delivery.
 */

import { prisma } from "../../prismaClient";

export interface ScheduledReport {
  id: string;
  agentId: string;
  reportType: string;  // daily_summary, weekly_performance, monthly_revenue
  frequency: "daily" | "weekly" | "monthly";
  recipients: string[];  // email addresses
  lastRunAt?: Date;
  nextRunAt: Date;
  enabled: boolean;
}

/**
 * Generate a performance summary for an agent.
 */
export async function generateAgentSummary(agentId: string): Promise<{
  leadsCount: number;
  dealsCount: number;
  wonDeals: number;
  revenue: number;
  appointmentsCount: number;
  period: string;
}> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [leads, deals, wonDeals, revenue, appointments] = await Promise.all([
    prisma.leads.count({ where: { agentId, createdAt: { gte: weekAgo } } }),
    prisma.deals.count({ where: { agentId, createdAt: { gte: weekAgo } } }),
    prisma.deals.count({ where: { agentId, stage: "WON", wonAt: { gte: weekAgo } } }),
    prisma.deals.aggregate({
      where: { agentId, stage: "WON", wonAt: { gte: weekAgo } },
      _sum: { agreedPrice: true },
    }),
    prisma.appointments.count({ where: { agentId, scheduledAt: { gte: weekAgo } } }),
  ]);

  return {
    leadsCount: leads,
    dealsCount: deals,
    wonDeals,
    revenue: Number(revenue._sum.agreedPrice || 0),
    appointmentsCount: appointments,
    period: `${weekAgo.toLocaleDateString("ar-SA")} — ${now.toLocaleDateString("ar-SA")}`,
  };
}

/**
 * Format summary as Arabic text (for email/WhatsApp).
 */
export function formatSummaryText(summary: Awaited<ReturnType<typeof generateAgentSummary>>, agentName: string): string {
  return `📊 ملخص الأداء الأسبوعي — ${agentName}
الفترة: ${summary.period}

👥 عملاء جدد: ${summary.leadsCount}
📋 صفقات جديدة: ${summary.dealsCount}
✅ صفقات مكتملة: ${summary.wonDeals}
💰 الإيرادات: ${summary.revenue.toLocaleString()} ر.س
📅 المواعيد: ${summary.appointmentsCount}

— منصة عقاركم`;
}
