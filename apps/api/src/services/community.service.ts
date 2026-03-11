import { basePrisma, prisma } from "../../prismaClient";

export class CommunityService {
  /**
   * Get all forum channels with post counts
   */
  async getChannels() {
    const channels = await basePrisma.forum_channels.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return channels;
  }

  /**
   * Create a new forum channel
   */
  async createChannel(
    userId: string,
    data: { nameAr: string; nameEn?: string; description?: string; isPublic?: boolean }
  ) {
    return basePrisma.forum_channels.create({
      data: {
        createdById: userId,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        isPublic: data.isPublic ?? true,
      },
    });
  }

  /**
   * Get channel by ID
   */
  async getChannelById(id: string) {
    return basePrisma.forum_channels.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });
  }

  /**
   * Update channel (creator only)
   */
  async updateChannel(
    id: string,
    userId: string,
    data: { nameAr?: string; nameEn?: string; description?: string; isPublic?: boolean }
  ) {
    const channel = await basePrisma.forum_channels.findFirst({
      where: { id, createdById: userId },
    });
    if (!channel) return null;
    return basePrisma.forum_channels.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete channel (creator only)
   */
  async deleteChannel(id: string, userId: string) {
    const channel = await basePrisma.forum_channels.findFirst({
      where: { id, createdById: userId },
    });
    if (!channel) return null;
    return basePrisma.forum_channels.delete({
      where: { id },
    });
  }

  /**
   * Get the community feed (posts) with pagination and filters
   */
  async getFeed(params: {
    page?: number;
    limit?: number;
    type?: string;
    tag?: string;
    channelId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.type) where.type = params.type;
    if (params.channelId) where.channelId = params.channelId;

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
              organization: { select: { tradeName: true } },
            },
          },
          channel: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
            },
          },
          media: {
            orderBy: { order: "asc" },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: [
          { isPinned: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.communityPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new post with optional media
   */
  async createPost(
    userId: string,
    data: {
      content: string;
      type: string;
      tags?: string[];
      channelId?: string;
      media?: { url: string; type: "IMAGE" | "VIDEO"; order?: number }[];
    }
  ) {
    const post = await prisma.communityPost.create({
      data: {
        authorId: userId,
        content: data.content,
        type: data.type || "DISCUSSION",
        channelId: data.channelId || null,
        tags: data.tags ?? undefined,
      },
    });

    if (data.media && data.media.length > 0) {
      await basePrisma.community_post_media.createMany({
        data: data.media.map((m, i) => ({
          postId: post.id,
          url: m.url,
          type: m.type,
          order: m.order ?? i,
        })),
      });
    }

    return prisma.communityPost.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            organization: { select: { tradeName: true } },
          },
        },
        channel: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
        media: { orderBy: { order: "asc" } },
        _count: { select: { comments: true } },
      },
    });
  }

  /**
   * Toggle Like on a post
   */
  async toggleLike(postId: string) {
    return prisma.communityPost.update({
      where: { id: postId },
      data: {
        likes: { increment: 1 },
      },
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
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}

export const communityService = new CommunityService();
