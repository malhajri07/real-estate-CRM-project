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
 * | GET | /viewings  | Yes | Past appointments with feedback (E15)   |
 * | POST| /rate-agent| Yes | Submit agent rating (1-5 stars) (E15)   |
 *
 * E15: documents + viewing history + agent rating in dashboard response.
 * Consumer: client portal page; authenticated via OTP (same token flow as agents).
 * @see [[Sessions/E15 - Client Portal]]
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

    const [deals, appointments, documents, viewingFeedback] = await Promise.all([
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
      // Documents shared with client (E15)
      prisma.deal_documents.findMany({
        where: { deal: { customerId: { in: customerIds } } },
        include: { deal: { select: { id: true, property: { select: { title: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      // Viewing feedback for past appointments (E15)
      prisma.viewing_feedback.findMany({
        where: { customerId: { in: customerIds } },
        orderBy: { createdAt: "desc" },
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
        agent: a.agent ? { name: `${a.agent.firstName} ${a.agent.lastName}`, phone: a.agent.phone, id: a.agent.id } : null,
      })),
      /** Documents shared with the client across all deals (E15). */
      documents: documents.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileType: d.fileType,
        dealId: d.dealId,
        propertyTitle: (d.deal as any)?.property?.title,
        createdAt: d.createdAt,
      })),
      /** Past viewing feedback entries (E15). */
      viewings: viewingFeedback.map((v) => ({
        id: v.id,
        appointmentId: v.appointmentId,
        overallRating: v.overallRating,
        comments: v.comments,
        agentRating: v.agentRating,
        agentReviewText: v.agentReviewText,
        createdAt: v.createdAt,
      })),
    });
  } catch (error) {
    console.error("Client dashboard error:", error);
    res.status(500).json({ message: "فشل تحميل البيانات" });
  }
});

/**
 * @route POST /api/client/rate-agent
 * @auth  Required (client)
 * @param req.body.appointmentId - The appointment this rating is for.
 *   Source: "Rate Agent" button on a completed viewing in the client portal (E15).
 * @param req.body.agentRating - 1-5 stars.
 * @param req.body.agentReviewText - Free-text review.
 * @returns `{ success }`.
 *   Consumer: client portal — hides the rate button after submission.
 * @sideEffect Upserts `viewing_feedback` with agentRating + agentReviewText.
 */
router.post("/rate-agent", authenticateToken, async (req, res) => {
  try {
    const { appointmentId, agentRating, agentReviewText } = req.body;
    if (!appointmentId || !agentRating || agentRating < 1 || agentRating > 5) {
      return res.status(400).json({ message: "appointmentId and agentRating (1-5) required" });
    }

    const user = (req as any).user;

    // Find or create feedback row
    const existing = await prisma.viewing_feedback.findUnique({ where: { appointmentId } });
    if (existing) {
      await prisma.viewing_feedback.update({
        where: { appointmentId },
        data: { agentRating, agentReviewText: agentReviewText || null },
      });
    } else {
      await prisma.viewing_feedback.create({
        data: {
          appointmentId,
          customerId: user.id,
          agentRating,
          agentReviewText: agentReviewText || null,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Rate agent error:", error);
    res.status(500).json({ message: "فشل تقييم الوسيط" });
  }
});

export default router;
