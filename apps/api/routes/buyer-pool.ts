/**
 * routes/buyer-pool.ts - Buyer Pool API Routes
 * 
 * Location: apps/api/ → Routes/ → buyer-pool.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * API routes for buyer pool and claims workflow. Handles:
 * - Buyer request search and retrieval
 * - Claiming buyer requests (agent feature)
 * - Releasing claims
 * - Contact information masking based on RBAC
 * 
 * API Endpoints:
 * - GET /api/pool/buyers - Search buyer requests
 * - POST /api/pool/buyers/:id/claim - Claim a buyer request
 * - POST /api/pool/buyers/:id/release - Release a claim
 * 
 * Related Files:
 * - apps/web/src/components/buyer-pool/BuyerPoolSearch.tsx - Buyer pool search component
 * - apps/api/rbac.ts - RBAC system for permissions
 */

// @ts-nocheck
import express from 'express';
import { z } from 'zod';
import { BuyerRequestStatus, ClaimStatus } from '@prisma/client';
import { prisma } from '../prismaClient';
import { basePrisma } from '../prismaClient';
import { normalizeSaudiPhone } from '../utils/phone';
import { requireRole, isAgent, isWebsiteAdmin, isCorpOwner, canClaimBuyerRequest, canReleaseClaim, maskContact, CLAIM_RATE_LIMITS, UserRole } from '../rbac';
import { authenticateToken } from '../auth';
import twilio from 'twilio';

const router = express.Router();

// Validation schemas
const searchBuyerRequestsSchema = z.object({
  city: z.string().optional(),
  type: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minBedrooms: z.number().optional(),
  maxBedrooms: z.number().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20)
});

const claimBuyerRequestSchema = z.object({
  buyerRequestId: z.string(),
  notes: z.string().optional()
});

const releaseClaimSchema = z.object({
  claimId: z.string(),
  notes: z.string().optional()
});

const sendSmsSchema = z.object({
  message: z.string().min(1).max(500)
});

// GET /api/pool/health - No auth, returns DB counts (for debugging)
router.get('/health', async (_req, res) => {
  try {
    const [seekerCount, buyerCount] = await Promise.all([
      basePrisma.$queryRawUnsafe<[{ count: bigint }]>(
        'SELECT COUNT(*)::bigint as count FROM public.properties_seeker'
      ).then((r) => Number(r[0]?.count ?? 0)).catch(() => 0),
      basePrisma.buyer_requests.count().catch(() => 0)
    ]);
    res.json({ ok: true, propertiesSeekerCount: seekerCount, buyerRequestsCount: buyerCount });
  } catch (err) {
    console.error('Pool health check error:', err);
    res.status(500).json({ ok: false, error: String((err as Error).message) });
  }
});

