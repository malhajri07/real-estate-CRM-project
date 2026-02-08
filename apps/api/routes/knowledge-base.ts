import { Router } from 'express';
import { knowledgeBaseService } from '../src/services/knowledge.service';
import { getErrorResponse } from '../i18n';

const router = Router();

/**
 * POST /api/knowledge
 * Log a new memory/action
 */
router.post('/', async (req, res) => {
    try {
        const { agentId, conversationId, type, status, summary, details, tags } = req.body;

        if (!agentId || !type || !status || !summary) {
            return res.status(400).json(getErrorResponse('MISSING_FIELDS', (req as any).locale));
        }

        const memory = await knowledgeBaseService.createMemory({
            agentId,
            conversationId,
            type,
            status,
            summary,
            details,
            tags
        });

        res.json({ success: true, memory });
    } catch (error) {
        console.error('Create memory error:', error);
        res.status(500).json(getErrorResponse('CREATE_MEMORY_FAILED', (req as any).locale));
    }
});

/**
 * GET /api/knowledge
 * Search memories
 */
router.get('/', async (req, res) => {
    try {
        const { tags, type, limit } = req.query;

        const criteria = {
            tags: tags ? (tags as string).split(',') : undefined,
            type: type as string,
            limit: limit ? parseInt(limit as string) : 20
        };

        const memories = await knowledgeBaseService.searchMemories(criteria);
        res.json({ success: true, memories });
    } catch (error) {
        console.error('Search memories error:', error);
        res.status(500).json(getErrorResponse('SEARCH_MEMORIES_FAILED', (req as any).locale));
    }
});

/**
 * GET /api/knowledge/:agentId
 * Get history for a specific agent
 */
router.get('/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const { limit } = req.query;

        const memories = await knowledgeBaseService.getAgentHistory(
            agentId,
            limit ? parseInt(limit as string) : 20
        );
        res.json({ success: true, memories });
    } catch (error) {
        console.error('Get agent history error:', error);
        res.status(500).json(getErrorResponse('GET_HISTORY_FAILED', (req as any).locale));
    }
});

export default router;
