import { knowledgeBaseService } from '../src/services/knowledge.service';
import { prisma } from '../prismaClient';

async function main() {
    console.log('Seeding agent memory...');

    try {
        const memory = await knowledgeBaseService.createMemory({
            agentId: 'antigravity-agent',
            type: 'TASK_COMPLETION',
            status: 'SUCCESS',
            summary: 'Completed API Evaluation and Remediation against Architectural Standards.',
            tags: ['API', 'Refactor', 'Localization', 'Auth', 'Architecture'],
            details: {
                task: 'API Evaluation & Remediation',
                accomplishments: [
                    'Analyzed 03-api-architect.md standards',
                    'Implemented Localization Infrastructure (i18n, locale middleware)',
                    'Refactored Auth Module to use standardized, localized errors',
                    'Implemented Knowledge Base Service and API with localization',
                    'Verified API endpoints via curl (Authentication flow)'
                ],
                timestamp: new Date().toISOString()
            }
        });

        console.log('Memory created successfully:', memory.id);
    } catch (error) {
        console.error('Failed to seed memory:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
