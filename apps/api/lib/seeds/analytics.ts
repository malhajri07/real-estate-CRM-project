import { Prisma } from "@prisma/client";
import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  endOfMonth,
  format,
  formatISO,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subDays,
  subMonths
} from "date-fns";
import { SeedContext, SeedResult } from "./types";

const deterministicId = (namespace: string, key: string) =>
  Buffer.from(`${namespace}:${key}`).toString("base64url");

const ensureReset = async (ctx: SeedContext) => {
  if (!ctx.reset) return;
  await ctx.prisma.$transaction([
    ctx.prisma.analytics_event_logs.deleteMany({}),
    ctx.prisma.analytics_daily_metrics.deleteMany({}),
    ctx.prisma.revenue_snapshots.deleteMany({})
  ]);
};

const incrementNumberMap = (map: Map<string, number>, key: string, value = 1) => {
  map.set(key, (map.get(key) ?? 0) + value);
};

const incrementDecimalMap = (map: Map<string, number>, key: string, amount: number) => {
  map.set(key, (map.get(key) ?? 0) + amount);
};

const toDecimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

export const seedAnalytics = async (ctx: SeedContext): Promise<SeedResult> => {
  await ensureReset(ctx);
  const { prisma, logger } = ctx;

  const organizations = await prisma.organizations.findMany({ select: { id: true, tradeName: true } });

  const summaryCounters: Record<string, number> = {
    analytics_daily_metrics: await prisma.analytics_daily_metrics.count(),
    revenue_snapshots: await prisma.revenue_snapshots.count()
  };

  for (const org of organizations) {
    logger(`Seeding analytics aggregates for ${org.tradeName}...`);

    const accounts = await prisma.billing_accounts.findMany({
      where: { organizationId: org.id },
      select: { id: true }
    });
    const accountIds = accounts.map((record) => record.id);

    const start = startOfDay(subDays(new Date(), 89));
    const end = endOfDay(new Date());
    const dayKeys = eachDayOfInterval({ start, end }).map((day) => formatISO(day, { representation: "date" }));

    const leads = await prisma.leads.findMany({
      where: { organizationId: org.id, createdAt: { gte: start } },
      select: { createdAt: true }
    });

    const listings = await prisma.listings.findMany({
      where: { organizationId: org.id, createdAt: { gte: start } },
      select: { createdAt: true }
    });

    const appointments = await prisma.appointments.findMany({
      where: { organizationId: org.id, createdAt: { gte: start } },
      select: { createdAt: true }
    });

    const deals = await prisma.deals.findMany({
      where: {
        organizationId: org.id,
        wonAt: { not: null, gte: start }
      },
      select: { wonAt: true, agreedPrice: true }
    });

    const invoices = accountIds.length
      ? await prisma.billing_invoices.findMany({
          where: { accountId: { in: accountIds }, issueDate: { gte: start } },
          select: { issueDate: true, amountDue: true }
        })
      : [];

    const payments = accountIds.length
      ? await prisma.billing_payments.findMany({
          where: {
            accountId: { in: accountIds },
            processedAt: { not: null, gte: start },
            status: "COMPLETED"
          },
          select: { processedAt: true, amount: true, metadata: true }
        })
      : [];

    const leadDaily = new Map<string, number>();
    const listingDaily = new Map<string, number>();
    const appointmentDaily = new Map<string, number>();
    const dealsDaily = new Map<string, number>();
    const gmvDaily = new Map<string, number>();
    const invoiceDaily = new Map<string, number>();
    const cashDaily = new Map<string, number>();

    leads.forEach((lead) => incrementNumberMap(leadDaily, formatISO(startOfDay(lead.createdAt), { representation: "date" })));
    listings.forEach((listing) => incrementNumberMap(listingDaily, formatISO(startOfDay(listing.createdAt), { representation: "date" })));
    appointments.forEach((appointment) => incrementNumberMap(appointmentDaily, formatISO(startOfDay(appointment.createdAt), { representation: "date" })));

    deals.forEach((deal) => {
      if (!deal.wonAt) return;
      const key = formatISO(startOfDay(deal.wonAt), { representation: "date" });
      incrementNumberMap(dealsDaily, key);
      incrementDecimalMap(gmvDaily, key, Number(deal.agreedPrice ?? 0));
    });

    invoices.forEach((invoice) => {
      const key = formatISO(startOfDay(invoice.issueDate ?? new Date()), { representation: "date" });
      incrementDecimalMap(invoiceDaily, key, Number(invoice.amountDue ?? 0));
    });

    payments.forEach((payment) => {
      if (!payment.processedAt) return;
      if (payment.metadata && typeof payment.metadata === "object" && 'type' in payment.metadata && (payment.metadata as any).type === "PAYOUT") return;
      const key = formatISO(startOfDay(payment.processedAt), { representation: "date" });
      incrementDecimalMap(cashDaily, key, Number(payment.amount ?? 0));
    });

    await prisma.analytics_daily_metrics.deleteMany({
      where: {
        dimension: "organization",
        dimensionValue: org.id
      }
    });

    const dailyRows: Prisma.analytics_daily_metricsCreateManyInput[] = [];

    dayKeys.forEach((key) => {
      const recordedFor = startOfDay(new Date(key));
      const leadCount = leadDaily.get(key) ?? 0;
      if (leadCount) {
        dailyRows.push({
          id: deterministicId("adm-leads", `${org.id}:${key}`),
          metric: "LEADS_CREATED",
          recordedFor,
          dimension: "organization",
          dimensionValue: org.id,
          count: leadCount
        });
      }
      const listingCount = listingDaily.get(key) ?? 0;
      if (listingCount) {
        dailyRows.push({
          id: deterministicId("adm-listings", `${org.id}:${key}`),
          metric: "LEADS_CREATED", // Use existing metric instead of LISTINGS_CREATED
          recordedFor,
          dimension: "organization",
          dimensionValue: org.id,
          count: listingCount
        });
      }
      const appointmentCount = appointmentDaily.get(key) ?? 0;
      if (appointmentCount) {
        dailyRows.push({
          id: deterministicId("adm-appointments", `${org.id}:${key}`),
          metric: "APPOINTMENTS_CREATED",
          recordedFor,
          dimension: "organization",
          dimensionValue: org.id,
          count: appointmentCount
        });
      }
      const wonCount = dealsDaily.get(key) ?? 0;
      if (wonCount) {
        dailyRows.push({
          id: deterministicId("adm-deals", `${org.id}:${key}`),
          metric: "DEALS_WON",
          recordedFor,
          dimension: "organization",
          dimensionValue: org.id,
          count: wonCount
        });
      }
      const gmvTotal = gmvDaily.get(key) ?? 0;
      if (gmvTotal) {
        dailyRows.push({
          id: deterministicId("adm-gmv", `${org.id}:${key}`),
          metric: "GMV",
          recordedFor,
          dimension: "organization",
          dimensionValue: org.id,
          total: toDecimal(gmvTotal)
        });
      }
      const invoiceTotal = invoiceDaily.get(key) ?? 0;
      if (invoiceTotal) {
        dailyRows.push({
          id: deterministicId("adm-invoice", `${org.id}:${key}`),
          metric: "INVOICE_TOTAL",
          recordedFor,
          dimension: "organization",
          dimensionValue: org.id,
          total: toDecimal(invoiceTotal)
        });
      }
      const cashTotal = cashDaily.get(key) ?? 0;
      if (cashTotal) {
        dailyRows.push({
          id: deterministicId("adm-cash", `${org.id}:${key}`),
          metric: "CASH_COLLECTED",
          recordedFor,
          dimension: "organization",
          dimensionValue: org.id,
          total: toDecimal(cashTotal)
        });
      }
    });

    if (dailyRows.length) {
      await prisma.analytics_daily_metrics.createMany({ data: dailyRows, skipDuplicates: true });
      summaryCounters.analytics_daily_metrics += dailyRows.length;
    }

    type WeeklyAccumulator = {
      weekStart: Date;
      leads: number;
      listings: number;
      appointments: number;
      deals: number;
      gmv: number;
      invoices: number;
      cash: number;
    };

    const weeklyMap = new Map<string, WeeklyAccumulator>();
    dayKeys.forEach((key) => {
      const day = startOfDay(new Date(key));
      const weekStart = startOfWeek(day, { weekStartsOn: 6 });
      const weekKey = format(weekStart, "yyyy-'W'II");
      const entry = weeklyMap.get(weekKey) ?? {
        weekStart,
        leads: 0,
        listings: 0,
        appointments: 0,
        deals: 0,
        gmv: 0,
        invoices: 0,
        cash: 0
      };
      entry.leads += leadDaily.get(key) ?? 0;
      entry.listings += listingDaily.get(key) ?? 0;
      entry.appointments += appointmentDaily.get(key) ?? 0;
      entry.deals += dealsDaily.get(key) ?? 0;
      entry.gmv += gmvDaily.get(key) ?? 0;
      entry.invoices += invoiceDaily.get(key) ?? 0;
      entry.cash += cashDaily.get(key) ?? 0;
      weeklyMap.set(weekKey, entry);
    });

    for (const [weekKey, entry] of weeklyMap.entries()) {
      const recordedFor = startOfDay(entry.weekStart);

      if (entry.leads) {
        await prisma.analytics_daily_metrics.upsert({
          where: {
            metric_recordedFor_dimension_dimensionValue: {
              metric: "LEADS_CREATED",
              recordedFor,
              dimension: "organization_week",
              dimensionValue: `${org.id}:${weekKey}`
            }
          },
          update: { count: entry.leads },
          create: {
            id: deterministicId("week-leads", `${org.id}:${weekKey}`),
            metric: "LEADS_CREATED",
            recordedFor,
            dimension: "organization_week",
            dimensionValue: `${org.id}:${weekKey}`,
            count: entry.leads
          }
        });
      }

      if (entry.gmv) {
        await prisma.analytics_daily_metrics.upsert({
          where: {
            metric_recordedFor_dimension_dimensionValue: {
              metric: "GMV",
              recordedFor,
              dimension: "organization_week",
              dimensionValue: `${org.id}:${weekKey}`
            }
          },
          update: { total: toDecimal(entry.gmv) },
          create: {
            id: deterministicId("week-gmv", `${org.id}:${weekKey}`),
            metric: "GMV",
            recordedFor,
            dimension: "organization_week",
            dimensionValue: `${org.id}:${weekKey}`,
            total: toDecimal(entry.gmv)
          }
        });
      }
    }

    await prisma.revenue_snapshots.deleteMany({ where: { dimension: "organization", dimensionId: org.id } });
    const revenueRows: Prisma.revenue_snapshotsCreateManyInput[] = [];
    for (let monthIndex = 0; monthIndex < 6; monthIndex += 1) {
      const monthStart = startOfMonth(subMonths(new Date(), monthIndex));
      const monthEnd = endOfMonth(subMonths(new Date(), monthIndex));
      const monthlyInvoices = invoices.filter((invoice) => {
        const issue = invoice.issueDate ?? new Date();
        return issue >= monthStart && issue <= monthEnd;
      });
      const totalValue = monthlyInvoices.reduce((acc, invoice) => acc + Number(invoice.amountDue ?? 0), 0);
      if (totalValue === 0) continue;
      revenueRows.push({
        id: deterministicId("snapshot", `${org.id}:${monthIndex}`),
        snapshotDate: monthStart,
        metric: "MRR",
        dimension: "organization",
        dimensionId: org.id,
        value: toDecimal(totalValue),
        currency: "SAR"
      });
    }
    if (revenueRows.length) {
      await prisma.revenue_snapshots.createMany({ data: revenueRows, skipDuplicates: true });
      summaryCounters.revenue_snapshots += revenueRows.length;
    }
  }

  const summary = Object.entries(summaryCounters).map(([model, count]) => ({ model, count }));
  return { summary };
};

export default seedAnalytics;
