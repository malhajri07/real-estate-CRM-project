/**
 * routes/appointments.ts — Viewing / meeting schedule CRUD + public booking.
 *
 * Mounted at `/api/appointments` in `apps/api/routes.ts`.
 *
 * Endpoints:
 * | Method | Path             | Auth? | Purpose                                     |
 * |--------|------------------|-------|---------------------------------------------|
 * | GET    | /                | Yes   | List appointments (agent + org scoped)       |
 * | POST   | /                | Yes   | Create appointment linked to customer/lead   |
 * | PUT    | /:id             | Yes   | Update status / reschedule / reassign        |
 * | GET    | /conflicts       | Yes   | Check time-slot overlaps for conflict display |
 * | POST   | /public-booking  | No    | Public property viewing request (creates     |
 * |        |                  |       | customer + lead + appointment in one go)     |
 *
 * E4 additions: `duration` field (default 30 min), conflict detection endpoint.
 *
 * Consumer: calendar page `apps/web/src/pages/platform/calendar/index.tsx`
 *   (query key `['/api/appointments']`).
 *
 * @see [[Features/CRM Core]]
 * @see [[Sessions/E4 - Calendar]]
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';
import { authenticateToken } from '../auth';

const router = Router();

/** Zod schema for authenticated appointment creation.
 * @param duration - Minutes (default 30). Source: duration picker in create form.
 */
const AppointmentSchema = z.object({
    customerId: z.string().min(1),
    scheduledAt: z.string().datetime(),
    duration: z.number().int().min(15).max(480).default(30),
    propertyId: z.string().optional(),
    listingId: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
});

// GET /api/appointments
/**
 * List  with optional filters.
 *
 * @route   GET /api/appointments/
 * @auth    Required — any authenticated user
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
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
/**
 * Create a new  record.
 *
 * @route   POST /api/appointments/
 * @auth    Required — any authenticated user
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const data = AppointmentSchema.parse(req.body);
        const userId = req.user?.id;
        let orgId = req.user?.organizationId;

        // Resolve customerId — might be a lead ID, customer ID, or user ID
        let customerId = data.customerId;
        let customer = await prisma.customers.findUnique({ where: { id: customerId } });

        // If not found as customer, try as lead and get its customerId
        if (!customer) {
            const lead = await prisma.leads.findUnique({ where: { id: customerId } });
            if (lead?.customerId) {
                customerId = lead.customerId;
                customer = await prisma.customers.findUnique({ where: { id: customerId } });
            }
        }

        // If still no customer, create a placeholder
        if (!customer) {
            // Auto-create org for individual agents
            if (!orgId) {
                const personalOrgId = `personal-${userId}`;
                let personalOrg = await prisma.organizations.findUnique({ where: { id: personalOrgId } });
                if (!personalOrg) {
                    const user = await prisma.users.findUnique({ where: { id: userId } });
                    personalOrg = await prisma.organizations.create({
                        data: { id: personalOrgId, legalName: `${user?.firstName || 'Agent'} ${user?.lastName || ''}`.trim(), tradeName: `${user?.firstName || 'Agent'} ${user?.lastName || ''}`.trim(), licenseNo: `INDIV-${userId?.substring(0, 8)}`, status: 'ACTIVE' },
                    });
                }
                orgId = personalOrgId;
                await prisma.users.update({ where: { id: userId }, data: { organizationId: orgId } });
            }
            customer = await prisma.customers.create({
                data: { firstName: "عميل", lastName: "جديد", phone: "+966500000000", organizationId: orgId! },
            });
            customerId = customer.id;
        }

        // Use the customer's org if agent doesn't have one
        if (!orgId) orgId = customer.organizationId;

        const appointment = await prisma.appointments.create({
            data: {
                customerId,
                scheduledAt: data.scheduledAt,
                duration: data.duration ?? 30,
                organizationId: orgId!,
                propertyId: data.propertyId,
                listingId: data.listingId,
                agentId: userId,
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
/**
 * Update an existing :id record.
 *
 * @route   PUT /api/appointments/:id
 * @auth    Required — any authenticated user
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { status, scheduledAt, notes, agentId } = req.body;
        const userId = req.user?.id;
        const orgId = req.user?.organizationId;

        // Verify ownership before update
        const appointment = await prisma.appointments.findFirst({
            where: { id: req.params.id, organizationId: orgId ?? undefined }
        });
        if (!appointment) return res.status(403).json({ message: "Not authorized to update this appointment" });

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

/**
 * @route GET /api/appointments/conflicts
 * @auth  Required
 * @param req.query.date - ISO date string (YYYY-MM-DD). Source: calendar day click.
 * @param req.query.time - HH:mm. Source: time slot click.
 * @param req.query.duration - Minutes (default 30). Source: duration picker.
 * @returns `{ hasConflict, conflicts: Appointment[] }` — overlapping appointments.
 *   Consumer: calendar create form — shows orange warning if conflicts exist.
 */
