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



// GET /api/support/categories (Mock)
router.get('/categories', async (_req, res) => {
    // Static categories until we add a table
    const categories = [
        { id: '1', name: 'الدعم الفني', ticketCount: 15, active: true },
        { id: '2', name: 'الاستفسارات العامة', ticketCount: 8, active: true },
        { id: '3', name: 'المدفوعات', ticketCount: 3, active: true },
        { id: '4', name: 'حسابي', ticketCount: 5, active: true },
    ];
    res.json({ categories });
});

// GET /api/support/templates (Mock)
router.get('/templates', async (_req, res) => {
    // Static templates until we add a table
    const templates = [
        { id: '1', title: 'رد تلقائي - استلام', content: 'نشكرك على تواصلك معنا. تم استلام طلبك ورقم التذكرة هو...', usageCount: 120 },
        { id: '2', title: 'طلب معلومات إضافية', content: 'نحتاج إلى مزيد من التفاصيل لمساعدتك في حل المشكلة...', usageCount: 45 },
        { id: '3', title: 'إغلاق التذكرة', content: 'نود إعلامك بأنه تم حل المشكلة وإغلاق التذكرة. شكراً لك.', usageCount: 80 },
    ];
    res.json({ templates });
});

// POST /api/support/seed (Moved down)
router.post('/seed', async (req: any, res) => {
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
        console.error('Seeding tickets error:', error);
        res.status(500).json({ message: 'Failed to seed tickets' });
    }
});

export default router;