// GET /api/pool/search – Unified pool: customer requests (properties_seeker) first, then buyer_requests
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const query = searchBuyerRequestsSchema.parse({
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 20,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minBedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms as string) : undefined,
      maxBedrooms: req.query.maxBedrooms ? parseInt(req.query.maxBedrooms as string) : undefined
    });

    const canAccessPool = isAgent(req.user!.roles) || isWebsiteAdmin(req.user!.roles) || isCorpOwner(req.user!.roles);
    if (!canAccessPool) {
      return res.status(403).json({ message: 'Only agents or admins can search buyer pool' });
    }

    // 1. Customer requests from public.properties_seeker
    let customerPoolItems: any[] = [];
    try {
      // Query public.properties_seeker explicitly to ensure correct table
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;
      if (query.city) {
        conditions.push(`city = $${paramIndex++}`);
        params.push(query.city);
      }
      if (query.type) {
        conditions.push(`type_of_property = $${paramIndex++}`);
        params.push(query.type);
      }
      if (query.minPrice != null) {
        conditions.push(`budget_size >= $${paramIndex++}`);
        params.push(query.minPrice);
      }
      if (query.maxPrice != null) {
        conditions.push(`budget_size <= $${paramIndex++}`);
        params.push(query.maxPrice);
      }
      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const customerRequests = await basePrisma.$queryRawUnsafe<any[]>(
        `SELECT seeker_num, seeker_id, city, region, type_of_property, number_of_rooms, number_of_bathrooms, number_of_living_rooms, budget_size, other_comments, created_at
         FROM public.properties_seeker ${whereClause}
         ORDER BY created_at DESC
         LIMIT 100`,
        ...params
      );

      customerPoolItems = customerRequests.map((r: any) => ({
        id: r.seeker_id || String(r.seeker_num),
        source: 'customer_request' as const,
        city: r.city || null,
        region: r.region || null,
        type: r.type_of_property || 'Property',
        minBedrooms: r.number_of_rooms ?? null,
        maxBedrooms: r.number_of_rooms ?? null,
        bathrooms: r.number_of_bathrooms ?? null,
        livingRooms: r.number_of_living_rooms ?? null,
        minPrice: r.budget_size ? Number(r.budget_size) : null,
        maxPrice: r.budget_size ? Number(r.budget_size) : null,
        status: 'OPEN',
        hasActiveClaim: false,
        canSendSms: true,
        notes: r.other_comments || null,
        createdAt: r.created_at,
        createdBy: null
      }));
    } catch (err) {
      console.error('Pool: public.properties_seeker query failed:', err);
    }

    // 2. Buyer requests (buyer_requests)
    let buyerPoolItems: any[] = [];
    try {
      const where: any = { status: BuyerRequestStatus.OPEN };
      if (query.city) where.city = query.city;
      if (query.type) where.type = query.type;
      if (query.minPrice) where.minPrice = { gte: query.minPrice };
      if (query.maxPrice) where.maxPrice = { lte: query.maxPrice };
      if (query.minBedrooms) where.minBedrooms = { gte: query.minBedrooms };
      if (query.maxBedrooms) where.maxBedrooms = { lte: query.maxBedrooms };

      const buyerRequests = await basePrisma.buyer_requests.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          users: {
            select: { id: true, firstName: true, lastName: true }
          },
          claims: {
            where: { agentId: req.user!.id, status: ClaimStatus.ACTIVE }
          }
        }
      });

      buyerPoolItems = buyerRequests.map((request: any) => {
      const hasActiveClaim = request.claims.length > 0;
      const canViewFullContact = hasActiveClaim || req.user!.roles.includes(UserRole.WEBSITE_ADMIN);
      const creator = request.users;
      return {
        id: request.id,
        source: 'buyer_pool' as const,
        city: request.city,
        region: null,
        type: request.type,
        minBedrooms: request.minBedrooms,
        maxBedrooms: request.maxBedrooms,
        bathrooms: null,
        livingRooms: null,
        minPrice: request.minPrice,
        maxPrice: request.maxPrice,
        contactPreferences: request.contactPreferences,
        status: request.status,
        maskedContact: request.maskedContact,
        fullContact: canViewFullContact ? request.fullContactJson : null,
        hasActiveClaim,
        canSendSms: false,
        notes: request.notes,
        createdAt: request.createdAt,
        createdBy: creator ? {
          id: creator.id,
          firstName: creator.firstName,
          lastName: creator.lastName
        } : null
      };
    });
    } catch (err) {
      console.error('Pool: buyer_requests query failed:', err);
    }

    // Merge and sort by date – show most recent requests first
    const allSorted = [...customerPoolItems, ...buyerPoolItems].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    const total = allSorted.length;
    const skip = (query.page - 1) * query.pageSize;
    const data = allSorted.slice(skip, skip + query.pageSize);

    res.json({
      success: true,
      data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid query parameters', errors: error.errors });
    }
    console.error('Search buyer requests error:', error);
    res.status(500).json({ message: 'Failed to search buyer requests' });
  }
});

// POST /api/pool/customer-requests/:id/send-sms
router.post('/customer-requests/:id/send-sms', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = sendSmsSchema.parse(req.body || {});

    const canSendSms = isAgent(req.user!.roles) || isWebsiteAdmin(req.user!.roles) || isCorpOwner(req.user!.roles);
    if (!canSendSms) {
      return res.status(403).json({ message: 'Only agents or admins can send SMS' });
    }

    const isNumericId = /^\d+$/.test(id);
    const seeker = await basePrisma.properties_seeker.findFirst({
      where: isNumericId
        ? {
            OR: [
              { seeker_id: id },
              { seeker_num: BigInt(id) }
            ]
          }
        : { seeker_id: id }
    });

    if (!seeker || !seeker.mobile_number) {
      return res.status(404).json({ message: 'Customer request not found or has no phone number' });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber || accountSid === 'your_twilio_sid') {
      return res.status(503).json({
        message: 'SMS sending is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment.'
      });
    }

    const client = twilio(accountSid, authToken);
    let to = normalizeSaudiPhone(seeker.mobile_number);
    if (!to || to.length < 12) {
      const d = (seeker.mobile_number || '').replace(/\D/g, '');
      if (d.length >= 9) {
        to = d.startsWith('966') ? `+${d.slice(0, 12)}` : d.startsWith('0') ? `+966${d.slice(1, 10)}` : `+966${d.slice(-9)}`;
      }
    }
    if (!to || !/^\+9665\d{8}$/.test(to)) {
      return res.status(400).json({
        message: `Invalid phone number for SMS: ${(seeker.mobile_number || '').slice(0, 20)}... Must be a valid Saudi mobile (e.g. +966501234567).`
      });
    }

    await client.messages.create({
      body: message,
      from: fromNumber,
      to
    });

    res.json({ success: true, message: 'SMS sent successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    // Log full error in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[Send SMS] Full error:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        moreInfo: error?.moreInfo,
        name: error?.name
      });
    } else {
      console.error('Send SMS error:', error?.message || error);
    }
    let userMessage = 'Failed to send SMS.';
    try {
      const twilioMsg = (error?.message ?? error?.status ?? String(error ?? '')).toString();
      const twilioCode = error?.code ?? error?.status;
      const isTrialRestriction = /verified|trial|21608|21614|21211/i.test(twilioMsg) || [21608, 21614, 21211].includes(Number(twilioCode));
      userMessage = isTrialRestriction
        ? 'SMS failed: Twilio trial accounts can only send to verified numbers. Add the recipient in Twilio Console under Phone Numbers → Manage → Verified Caller IDs, or upgrade your account.'
        : `SMS failed: ${twilioMsg}`;
    } catch (_) { /* fallback to default */ }
    if (!res.headersSent) {
      res.status(500).json({ message: userMessage });
    }
  }
});

