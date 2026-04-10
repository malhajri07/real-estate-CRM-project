/**
 * routes/client-portal.ts — Read-only buyer/seller client portal API.
 *
 * Mounted at `/api/client`.
 *
 * | Method | Path | Auth? | Purpose |
 * |--------|------|-------|---------|
 * | GET | /dashboard | Yes | Client's active deals + upcoming appointments |
 * | GET | /deals | Yes | List client's deals |
 * | GET | /deals/:id | Yes | Deal detail with linked documents |
 * | GET | /documents | Yes | List documents shared with the client |
 *
 * Consumer: client portal page; authenticated via OTP (same token flow as agents).
 */

import { Router } from "express";
import { prisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// GET /api/client/dashboard — Client's deals + upcoming appointments
router.get("/dashboard", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Find customer records linked to this user's phone/email
    const customers = await prisma.customers.findMany({
      where: {
        OR: [
          ...(user.phone ? [{ phone: user.phone }] : []),
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
      select: { id: true },
    });

    const customerIds = customers.map((c) => c.id);

    if (customerIds.length === 0) {
      return res.json({ deals: [], appointments: [], properties: [] });
    }

    const [deals, appointments] = await Promise.all([
      prisma.deals.findMany({
        where: { customerId: { in: customerIds } },
        include: {
          property: { select: { id: true, title: true, city: true, district: true, type: true, price: true, photos: true } },
          listing: { select: { id: true, listingType: true, price: true } },
          agent: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.appointments.findMany({
        where: { customerId: { in: customerIds } },
        include: {
          listing: {
            select: { id: true, properties: { select: { title: true, city: true, district: true } } },
          },
          agent: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
        orderBy: { scheduledAt: "desc" },
        take: 20,
      }),
    ]);

    res.json({
      deals: deals.map((d) => ({
        id: d.id,
        stage: d.stage,
        agreedPrice: d.agreedPrice ? Number(d.agreedPrice) : null,
        property: d.property,
        listingType: d.listing?.listingType,
        agent: d.agent ? { name: `${d.agent.firstName} ${d.agent.lastName}`, phone: d.agent.phone } : null,
        createdAt: d.createdAt,
        expectedCloseDate: d.expectedCloseDate,
      })),
      appointments: appointments.map((a) => ({
        id: a.id,
        scheduledAt: a.scheduledAt,
        status: a.status,
        notes: a.notes,
        property: a.listing?.properties,
        agent: a.agent ? { name: `${a.agent.firstName} ${a.agent.lastName}`, phone: a.agent.phone } : null,
      })),
    });
  } catch (error) {
    console.error("Client dashboard error:", error);
    res.status(500).json({ message: "فشل تحميل البيانات" });
  }
});

export default router;
