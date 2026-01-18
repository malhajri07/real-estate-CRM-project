import { Router } from 'express';
import { prisma } from '../prismaClient';
import { normalizeRoleKeys, UserRole } from '@shared/rbac';

const router = Router();

// Middleware: Admins only
const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const roles = normalizeRoleKeys(req.user.roles);
    if (!roles.includes(UserRole.WEBSITE_ADMIN) && !roles.includes(UserRole.CORP_OWNER)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

router.use(requireAdmin);

// GET /api/audit-logs
router.get('/', async (req: any, res) => {
    try {
        const { entity, userId, limit = '50', offset = '0' } = req.query;

        const logs = await prisma.audit_logs.findMany({
            where: {
                ...(entity && { entity: String(entity) }),
                ...(userId && { userId: String(userId) })
            },
            include: {
                users: { select: { firstName: true, lastName: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });

        // Total count for pagination
        const total = await prisma.audit_logs.count({
            where: {
                ...(entity && { entity: String(entity) }),
                ...(userId && { userId: String(userId) })
            }
        });

        res.json({ items: logs, total });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
});

export default router;