// POST /api/pool/customer-requests/:id/claim – Convert properties_seeker to buyer_request and claim
router.post('/customer-requests/:id/claim', authenticateToken, async (req, res) => {
  try {
    const { id: seekerId } = req.params;
    const { notes } = claimBuyerRequestSchema.pick({ notes: true }).optional().parse(req.body || {});

    if (!canClaimBuyerRequest(req.user!.roles, req.user!.organizationId)) {
      return res.status(403).json({ message: 'Cannot claim buyer requests' });
    }

    const seeker = await basePrisma.properties_seeker.findFirst({
      where: {
        OR: [
          { seeker_id: seekerId },
          { seeker_num: seekerId },
          { seeker_num: BigInt(Number(seekerId)) }
        ]
      }
    });

    if (!seeker) {
      return res.status(404).json({ message: 'Customer request not found' });
    }

    const systemUser = await prisma.users.findFirst({
      where: { roles: { contains: 'AGENT' } }
    });
    const createdByUserId = systemUser?.id || req.user!.id;

    const fullContact = JSON.stringify({
      name: `${seeker.first_name} ${seeker.last_name}`,
      phone: normalizeSaudiPhone(seeker.mobile_number) || seeker.mobile_number,
      email: seeker.email
    });

    const buyerRequest = await prisma.buyer_requests.create({
      data: {
        createdByUserId,
        city: seeker.city || 'Riyadh',
        type: seeker.type_of_property,
        minBedrooms: seeker.number_of_rooms,
        maxBedrooms: seeker.number_of_rooms,
        minPrice: seeker.budget_size,
        maxPrice: seeker.budget_size,
        contactPreferences: 'PHONE',
        status: BuyerRequestStatus.OPEN,
        maskedContact: `+966 *** ${String(normalizeSaudiPhone(seeker.mobile_number) || seeker.mobile_number).slice(-4)}`,
        fullContactJson: fullContact,
        multiAgentAllowed: false,
        notes: seeker.other_comments || `From customer request ${seeker.seeker_id || seeker.seeker_num}`
      }
    });

    const expiresAt = new Date(Date.now() + CLAIM_RATE_LIMITS.CLAIM_EXPIRY_HOURS * 60 * 60 * 1000);
    const claim = await prisma.claim.create({
      data: {
        agentId: req.user!.id,
        buyerRequestId: buyerRequest.id,
        expiresAt,
        notes: notes || `Claimed from customer request`,
        status: ClaimStatus.ACTIVE
      }
    });

    await prisma.lead.create({
      data: {
        agentId: req.user!.id,
        buyerRequestId: buyerRequest.id,
        status: 'NEW',
        source: 'customer_request'
      }
    });

    await prisma.buyer_requests.update({
      where: { id: buyerRequest.id },
      data: { status: BuyerRequestStatus.CLAIMED }
    });

    res.status(201).json({
      success: true,
      claim: { id: claim.id, buyerRequestId: buyerRequest.id, expiresAt: claim.expiresAt, status: claim.status },
      message: 'Customer request claimed successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Claim customer request error:', error);
    res.status(500).json({ message: 'Failed to claim customer request' });
  }
});

// POST /api/pool/buyers/:id/claim
router.post('/:id/claim', authenticateToken, async (req, res) => {
  try {
    const { id: buyerRequestId } = req.params;
    const { notes } = claimBuyerRequestSchema.pick({ notes: true }).optional().parse(req.body || {}) || {};

    // Check if user can claim buyer requests
    if (!canClaimBuyerRequest(req.user!.roles, req.user!.organizationId)) {
      return res.status(403).json({ message: 'Cannot claim buyer requests' });
    }

    // Check if buyer request exists and is open
    const buyerRequest = await prisma.buyerRequest.findUnique({
      where: { id: buyerRequestId },
      include: {
        claims: {
          where: {
            status: ClaimStatus.ACTIVE
          }
        }
      }
    });

    if (!buyerRequest) {
      return res.status(404).json({ message: 'Buyer request not found' });
    }

    if (buyerRequest.status !== BuyerRequestStatus.OPEN) {
      return res.status(400).json({ message: 'Buyer request is not open for claims' });
    }

    // Check if already claimed
    if (buyerRequest.claims.length > 0) {
      return res.status(400).json({ message: 'Buyer request is already claimed' });
    }

    // Check rate limits
    const activeClaims = await prisma.claim.count({
      where: {
        agentId: req.user!.id,
        status: ClaimStatus.ACTIVE
      }
    });

    if (activeClaims >= CLAIM_RATE_LIMITS.MAX_ACTIVE_CLAIMS_PER_AGENT) {
      return res.status(429).json({ 
        message: 'Maximum active claims reached',
        limit: CLAIM_RATE_LIMITS.MAX_ACTIVE_CLAIMS_PER_AGENT
      });
    }

    // Check cooldown for this buyer
    const recentClaims = await prisma.claim.count({
      where: {
        buyerRequestId,
        claimedAt: {
          gte: new Date(Date.now() - CLAIM_RATE_LIMITS.COOLDOWN_HOURS * 60 * 60 * 1000)
        }
      }
    });

    if (recentClaims >= CLAIM_RATE_LIMITS.MAX_CLAIMS_PER_BUYER_PER_DAY) {
      return res.status(429).json({ 
        message: 'Too many claims for this buyer recently',
        cooldownHours: CLAIM_RATE_LIMITS.COOLDOWN_HOURS
      });
    }

    // Create claim
    const expiresAt = new Date(Date.now() + CLAIM_RATE_LIMITS.CLAIM_EXPIRY_HOURS * 60 * 60 * 1000);
    
    const claim = await prisma.claim.create({
      data: {
        agentId: req.user!.id,
        buyerRequestId,
        expiresAt,
        notes,
        status: ClaimStatus.ACTIVE
      }
    });

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        agentId: req.user!.id,
        buyerRequestId,
        status: 'NEW'
      }
    });

    // Update buyer request status
    await prisma.buyerRequest.update({
      where: { id: buyerRequestId },
      data: { status: BuyerRequestStatus.CLAIMED }
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CLAIM',
        entity: 'BUYER_REQUEST',
        entityId: buyerRequestId,
        afterJson: JSON.stringify({ claimId: claim.id, leadId: lead.id })
      }
    });

    res.status(201).json({
      success: true,
      claim: {
        id: claim.id,
        buyerRequestId: claim.buyerRequestId,
        expiresAt: claim.expiresAt,
        status: claim.status
      },
      lead: {
        id: lead.id,
        status: lead.status
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: error.errors 
      });
    }
    
    console.error('Claim buyer request error:', error);
    res.status(500).json({ message: 'Failed to claim buyer request' });
  }
});

