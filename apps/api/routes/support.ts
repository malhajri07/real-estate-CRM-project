import { Router, Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';
import { authenticateToken } from '../auth';

const router = Router();

const TicketSchema = z.object({
    subject: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    channel: z.enum(['WEBSITE', 'WHATSAPP', 'PHONE', 'EMAIL']).optional(),
    customerId: z.string().optional(), // For admin/agent creation
});

const createTicketSchema = z.object({
    subject: z.string().min(1).max(200),
    description: z.string().min(1),
    categoryId: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

const updateTicketSchema = z.object({
    status: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToUserId: z.string().optional(),
    description: z.string().optional(),
});

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
        const data = createTicketSchema.parse(req.body);
        const userId = req.user?.id;
        const orgId = req.user?.organizationId;

        if (!orgId) return res.status(400).json({ message: 'Organization context required' });

        const ticket = await prisma.support_tickets.create({
            data: {
                subject: data.subject,
                description: data.description,
                priority: data.priority || 'MEDIUM',
                channel: 'WEBSITE',
                organizationId: orgId,
                createdByUserId: userId,
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
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const validated = updateTicketSchema.parse(req.body);
        const userId = (req as any).user?.id;
        const roles = (req as any).user?.roles || [];

        // Verify ticket ownership or admin privileges
        const ticket = await prisma.support_tickets.findFirst({
            where: { id: req.params.id }
        });
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });

        // Only allow update if user owns the ticket or is admin
        if (ticket.createdByUserId !== userId && !roles.includes('ADMIN') && !roles.includes('WEBSITE_ADMIN')) {
            return res.status(403).json({ message: "Not authorized to update this ticket" });
        }

        const updated = await prisma.support_tickets.update({
            where: { id: req.params.id },
            data: {
                ...(validated.status && { status: validated.status as any }),
                ...(validated.priority && { priority: validated.priority }),
                ...(validated.assignedToUserId && { assignedToUserId: validated.assignedToUserId }),
                ...(validated.description && { description: validated.description }),
                ...(validated.status === 'CLOSED' || validated.status === 'RESOLVED' ? { closedAt: new Date() } : {})
            }
        });
        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid data', errors: error.errors });
        }
        res.status(500).json({ message: 'Failed to update ticket' });
    }
});



// GET /api/support/categories
router.get('/categories', async (_req, res) => {
    try {
        // Use casting until schema is generated
        const categories = await (prisma as any).support_categories.findMany({
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
        });
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/support/templates
router.get('/templates', async (_req, res) => {
    try {
        // Use casting until schema is generated
        const templates = await (prisma as any).support_templates.findMany({
            where: { isActive: true },
            orderBy: { title: 'asc' }
        });
        res.json({ templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/support/seed (Moved down)
router.post('/seed', async (req: any, res) => {
    // Prevent seed endpoint in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: "Seed endpoint disabled in production" });
    }

    try {
        const userId = req.user?.id;
        const orgId = req.user?.organizationId;

        // Find existing user if not authenticated (dev mode fallback)
        let targetUser = userId;
        let targetOrg = orgId;

        if (!targetUser) {
            const u = await prisma.users.findFirst({ include: { organization: true } });
            if (u) {
                targetUser = u.id;
                targetOrg = u.organizationId || (await prisma.organizations.findFirst())?.id;
            }
        }

        if (!targetOrg) {
            return res.status(400).json({ message: 'No organization found to seed tickets for' });
        }

        const dummyTickets = [
            { subject: 'Login issue on mobile', status: 'OPEN', priority: 'HIGH' },
            { subject: 'Billing question for March', status: 'RESOLVED', priority: 'MEDIUM' },
            { subject: 'Feature request: Dark mode', status: 'OPEN', priority: 'LOW' },
            { subject: 'API token not working', status: 'IN_PROGRESS', priority: 'URGENT' },
            { subject: 'Update profile picture error', status: 'CLOSED', priority: 'LOW' }
        ];

        for (const t of dummyTickets) {
            await prisma.support_tickets.create({
                data: {
                    subject: t.subject,
                    description: `Automated seed ticket for ${t.subject}`,
                    priority: t.priority as any,
                    status: t.status as any,
                    channel: 'WEBSITE',
                    organizationId: targetOrg,
                    createdByUserId: targetUser,
                    updatedAt: new Date()
                }
            });
        }

        res.json({ success: true, message: 'Support tickets seeded' });
    } catch (error) {
        console.error('Error seeding tickets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
