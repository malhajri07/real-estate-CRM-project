import { Router } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';

const router = Router();

const TicketSchema = z.object({
    subject: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    channel: z.enum(['WEBSITE', 'WHATSAPP', 'PHONE', 'EMAIL']).optional(),
    customerId: z.string().optional(), // For admin/agent creation
});

// GET /api/support-tickets
// GET /api/support-tickets
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const orgId = req.user?.organizationId;
        const roles = req.user?.roles || [];
        const isGlobalAdmin = roles.includes('WEBSITE_ADMIN');

        // If admin/agent, might see all. For now, scoping to organization or creator.
        const tickets = await prisma.support_tickets.findMany({
            where: isGlobalAdmin ? {} : {
                OR: [
                    ...(userId ? [{ createdByUserId: userId }] : []),
                    ...(userId ? [{ assignedToUserId: userId }] : []),
                    ...(orgId ? [{ organizationId: orgId }] : [])
                ]
            },
            include: {
                createdBy: { select: { firstName: true, lastName: true } },
                assignedTo: { select: { firstName: true, lastName: true } },
                customer: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
});

// POST /api/support-tickets
router.post('/', async (req: any, res) => {
    try {
        const data = TicketSchema.parse(req.body);
        const userId = req.user?.id;
        const orgId = req.user?.organizationId;

        if (!orgId) return res.status(400).json({ message: 'Organization context required' });

        const ticket = await prisma.support_tickets.create({
            data: {
                subject: data.subject,
                description: data.description,
                priority: data.priority || 'MEDIUM',
                channel: data.channel || 'WEBSITE',
                organizationId: orgId,
                createdByUserId: userId,
                customerId: data.customerId,
                status: 'OPEN'
            }
        });
        res.status(201).json(ticket);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid data', errors: error.errors });
        }
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Failed to create ticket' });
    }
});

// PUT /api/support-tickets/:id
router.put('/:id', async (req: any, res) => {
    try {
        const { status, priority, assignedToUserId, description } = req.body;
        const ticket = await prisma.support_tickets.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status }),
                ...(priority && { priority }),
                ...(assignedToUserId && { assignedToUserId }),
                ...(description && { description }),
                ...(status === 'CLOSED' || status === 'RESOLVED' ? { closedAt: new Date() } : {})
            }
        });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update ticket' });
    }
});

export default router;