router.get('/conflicts', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { date, time, duration: durStr } = req.query as Record<string, string>;
        if (!date || !time) {
            return res.status(400).json({ message: "date and time are required" });
        }

        const userId = req.user?.id;
        const orgId = req.user?.organizationId;
        const duration = parseInt(durStr || "30", 10);

        // Build the proposed time window
        const [h, m] = time.split(":").map(Number);
        const start = new Date(`${date}T${time}:00`);
        const end = new Date(start.getTime() + duration * 60 * 1000);

        // Find overlapping appointments for this agent
        const conflicts = await prisma.appointments.findMany({
            where: {
                agentId: userId,
                status: { in: ['SCHEDULED', 'RESCHEDULED'] },
                scheduledAt: {
                    // Appointment starts before proposed end
                    lt: end,
                },
            },
            include: {
                customer: { select: { firstName: true, lastName: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });

        // Filter: only those whose end (scheduledAt + duration) is after proposed start
        const overlapping = conflicts.filter((appt) => {
            const apptStart = new Date(appt.scheduledAt);
            const apptEnd = new Date(apptStart.getTime() + (appt.duration || 30) * 60 * 1000);
            return apptEnd > start;
        });

        res.json({
            hasConflict: overlapping.length > 0,
            conflicts: overlapping.map((a) => ({
                id: a.id,
                scheduledAt: a.scheduledAt,
                duration: a.duration,
                customer: a.customer ? `${a.customer.firstName} ${a.customer.lastName}` : "عميل",
                status: a.status,
            })),
        });
    } catch (error) {
        console.error('Error checking conflicts:', error);
        res.status(500).json({ message: 'Failed to check conflicts' });
    }
});

/**
 * Zod schema for the public (no-auth) booking form on the property detail page.
 * Source: public property page at `apps/web/src/pages/platform/properties/detail.tsx`.
 * Phone validated as Saudi mobile: `05XXXXXXXX` or `+9665XXXXXXXX`.
 */
const PublicBookingSchema = z.object({
    propertyId: z.string().min(1),
    agentId: z.string().min(1),
    scheduledAt: z.string().min(1),
    customerName: z.string().min(2, "الاسم مطلوب"),
    customerPhone: z.string().regex(/^(\+?966|0)?5[0-9]{8}$/, "رقم هاتف سعودي غير صالح"),
    notes: z.string().optional(),
});

/**
 * @route POST /api/appointments/public-booking
 * @auth  Not required (public website form)
 * @param req.body - { propertyId, agentId, scheduledAt, customerName, customerPhone, notes? }
 *   Source: public property detail "Book Viewing" form.
 * @returns `{ success, appointmentId, message }`.
 * @sideEffect Creates `customers` row if phone is new; creates `leads` row with
 *   `source = 'public_booking'`; creates `appointments` row.
 */
router.post('/public-booking', async (req: Request, res: Response) => {
    try {
        const data = PublicBookingSchema.parse(req.body);

        // Find the agent and their org
        const agent = await prisma.users.findUnique({ where: { id: data.agentId }, select: { id: true, organizationId: true } });
        if (!agent) return res.status(404).json({ message: "Agent not found" });

        const orgId = agent.organizationId;
        if (!orgId) return res.status(400).json({ message: "Agent has no organization" });

        // Create or find customer by phone
        let customer = await prisma.customers.findFirst({ where: { phone: data.customerPhone, organizationId: orgId } });
        if (!customer) {
            const nameParts = data.customerName.trim().split(/\s+/);
            customer = await prisma.customers.create({
                data: {
                    firstName: nameParts[0] || data.customerName,
                    lastName: nameParts.slice(1).join(" ") || "",
                    phone: data.customerPhone,
                    organizationId: orgId,
                    source: "public_booking",
                },
            });
        }

        // Create the appointment
        const appointment = await prisma.appointments.create({
            data: {
                customerId: customer.id,
                organizationId: orgId,
                agentId: agent.id,
                propertyId: data.propertyId,
                scheduledAt: new Date(data.scheduledAt).toISOString(),
                notes: data.notes || `طلب معاينة من ${data.customerName} - ${data.customerPhone}`,
                status: 'SCHEDULED',
            },
        });

        // Also create a lead for this customer
        await prisma.leads.create({
            data: {
                agentId: agent.id,
                organizationId: orgId,
                customerId: customer.id,
                status: 'NEW',
                source: 'public_booking',
                notes: `طلب حجز معاينة للعقار عبر الموقع - ${data.customerPhone}`,
            },
        }).catch(() => {}); // Don't fail if lead creation fails

        res.status(201).json({ success: true, appointmentId: appointment.id, message: "تم إرسال طلب الحجز بنجاح" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'بيانات غير صالحة', errors: error.errors });
        }
        console.error('Error creating public booking:', error);
        res.status(500).json({ message: 'فشل إرسال طلب الحجز' });
    }
});

export default router;
