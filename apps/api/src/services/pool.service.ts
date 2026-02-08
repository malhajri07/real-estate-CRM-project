import { prisma } from "../lib/prisma";
import { BuyerRequestStatus, Prisma } from "@prisma/client";

export class PoolService {
    /**
     * Get available pool requests (Open Buyer Requests)
     */
    async getPoolRequests(params: {
        page?: number;
        limit?: number;
        city?: string;
        minPrice?: number;
        maxPrice?: number;
        type?: string;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 50; // Higher limit for high density pool
        const skip = (page - 1) * limit;

        const where: Prisma.buyer_requestsWhereInput = {
            status: BuyerRequestStatus.OPEN, // Only show OPEN requests
        };

        if (params.city) where.city = params.city;
        if (params.type) where.type = params.type;

        // Price range
        if (params.minPrice || params.maxPrice) {
            where.OR = [
                { minPrice: { gte: params.minPrice, lte: params.maxPrice } },
                { maxPrice: { gte: params.minPrice, lte: params.maxPrice } }
            ];
        }

        const [requests, total] = await Promise.all([
            prisma.buyer_requests.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                // We do NOT include full contact info, only masked
                select: {
                    id: true,
                    city: true,
                    type: true,
                    minPrice: true,
                    maxPrice: true,
                    minBedrooms: true,
                    maxBedrooms: true,
                    createdAt: true,
                    notes: true,
                    // maskedContact is already on the model
                }
            }),
            prisma.buyer_requests.count({ where })
        ]);

        return {
            data: requests,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Claim a request from the pool
     */
    async claimRequest(agentId: string, requestId: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Check if still open
            const request = await tx.buyer_requests.findUnique({
                where: { id: requestId }
            });

            if (!request || request.status !== BuyerRequestStatus.OPEN) {
                throw new Error("Request is no longer available.");
            }

            // 2. Create Claim
            // Calculate expiration (e.g., 48 hours)
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 48);

            await tx.claims.create({
                data: {
                    agentId,
                    buyerRequestId: requestId,
                    expiresAt,
                    status: "ACTIVE"
                }
            });

            // 3. Update Request Status
            // Assuming multiAgentAllowed logic checks (skipped for simple claim logic now)
            // If exclusive, mark CLAIMED. If multi, keep OPEN? 
            // For this revamp, let's assume exclusive claim for simplicity or "Claimed" status.
            const updatedRequest = await tx.buyer_requests.update({
                where: { id: requestId },
                data: { status: BuyerRequestStatus.CLAIMED }
            });

            return updatedRequest;
        });
    }
}

export const poolService = new PoolService();
