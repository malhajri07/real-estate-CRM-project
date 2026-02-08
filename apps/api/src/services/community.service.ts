import { prisma } from "../../prismaClient";
import { Prisma } from "@prisma/client";

export class CommunityService {
    /**
     * Get the community feed (posts) with pagination and filters
     */
    async getFeed(params: {
        page?: number;
        limit?: number;
        type?: string;
        tag?: string;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (params.type) where.type = params.type;
        // Note: Filtering by JSON tags might need raw query or specific JSON filter depending on DB, 
        // keeping it simple for now or assuming exact match if tag is passed.

        // For JSON array filtering in Prisma + Postgres:
        if (params.tag) {
            // specific implementation depends on prisma version and db capabilities for json arrays
        }

        const [posts, total] = await Promise.all([
            prisma.communityPost.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                            organization: { select: { tradeName: true } }
                        }
                    },
                    _count: {
                        select: { comments: true }
                    }
                },
                orderBy: [
                    { isPinned: "desc" },
                    { createdAt: "desc" }
                ],
                skip,
                take: limit,
            }),
            prisma.communityPost.count({ where })
        ]);

        return {
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Create a new post
     */
    async createPost(userId: string, data: { content: string; type: string; tags?: string[] }) {
        return prisma.communityPost.create({
            data: {
                authorId: userId,
                content: data.content,
                type: data.type || "DISCUSSION",
                tags: data.tags ? JSON.stringify(data.tags) : undefined,
            }
        });
    }

    /**
     * Toggle Like on a post
     */
    async toggleLike(postId: string) {
        // Simplified "Like" just increments counter for now. 
        // Real implementation would track user_likes table.
        // We'll just increment for this MVP.
        return prisma.communityPost.update({
            where: { id: postId },
            data: {
                likes: { increment: 1 }
            }
        });
    }

    /**
     * Add a comment
     */
    async addComment(userId: string, postId: string, content: string) {
        return prisma.communityComment.create({
            data: {
                authorId: userId,
                postId,
                content
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true
                    }
                }
            }
        });
    }
}

export const communityService = new CommunityService();
