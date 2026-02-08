import { prisma } from '../../prismaClient';

export interface CreateMemoryInput {
    agentId: string;
    conversationId?: string;
    type: string;
    status: string;
    summary: string;
    details?: any;
    tags?: string[];
}

export interface SearchMemoryInput {
    tags?: string[];
    type?: string;
    limit?: number;
}

export class KnowledgeBaseService {
    /**
     * Log a new memory/action to the knowledge base
     */
    async createMemory(data: CreateMemoryInput) {
        return await prisma.agent_memory.create({
            data: {
                agentId: data.agentId,
                conversationId: data.conversationId,
                type: data.type,
                status: data.status,
                summary: data.summary,
                details: data.details || {},
                tags: data.tags || []
            }
        });
    }

    /**
     * Search for memories based on criteria
     */
    async searchMemories(criteria: SearchMemoryInput) {
        const { tags, type, limit = 10 } = criteria;

        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (tags && tags.length > 0) {
            where.tags = {
                hasSome: tags
            };
        }

        return await prisma.agent_memory.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }

    /**
     * Get recent memories for a specific agent
     */
    async getAgentHistory(agentId: string, limit: number = 20) {
        return await prisma.agent_memory.findMany({
            where: {
                agentId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });
    }
}

export const knowledgeBaseService = new KnowledgeBaseService();
