import express, { Request, Response } from 'express';
import { authenticateToken } from '../auth';
import { prisma } from '../prismaClient';
import { logger } from '../logger';
import { UserRole } from '@shared/rbac';

const router = express.Router();

// CSV helpers
function toCSV(rows: Record<string, unknown>[], columns: string[]): string {
    const header = columns.join(',');
    const lines = rows.map(row =>
        columns.map(col => {
            const val = row[col] ?? '';
            const str = String(val).replace(/"/g, '""');
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        }).join(',')
    );
    return [header, ...lines].join('\n');
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

// GET /api/csv/leads — export leads as CSV
router.get('/leads', authenticateToken, async (req: Request, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        const agentId = req.user?.id;
        const roles = req.user?.roles || [];
        const isAdmin = roles.includes(UserRole.WEBSITE_ADMIN) || roles.includes(UserRole.CORP_OWNER);

        const leads = await prisma.leads.findMany({
            where: isAdmin && !orgId
                ? {}
                : orgId
                    ? { organizationId: orgId }
                    : { agentId: agentId! },
            include: {
                customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
                users: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5000,
        });

        const columns = ['id', 'status', 'source', 'priority', 'notes', 'customerName', 'customerPhone', 'customerEmail', 'agentName', 'createdAt', 'lastContactAt'];
        const rows = leads.map(l => ({
            id: l.id,
            status: l.status,
            source: l.source ?? '',
            priority: l.priority ?? '',
            notes: l.notes ?? '',
            customerName: l.customer ? `${l.customer.firstName ?? ''} ${l.customer.lastName ?? ''}`.trim() : '',
            customerPhone: l.customer?.phone ?? '',
            customerEmail: l.customer?.email ?? '',
            agentName: l.users ? `${l.users.firstName ?? ''} ${l.users.lastName ?? ''}`.trim() : '',
            createdAt: l.createdAt.toISOString(),
            lastContactAt: l.lastContactAt?.toISOString() ?? '',
        }));

        const csv = toCSV(rows, columns);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="leads-${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // BOM for Excel Arabic support
    } catch (error) {
        logger.error({ err: error }, 'Error exporting leads CSV');
        res.status(500).json({ error: 'EXPORT_FAILED', message: 'Failed to export leads' });
    }
});

// POST /api/csv/leads/import — import leads from CSV body
router.post('/leads/import', authenticateToken, async (req: Request, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        const agentId = req.user?.id;

        if (!orgId || !agentId) {
            return res.status(400).json({ error: 'ORG_REQUIRED', message: 'Organization context required' });
        }

        const csvText: string = req.body?.csv;
        if (!csvText || typeof csvText !== 'string') {
            return res.status(400).json({ error: 'CSV_REQUIRED', message: 'CSV text required in body.csv' });
        }

        const lines = csvText.trim().split('\n').filter(Boolean);
        if (lines.length < 2) {
            return res.status(400).json({ error: 'EMPTY_CSV', message: 'CSV must contain a header row and at least one data row' });
        }

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        const nameIdx = headers.indexOf('name');
        const phoneIdx = headers.indexOf('phone');
        const emailIdx = headers.indexOf('email');
        const sourceIdx = headers.indexOf('source');
        const notesIdx = headers.indexOf('notes');

        let created = 0;
        let skipped = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            const name = nameIdx >= 0 ? cols[nameIdx] : '';
            const phone = phoneIdx >= 0 ? cols[phoneIdx] : '';
            const email = emailIdx >= 0 ? cols[emailIdx] : '';

            if (!name && !phone && !email) { skipped++; continue; }

            const [firstName, ...rest] = (name || 'غير معروف').split(' ');
            const lastName = rest.join(' ') || '';

            const customer = await prisma.customers.create({
                data: {
                    firstName: firstName ?? 'غير معروف',
                    lastName: lastName || '',
                    phone: phone || '',
                    email: email || undefined,
                    organizationId: orgId ?? '',
                },
            });

            await prisma.leads.create({
                data: {
                    agentId,
                    organizationId: orgId,
                    customerId: customer.id,
                    source: sourceIdx >= 0 ? cols[sourceIdx] || 'CSV_IMPORT' : 'CSV_IMPORT',
                    notes: notesIdx >= 0 ? cols[notesIdx] || undefined : undefined,
                    status: 'NEW',
                },
            });
            created++;
        }

        res.json({ success: true, created, skipped, total: lines.length - 1 });
    } catch (error) {
        logger.error({ err: error }, 'Error importing leads CSV');
        res.status(500).json({ error: 'IMPORT_FAILED', message: 'Failed to import leads' });
    }
});

