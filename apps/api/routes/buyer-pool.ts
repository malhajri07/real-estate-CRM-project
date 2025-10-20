// @ts-nocheck
import express from 'express';
import { z } from 'zod';
import { BuyerRequestStatus, ClaimStatus } from '@prisma/client';
import { prisma } from '../prismaClient';
import { requireRole, isAgent, canClaimBuyerRequest, canReleaseClaim, maskContact, CLAIM_RATE_LIMITS, UserRole } from '../rbac';
import { authenticateToken } from '../auth';

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

// GET /api/pool/buyers/search
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

    // Check if user can search buyer pool
    if (!isAgent(req.user!.roles)) {
      return res.status(403).json({ message: 'Only agents can search buyer pool' });
    }

    // Build where clause
    const where: any = {
      status: BuyerRequestStatus.OPEN
    };

    if (query.city) {
      where.city = query.city;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = query.minPrice;
      if (query.maxPrice) where.price.lte = query.maxPrice;
    }

    if (query.minBedrooms || query.maxBedrooms) {
      where.bedrooms = {};
      if (query.minBedrooms) where.bedrooms.gte = query.minBedrooms;
      if (query.maxBedrooms) where.bedrooms.lte = query.maxBedrooms;
    }

    // Get buyer requests
    const [buyerRequests, total] = await Promise.all([
      prisma.buyerRequest.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          claims: {
            where: {
              agentId: req.user!.id,
              status: ClaimStatus.ACTIVE
            }
          }
        }
      }),
      prisma.buyerRequest.count({ where })
    ]);

    // Process results - mask contact information
    const processedRequests = buyerRequests.map(request => {
      const hasActiveClaim = request.claims.length > 0;
      const canViewFullContact = hasActiveClaim || req.user!.roles.includes(UserRole.WEBSITE_ADMIN);
      
      return {
        id: request.id,
        city: request.city,
        type: request.type,
        minBedrooms: request.minBedrooms,
        maxBedrooms: request.maxBedrooms,
        minPrice: request.minPrice,
        maxPrice: request.maxPrice,
        contactPreferences: request.contactPreferences,
        status: request.status,
        maskedContact: request.maskedContact,
        fullContact: canViewFullContact ? request.fullContactJson : null,
        hasActiveClaim,
        createdAt: request.createdAt,
        createdBy: {
          id: request.createdBy.id,
          firstName: request.createdBy.firstName,
          lastName: request.createdBy.lastName
        }
      };
    });

    res.json({
      success: true,
      data: processedRequests,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid query parameters',
        errors: error.errors 
      });
    }
    
    console.error('Search buyer requests error:', error);
    res.status(500).json({ message: 'Failed to search buyer requests' });
  }
});

// POST /api/pool/buyers/:id/claim
router.post('/:id/claim', authenticateToken, async (req, res) => {
  try {
    const { id: buyerRequestId } = req.params;
    const { notes } = claimBuyerRequestSchema.parse(req.body);

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
        afterJson: { claimId: claim.id, leadId: lead.id }
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
        beforeJson: { status: ClaimStatus.ACTIVE },
        afterJson: { status: ClaimStatus.RELEASED }
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

// GET /api/pool/buyers/my-claims
router.get('/my-claims', authenticateToken, async (req, res) => {
  try {
    if (!isAgent(req.user!.roles)) {
      return res.status(403).json({ message: 'Only agents can view claims' });
    }

    const claims = await prisma.claim.findMany({
      where: {
        agentId: req.user!.id,
        status: ClaimStatus.ACTIVE
      },
      include: {
        buyerRequest: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { claimedAt: 'desc' }
    });

    res.json({
      success: true,
      claims: claims.map(claim => ({
        id: claim.id,
        buyerRequestId: claim.buyerRequestId,
        claimedAt: claim.claimedAt,
        expiresAt: claim.expiresAt,
        status: claim.status,
        notes: claim.notes,
        buyerRequest: {
          id: claim.buyerRequest.id,
          city: claim.buyerRequest.city,
          type: claim.buyerRequest.type,
          minBedrooms: claim.buyerRequest.minBedrooms,
          maxBedrooms: claim.buyerRequest.maxBedrooms,
          minPrice: claim.buyerRequest.minPrice,
          maxPrice: claim.buyerRequest.maxPrice,
          fullContact: claim.buyerRequest.fullContactJson,
          createdBy: claim.buyerRequest.createdBy
        }
      }))
    });
  } catch (error) {
    console.error('Get my claims error:', error);
    res.status(500).json({ message: 'Failed to get claims' });
  }
});

export default router;
