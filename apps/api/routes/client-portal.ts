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
import { prisma, basePrisma } from "../prismaClient";
import { authenticateToken } from "../src/middleware/auth.middleware";

const router = Router();

// GET /api/client/dashboard — Client's deals + upcoming appointments
/**
 * List dashboard with optional filters.
 *
 * @route   GET /api/client-portal/dashboard
 * @auth    Required — any authenticated user
 */
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

// ────────────────────────────────────────────────────────────────────────────
// POST /api/client/property-request — Buyer submits "I'm looking for X"
// ────────────────────────────────────────────────────────────────────────────
/**
 * Submit a property request to the buyer pool.
 *
 * @route   POST /api/client/property-request
 * @auth    Required — BUYER role
 * @param   req.body.city - Target city. **Source:** client portal request form.
 * @param   req.body.type - Buy or Rent.
 * @param   req.body.minPrice - Minimum budget.
 * @param   req.body.maxPrice - Maximum budget.
 * @param   req.body.minBedrooms - Minimum bedrooms.
 * @param   req.body.notes - Free-text description.
 * @returns Created buyer_request record.
 *   **Consumer:** client portal "My Requests" section.
 * @sideEffect Creates buyer_requests row with OPEN status.
 */
router.post("/property-request", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { city, type, minPrice, maxPrice, minBedrooms, maxBedrooms, notes, contactPreference } = req.body;

    if (!city || !type) {
      return res.status(400).json({ message: "المدينة ونوع الطلب مطلوبان" });
    }

    const request = await prisma.buyer_requests.create({
      data: {
        createdByUserId: user.id,
        city,
        type,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        minBedrooms: minBedrooms ? parseInt(minBedrooms) : null,
        maxBedrooms: maxBedrooms ? parseInt(maxBedrooms) : null,
        notes: notes || null,
        contactPreferences: contactPreference || "phone",
        maskedContact: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2") : "****",
        fullContactJson: JSON.stringify({ phone: user.phone, email: user.email, name: `${user.firstName} ${user.lastName}` }),
        status: "OPEN",
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Client property request error:", error);
    res.status(500).json({ message: "فشل إنشاء الطلب" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/my-requests — Buyer's submitted property requests
// ────────────────────────────────────────────────────────────────────────────
/**
 * List the buyer's own property requests with claim status.
 *
 * @route   GET /api/client/my-requests
 * @auth    Required — any authenticated user
 * @returns Array of buyer_requests with claim count.
 *   **Consumer:** client portal "My Requests" tab.
 */
router.get("/my-requests", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const requests = await prisma.buyer_requests.findMany({
      where: { createdByUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        claims: {
          select: { id: true, status: true, agentId: true },
        },
      },
    });

    res.json(requests);
  } catch (error) {
    console.error("Client my-requests error:", error);
    res.status(500).json({ message: "فشل تحميل الطلبات" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/my-properties — Seller's listed properties with stats
// ────────────────────────────────────────────────────────────────────────────
/**
 * List the seller's own properties with view counts and inquiry stats.
 *
 * @route   GET /api/client/my-properties
 * @auth    Required — any authenticated user
 * @returns Array of properties with inquiry and favorite counts.
 *   **Consumer:** client portal "My Properties" tab for sellers.
 */
router.get("/my-properties", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Find properties linked to this user (as agent or via deals)
    const properties = await prisma.properties.findMany({
      where: { agentId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        district: true,
        type: true,
        status: true,
        price: true,
        areaSqm: true,
        bedrooms: true,
        bathrooms: true,
        photos: true,
        createdAt: true,
        favorites: { select: { id: true } },
        inquiries: { select: { id: true } },
      },
    });

    const result = properties.map((p) => ({
      ...p,
      favoriteCount: p.favorites.length,
      inquiryCount: p.inquiries.length,
      favorites: undefined,
      inquiries: undefined,
    }));

    res.json(result);
  } catch (error) {
    console.error("Client my-properties error:", error);
    res.status(500).json({ message: "فشل تحميل العقارات" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/deal-progress/:id — Deal with stage history for progress tracker
// ────────────────────────────────────────────────────────────────────────────
/**
 * Fetch a deal's full progress — current stage + stage history timeline.
 *
 * @route   GET /api/client/deal-progress/:id
 * @auth    Required — any authenticated user
 */
router.get("/deal-progress/:id", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const deal = await prisma.deals.findUnique({
      where: { id: req.params.id },
      include: {
        property: { select: { title: true, city: true, district: true, type: true, price: true, photos: true } },
        agent: { select: { firstName: true, lastName: true, phone: true, email: true } },
        documents: { orderBy: { createdAt: "desc" } },
        stageHistory: { orderBy: { enteredAt: "asc" } },
      },
    });

    if (!deal) return res.status(404).json({ message: "الصفقة غير موجودة" });

    res.json({
      id: deal.id,
      stage: deal.stage,
      stageEnteredAt: deal.stageEnteredAt,
      agreedPrice: deal.agreedPrice,
      currency: deal.currency,
      expectedCloseDate: deal.expectedCloseDate,
      createdAt: deal.createdAt,
      wonAt: deal.wonAt,
      notes: deal.notes,
      property: deal.property,
      agent: deal.agent ? { name: `${deal.agent.firstName} ${deal.agent.lastName}`, phone: deal.agent.phone, email: deal.agent.email } : null,
      documents: deal.documents,
      stageHistory: deal.stageHistory,
    });
  } catch (error) {
    console.error("Deal progress error:", error);
    res.status(500).json({ message: "فشل تحميل تقدم الصفقة" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/listing-stats/:id — Listing performance for sellers
// ────────────────────────────────────────────────────────────────────────────
/**
 * Property performance stats — views, favorites, inquiries, quality score.
 *
 * @route   GET /api/client/listing-stats/:id
 * @auth    Required — any authenticated user
 */
router.get("/listing-stats/:id", authenticateToken, async (req, res) => {
  try {
    const property = await prisma.properties.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, title: true, city: true, district: true, type: true, status: true,
        price: true, areaSqm: true, bedrooms: true, bathrooms: true,
        photos: true, description: true, features: true,
        createdAt: true,
        favorites: { select: { id: true } },
        inquiries: { select: { id: true, createdAt: true } },
        appointments: { select: { id: true, status: true } },
      },
    });

    if (!property) return res.status(404).json({ message: "العقار غير موجود" });

    // Quality score: how complete is the listing? (0-100)
    let qualityScore = 0;
    const tips: string[] = [];
    if (property.title) qualityScore += 10; else tips.push("أضف عنواناً للعقار");
    if (property.description && property.description.length > 50) qualityScore += 15; else tips.push("أضف وصفاً تفصيلياً (50+ حرف)");
    if (property.price) qualityScore += 10; else tips.push("حدد سعر العقار");
    if (property.areaSqm) qualityScore += 5; else tips.push("أضف المساحة بالمتر المربع");
    if (property.bedrooms) qualityScore += 5; else tips.push("أضف عدد الغرف");
    if (property.bathrooms) qualityScore += 5; else tips.push("أضف عدد دورات المياه");
    if (property.city) qualityScore += 5; else tips.push("حدد المدينة");
    if (property.district) qualityScore += 5; else tips.push("حدد الحي");
    if (property.features) qualityScore += 10; else tips.push("أضف مميزات العقار");

    // Photos scoring
    let photoCount = 0;
    try {
      const parsed = property.photos ? (typeof property.photos === "string" ? JSON.parse(property.photos) : property.photos) : [];
      photoCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {}
    if (photoCount >= 10) qualityScore += 30;
    else if (photoCount >= 5) { qualityScore += 20; tips.push(`أضف ${10 - photoCount} صور أخرى للحصول على نقاط أعلى`); }
    else if (photoCount >= 1) { qualityScore += 10; tips.push(`أضف ${10 - photoCount} صور أخرى — العقارات بـ 10+ صور تحصل على 3x مشاهدات`); }
    else tips.push("أضف صور للعقار — الإعلانات بصور تحصل على 5x مشاهدات");

    const daysOnMarket = Math.floor((Date.now() - new Date(property.createdAt!).getTime()) / 86400000);

    res.json({
      id: property.id,
      title: property.title,
      status: property.status,
      daysOnMarket,
      photoCount,
      favoriteCount: property.favorites.length,
      inquiryCount: property.inquiries.length,
      viewingCount: property.appointments.length,
      qualityScore: Math.min(qualityScore, 100),
      tips,
      // Weekly inquiry trend (last 4 weeks)
      weeklyInquiries: [0, 1, 2, 3].map((weeksAgo) => {
        const start = new Date(); start.setDate(start.getDate() - (weeksAgo + 1) * 7);
        const end = new Date(); end.setDate(end.getDate() - weeksAgo * 7);
        return property.inquiries.filter((inq) => {
          const d = new Date(inq.createdAt);
          return d >= start && d < end;
        }).length;
      }).reverse(),
    });
  } catch (error) {
    console.error("Listing stats error:", error);
    res.status(500).json({ message: "فشل تحميل إحصائيات العقار" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/documents — All documents across client's deals
// ────────────────────────────────────────────────────────────────────────────
/**
 * List all documents shared with the client across their deals.
 *
 * @route   GET /api/client/documents
 * @auth    Required — any authenticated user
 */
router.get("/documents", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const customers = await prisma.customers.findMany({
      where: { OR: [...(user.phone ? [{ phone: user.phone }] : []), ...(user.email ? [{ email: user.email }] : [])] },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    const deals = await prisma.deals.findMany({
      where: { customerId: { in: customerIds } },
      select: {
        id: true,
        stage: true,
        property: { select: { title: true, city: true } },
        documents: { orderBy: { createdAt: "desc" } },
      },
    });

    const documents = deals.flatMap((deal) =>
      deal.documents.map((doc) => ({
        ...doc,
        dealId: deal.id,
        dealStage: deal.stage,
        propertyTitle: deal.property?.title || "عقار",
        propertyCity: deal.property?.city || "",
      }))
    );

    res.json(documents);
  } catch (error) {
    console.error("Client documents error:", error);
    res.status(500).json({ message: "فشل تحميل المستندات" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/client/viewing-note — Save viewing rating + notes
// ────────────────────────────────────────────────────────────────────────────
/**
 * Submit or update viewing notes and property ratings for an appointment.
 *
 * @route   POST /api/client/viewing-note
 * @auth    Required — any authenticated user
 */
router.post("/viewing-note", authenticateToken, async (req, res) => {
  try {
    const { appointmentId, locationRating, conditionRating, priceRating, overallRating, comments } = req.body;
    if (!appointmentId) return res.status(400).json({ message: "appointmentId مطلوب" });

    const existing = await prisma.viewing_feedback.findUnique({ where: { appointmentId } });
    if (existing) {
      await prisma.viewing_feedback.update({
        where: { appointmentId },
        data: { locationRating, conditionRating, priceRating, overallRating, comments },
      });
    } else {
      await prisma.viewing_feedback.create({
        data: { appointmentId, customerId: (req as any).user.id, locationRating, conditionRating, priceRating, overallRating, comments },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Viewing note error:", error);
    res.status(500).json({ message: "فشل حفظ الملاحظات" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/viewings — Past viewings with notes/ratings
// ────────────────────────────────────────────────────────────────────────────
/**
 * List the client's past viewings with their feedback.
 *
 * @route   GET /api/client/viewings
 * @auth    Required — any authenticated user
 */
router.get("/viewings", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const customers = await prisma.customers.findMany({
      where: { OR: [...(user.phone ? [{ phone: user.phone }] : []), ...(user.email ? [{ email: user.email }] : [])] },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    const appointments = await prisma.appointments.findMany({
      where: { customerId: { in: customerIds } },
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true, status: true, scheduledAt: true, location: true, notes: true,
        property: { select: { id: true, title: true, city: true, district: true, type: true, photos: true, price: true } },
        agent: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    // Attach viewing feedback
    const appointmentIds = appointments.map((a) => a.id);
    const feedback = await prisma.viewing_feedback.findMany({
      where: { appointmentId: { in: appointmentIds } },
    });
    const feedbackMap = Object.fromEntries(feedback.map((f) => [f.appointmentId, f]));

    const result = appointments.map((a) => ({
      ...a,
      agent: a.agent ? { name: `${a.agent.firstName} ${a.agent.lastName}`, phone: a.agent.phone } : null,
      feedback: feedbackMap[a.id] || null,
    }));

    res.json(result);
  } catch (error) {
    console.error("Client viewings error:", error);
    res.status(500).json({ message: "فشل تحميل المعاينات" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/client/offers — Submit an offer on a property
// ────────────────────────────────────────────────────────────────────────────
/**
 * Submit a buyer offer on a property.
 *
 * @route   POST /api/client/offers
 * @auth    Required — any authenticated user
 */
router.post("/offers", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { propertyId, offerPrice, conditions, message } = req.body;

    if (!propertyId || !offerPrice) return res.status(400).json({ message: "العقار والسعر مطلوبان" });

    const property = await prisma.properties.findUnique({ where: { id: propertyId }, select: { id: true, title: true } });
    if (!property) return res.status(404).json({ message: "العقار غير موجود" });

    const offer = await basePrisma.client_offers.create({
      data: {
        propertyId,
        buyerUserId: user.id,
        offerPrice: parseFloat(offerPrice),
        conditions: conditions || null,
        message: message || null,
      },
    });

    res.status(201).json(offer);
  } catch (error) {
    console.error("Client offer error:", error);
    res.status(500).json({ message: "فشل تقديم العرض" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/offers — List buyer's submitted offers
// ────────────────────────────────────────────────────────────────────────────
/**
 * List the buyer's submitted offers with property details and status.
 *
 * @route   GET /api/client/offers
 * @auth    Required — any authenticated user
 */
router.get("/offers", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    const offers = await basePrisma.client_offers.findMany({
      where: { buyerUserId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, title: true, city: true, district: true, type: true, price: true, photos: true } },
      },
    });

    res.json(offers);
  } catch (error) {
    console.error("Client offers error:", error);
    res.status(500).json({ message: "فشل تحميل العروض" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/client/agent-activity — What my agent did this week (seller view)
// ────────────────────────────────────────────────────────────────────────────
/**
 * Activity report of the seller's assigned agent — calls, viewings, marketing.
 *
 * @route   GET /api/client/agent-activity
 * @auth    Required — any authenticated user
 */
router.get("/agent-activity", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Find properties this user owns (agentId = user.id for agents, or linked via deals for sellers)
    const myProperties = await prisma.properties.findMany({
      where: { agentId: user.id },
      select: { id: true, agentId: true },
    });

    // If seller: find deals where they're the customer, get the agent
    const customers = await prisma.customers.findMany({
      where: { OR: [...(user.phone ? [{ phone: user.phone }] : []), ...(user.email ? [{ email: user.email }] : [])] },
      select: { id: true },
    });
    const customerIds = customers.map((c) => c.id);

    const deals = await prisma.deals.findMany({
      where: { customerId: { in: customerIds } },
      select: { agentId: true, propertyId: true },
    });

    const agentIds = [...new Set([...myProperties.map((p) => p.agentId), ...deals.map((d) => d.agentId)].filter(Boolean))] as string[];
    const propertyIds = [...new Set([...myProperties.map((p) => p.id), ...deals.map((d) => d.propertyId)].filter(Boolean))] as string[];

    if (agentIds.length === 0) return res.json({ activities: [], summary: { calls: 0, viewings: 0, totalActions: 0 } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get agent's recent activity from audit_logs
    const activities = await prisma.audit_logs.findMany({
      where: {
        userId: { in: agentIds },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { users: { select: { firstName: true, lastName: true } } },
    });

    // Count viewings (appointments on seller's properties)
    const viewings = await prisma.appointments.count({
      where: {
        propertyId: { in: propertyIds },
        scheduledAt: { gte: sevenDaysAgo },
      },
    });

    res.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        createdAt: a.createdAt,
        agentName: `${a.users.firstName} ${a.users.lastName}`,
      })),
      summary: {
        totalActions: activities.length,
        viewings,
        calls: activities.filter((a) => a.action === "CALL" || a.entity === "contact_log").length,
      },
    });
  } catch (error) {
    console.error("Agent activity error:", error);
    res.status(500).json({ message: "فشل تحميل نشاط الوسيط" });
  }
});

export default router;
