/**
 * routes/custom-reports.ts — Dynamic report builder.
 *
 * Mounted at `/api/custom-reports`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | /dimensions | Yes | List available dimensions / fields |
 * | POST | /query | Yes | Run a custom report with chosen dimensions, metrics, and filters |
 * | GET | /saved | Yes | List saved report configurations |
 * | POST | /saved | Yes | Save a report configuration |
 *
 * Consumer: reports builder page — query key `custom-reports`.
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

const reportSchema = z.object({
  entity: z.enum(["leads", "deals", "properties", "appointments", "campaigns"]),
  groupBy: z.enum(["city", "status", "stage", "source", "type", "agent", "month", "week"]).optional(),
  metric: z.enum(["count", "sum_price", "sum_commission", "avg_price", "conversion_rate"]).default("count"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  filters: z.record(z.string()).optional(),
});

// POST /api/reports/custom — Run a custom report
/**
 * Create a new custom record.
 *
 * @route   POST /api/custom-reports/custom
 * @auth    Required — any authenticated user
 */
router.post("/custom", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = reportSchema.parse(req.body);

    const orgFilter: any = user.organizationId
      ? { organizationId: user.organizationId }
      : { agentId: user.id };

    const dateFilter: any = {};
    if (data.dateFrom) dateFilter.gte = new Date(data.dateFrom);
    if (data.dateTo) dateFilter.lte = new Date(data.dateTo);
    const hasDateFilter = data.dateFrom || data.dateTo;

    let result: any;

    switch (data.entity) {
      case "leads": {
        const where: any = { ...orgFilter, ...(hasDateFilter && { createdAt: dateFilter }) };
        if (data.filters?.status) where.status = data.filters.status;

        if (data.groupBy === "status") {
          result = await prisma.leads.groupBy({ by: ["status"], where, _count: true });
          result = result.map((r: any) => ({ label: r.status, value: r._count }));
        } else if (data.groupBy === "source") {
          result = await prisma.leads.groupBy({ by: ["source"], where, _count: true });
          result = result.map((r: any) => ({ label: r.source || "غير محدد", value: r._count }));
        } else {
          const count = await prisma.leads.count({ where });
          result = [{ label: "إجمالي العملاء", value: count }];
        }
        break;
      }

      case "deals": {
        const where: any = { ...orgFilter, ...(hasDateFilter && { createdAt: dateFilter }) };
        if (data.filters?.stage) where.stage = data.filters.stage;

        if (data.groupBy === "stage") {
          result = await prisma.deals.groupBy({ by: ["stage"], where, _count: true });
          result = result.map((r: any) => ({ label: r.stage, value: r._count }));
        } else if (data.groupBy === "agent") {
          const grouped = await prisma.deals.groupBy({ by: ["agentId"], where, _count: true, _sum: { agreedPrice: true } });
          const agentIds = grouped.map((g: any) => g.agentId).filter(Boolean);
          const agents = await prisma.users.findMany({ where: { id: { in: agentIds } }, select: { id: true, firstName: true, lastName: true } });
          const agentMap = Object.fromEntries(agents.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));
          result = grouped.map((r: any) => ({
            label: agentMap[r.agentId] || "غير معين",
            value: data.metric === "sum_price" ? Number(r._sum.agreedPrice || 0) : r._count,
          }));
        } else if (data.groupBy === "month") {
          const deals = await prisma.deals.findMany({ where, select: { createdAt: true, agreedPrice: true } });
          const byMonth: Record<string, { count: number; sum: number }> = {};
          deals.forEach((d: any) => {
            const key = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(2, "0")}`;
            if (!byMonth[key]) byMonth[key] = { count: 0, sum: 0 };
            byMonth[key].count++;
            byMonth[key].sum += Number(d.agreedPrice || 0);
          });
          result = Object.entries(byMonth).sort().map(([k, v]) => ({
            label: k,
            value: data.metric === "sum_price" ? v.sum : v.count,
          }));
        } else {
          if (data.metric === "sum_price") {
            const agg = await prisma.deals.aggregate({ where, _sum: { agreedPrice: true } });
            result = [{ label: "إجمالي قيمة الصفقات", value: Number(agg._sum.agreedPrice || 0) }];
          } else if (data.metric === "conversion_rate") {
            const [total, won] = await Promise.all([
              prisma.deals.count({ where }),
              prisma.deals.count({ where: { ...where, stage: "WON" } }),
            ]);
            result = [{ label: "معدل التحويل", value: total > 0 ? Math.round((won / total) * 100) : 0, suffix: "%" }];
          } else {
            const count = await prisma.deals.count({ where });
            result = [{ label: "إجمالي الصفقات", value: count }];
          }
        }
        break;
      }

      case "properties": {
        const where: any = {};
        if (user.organizationId) where.organizationId = user.organizationId;
        if (hasDateFilter) where.createdAt = dateFilter;
        if (data.filters?.city) where.city = data.filters.city;

        if (data.groupBy === "city") {
          result = await prisma.properties.groupBy({ by: ["city"], where, _count: true });
          result = result.map((r: any) => ({ label: r.city || "غير محدد", value: r._count }));
        } else if (data.groupBy === "type") {
          result = await prisma.properties.groupBy({ by: ["type"], where, _count: true });
          result = result.map((r: any) => ({ label: r.type || "غير محدد", value: r._count }));
        } else if (data.groupBy === "status") {
          result = await prisma.properties.groupBy({ by: ["status"], where, _count: true });
          result = result.map((r: any) => ({ label: r.status || "غير محدد", value: r._count }));
        } else {
          const count = await prisma.properties.count({ where });
          result = [{ label: "إجمالي العقارات", value: count }];
        }
        break;
      }

      default:
        result = [];
    }

    res.json({ entity: data.entity, groupBy: data.groupBy, metric: data.metric, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "بيانات غير صالحة", errors: error.errors });
    console.error("Custom report error:", error);
    res.status(500).json({ message: "فشل إنشاء التقرير" });
  }
});

// GET /api/reports/saved — List saved custom reports
/**
 * List saved with optional filters.
 *
 * @route   GET /api/custom-reports/saved
 * @auth    Required — any authenticated user
 */
router.get("/saved", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const logs = await prisma.audit_logs.findMany({
      where: { userId: user.id, action: "SAVED_REPORT" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const reports = logs.map((l) => {
      const config = l.afterJson ? JSON.parse(l.afterJson) : {};
      return { id: l.id, name: config.name || "تقرير", config, createdAt: l.createdAt };
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "فشل تحميل التقارير المحفوظة" });
  }
});

// POST /api/reports/saved — Save a custom report config
/**
 * Create a new saved record.
 *
 * @route   POST /api/custom-reports/saved
 * @auth    Required — any authenticated user
 */
router.post("/saved", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, config } = req.body;

    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: "SAVED_REPORT",
        entity: "report",
        entityId: `rpt-${Date.now()}`,
        afterJson: JSON.stringify({ name, ...config }),
      },
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "فشل حفظ التقرير" });
  }
});

/**
 * @route POST /api/custom-reports/schedule
 * @auth  Required
 * @param req.body.reportConfig - Saved report config JSON.
 * @param req.body.frequency - "weekly" | "monthly".
 * @param req.body.email - Recipient email.
 * @returns `{ success, message }`.
 *   Consumer: "Schedule" option in report builder (E19). Placeholder — actual email
 *   delivery requires a cron job integration.
 */
router.post("/schedule", authenticateToken, async (req, res) => {
  try {
    const { reportConfig, frequency, email } = req.body;
    if (!reportConfig || !frequency || !email) {
      return res.status(400).json({ message: "reportConfig, frequency, email required" });
    }
    // TODO: Store schedule in a dedicated table + cron job. For now, acknowledge the request.
    res.json({ success: true, message: `سيتم إرسال التقرير ${frequency === "weekly" ? "أسبوعيا" : "شهريا"} إلى ${email}` });
  } catch (error) {
    res.status(500).json({ message: "فشل جدولة التقرير" });
  }
});

export default router;
