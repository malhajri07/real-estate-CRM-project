import { Router } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';

const router = Router();

const AppointmentSchema = z.object({
    customerId: z.string().min(1),
    scheduledAt: z.string().datetime(),
    propertyId: z.string().optional(),
    listingId: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
});

// GET /api/appointments
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const orgId = req.user?.organizationId;

        const appointments = await prisma.appointments.findMany({
            where: {
                OR: [
                    ...(userId ? [{ agentId: userId }] : []),
                    ...(userId ? [{ customerId: userId }] : []), // If customer is user (unlikely for agent portal but good safety)
                    ...(orgId ? [{ organizationId: orgId }] : [])
                ]
            },
            include: {
                customer: true,
                property: { select: { title: true, address: true } },
                listing: true,
                agent: { select: { firstName: true, lastName: true } }
            },
            orderBy: { scheduledAt: 'desc' }
        });
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Failed to fetch appointments' });
    }
});

// POST /api/appointments
router.post('/', async (req: any, res) => {
    try {
        const data = AppointmentSchema.parse(req.body);
        const userId = req.user?.id;
        const orgId = req.user?.organizationId;

        if (!orgId) return res.status(400).json({ message: 'Organization context required' });

        const appointment = await prisma.appointments.create({
            data: {
                customerId: data.customerId,
                scheduledAt: data.scheduledAt,
                organizationId: orgId,
                propertyId: data.propertyId,
                listingId: data.listingId,
                agentId: userId, // Self-assigned
                notes: data.notes,
                status: data.status || 'SCHEDULED'
            }
        });
        res.status(201).json(appointment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Invalid data', errors: error.errors });
        }
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Failed to create appointment' });
    }
});

// PUT /api/appointments/:id
router.put('/:id', async (req: any, res) => {
    try {
        const { status, scheduledAt, notes, agentId } = req.body;
        const result = await prisma.appointments.update({
            where: { id: req.params.id },
            data: {
                ...(status && { status }),
                ...(scheduledAt && { scheduledAt }),
                ...(notes && { notes }),
                ...(agentId && { agentId })
            }
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update appointment' });
    }
});

export default router;