// POST /api/pool/buyers/:id/release
router.post('/:id/release', authenticateToken, async (req, res) => {
  try {
    const { id: buyerRequestId } = req.params;
    const { notes } = releaseClaimSchema.parse(req.body);

    // Find active claim
    const claim = await prisma.claim.findFirst({
      where: {
        buyerRequestId,
        agentId: req.user!.id,
        status: ClaimStatus.ACTIVE
      }
    });

    if (!claim) {
      return res.status(404).json({ message: 'Active claim not found' });
    }

    // Check if user can release this claim
    if (!canReleaseClaim(req.user!.roles, claim.agentId, req.user!.id)) {
      return res.status(403).json({ message: 'Cannot release this claim' });
    }

    // Release claim
    await prisma.claim.update({
      where: { id: claim.id },
      data: {
        status: ClaimStatus.RELEASED,
        notes: notes || claim.notes
      }
    });

    // Update buyer request status back to OPEN
    await prisma.buyerRequest.update({
      where: { id: buyerRequestId },
      data: { status: BuyerRequestStatus.OPEN }
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'RELEASE',
        entity: 'CLAIM',
        entityId: claim.id,
        beforeJson: JSON.stringify({ status: ClaimStatus.ACTIVE }),
        afterJson: JSON.stringify({ status: ClaimStatus.RELEASED })
      }
    });

    res.json({
      success: true,
      message: 'Claim released successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: error.errors 
      });
    }
    
    console.error('Release claim error:', error);
    res.status(500).json({ message: 'Failed to release claim' });
  }
});

export default router;