// GET /api/csv/listings — export listings as CSV
router.get('/listings', authenticateToken, async (req: Request, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        const roles = req.user?.roles || [];
        const isAdmin = roles.includes(UserRole.WEBSITE_ADMIN) || roles.includes(UserRole.CORP_OWNER);

        const listings = await prisma.listings.findMany({
            where: isAdmin && !orgId ? {} : orgId ? { organizationId: orgId } : {},
            orderBy: { createdAt: 'desc' },
            take: 5000,
        });

        const columns = ['id', 'propertyId', 'agentId', 'listingType', 'status', 'price', 'description', 'createdAt'];
        const rows = listings.map(l => ({
            id: l.id,
            propertyId: l.propertyId ?? '',
            agentId: l.agentId ?? '',
            listingType: l.listingType ?? '',
            status: l.status ?? '',
            price: l.price?.toString() ?? '',
            description: l.description ?? '',
            createdAt: l.createdAt?.toISOString() ?? '',
        }));

        const csv = toCSV(rows, columns);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="listings-${Date.now()}.csv"`);
        res.send('\uFEFF' + csv);
    } catch (error) {
        logger.error({ err: error }, 'Error exporting listings CSV');
        res.status(500).json({ error: 'EXPORT_FAILED', message: 'Failed to export listings' });
    }
});

// GET /api/csv/deals — export deals as CSV
router.get('/deals', authenticateToken, async (req: Request, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        const roles = req.user?.roles || [];
        const isAdmin = roles.includes(UserRole.WEBSITE_ADMIN) || roles.includes(UserRole.CORP_OWNER);

        const deals = await prisma.deals.findMany({
            where: isAdmin && !orgId ? {} : orgId ? { organizationId: orgId } : {},
            include: {
                customer: { select: { firstName: true, lastName: true, phone: true, email: true } },
                agent: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5000,
        });

        const columns = ['id', 'stage', 'source', 'agreedPrice', 'currency', 'customerName', 'customerPhone', 'customerEmail', 'agentName', 'expectedCloseDate', 'wonAt', 'createdAt'];
        const rows = deals.map(d => ({
            id: d.id,
            stage: d.stage ?? '',
            source: d.source ?? '',
            agreedPrice: d.agreedPrice?.toString() ?? '',
            currency: d.currency ?? 'SAR',
            customerName: d.customer ? `${d.customer.firstName ?? ''} ${d.customer.lastName ?? ''}`.trim() : '',
            customerPhone: d.customer?.phone ?? '',
            customerEmail: d.customer?.email ?? '',
            agentName: d.agent ? `${d.agent.firstName ?? ''} ${d.agent.lastName ?? ''}`.trim() : '',
            expectedCloseDate: d.expectedCloseDate?.toISOString() ?? '',
            wonAt: d.wonAt?.toISOString() ?? '',
            createdAt: d.createdAt.toISOString(),
        }));

        const csv = toCSV(rows, columns);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="deals-${Date.now()}.csv"`);
        res.send('\uFEFF' + csv);
    } catch (error) {
        logger.error({ err: error }, 'Error exporting deals CSV');
        res.status(500).json({ error: 'EXPORT_FAILED', message: 'Failed to export deals' });
    }
});

// GET /api/csv/appointments — export appointments as CSV
router.get('/appointments', authenticateToken, async (req: Request, res: Response) => {
    try {
        const orgId = req.user?.organizationId;
        const userId = req.user?.id;
        const roles = req.user?.roles || [];
        const isAdmin = roles.includes(UserRole.WEBSITE_ADMIN) || roles.includes(UserRole.CORP_OWNER);

        const appointments = await prisma.appointments.findMany({
            where: isAdmin && !orgId ? {} : orgId ? { organizationId: orgId } : userId ? { agentId: userId } : {},
            include: {
                customer: { select: { firstName: true, lastName: true, phone: true } },
                agent: { select: { firstName: true, lastName: true } },
            },
            orderBy: { scheduledAt: 'desc' },
            take: 5000,
        });

        const columns = ['id', 'status', 'scheduledAt', 'customerName', 'customerPhone', 'agentName', 'notes', 'createdAt'];
        const rows = appointments.map(a => ({
            id: a.id,
            status: a.status ?? '',
            scheduledAt: a.scheduledAt?.toISOString() ?? '',
            customerName: a.customer ? `${a.customer.firstName ?? ''} ${a.customer.lastName ?? ''}`.trim() : '',
            customerPhone: a.customer?.phone ?? '',
            agentName: a.agent ? `${a.agent.firstName ?? ''} ${a.agent.lastName ?? ''}`.trim() : '',
            notes: a.notes ?? '',
            createdAt: a.createdAt?.toISOString() ?? '',
        }));

        const csv = toCSV(rows, columns);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="appointments-${Date.now()}.csv"`);
        res.send('\uFEFF' + csv);
    } catch (error) {
        logger.error({ err: error }, 'Error exporting appointments CSV');
        res.status(500).json({ error: 'EXPORT_FAILED', message: 'Failed to export appointments' });
    }
});

export default router;
