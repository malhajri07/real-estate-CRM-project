import { Router } from 'express';
import { prisma } from '../prismaClient';
import { z } from 'zod';
import { hasPermission } from '../rbac-policy';

const router = Router();

// Middleware to check permissions
const requireBillingPerm = (req: any, res: any, next: any) => {
    // TODO: Add proper permission check
    // For now allowing authenticated users to see their own data
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    next();
};

router.use(requireBillingPerm);

// --- Billing Accounts ---

router.get('/accounts', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const accounts = await prisma.billing_accounts.findMany({
            where: {
                OR: [
                    { userId },
                    // If user belongs to an org, show org accounts too
                    ...(req.user.organizationId ? [{ organizationId: req.user.organizationId }] : [])
                ]
            },
            include: {
                subscriptions: true,
                invoices: { take: 5, orderBy: { issueDate: 'desc' } }
            }
        });
        res.json(accounts);
    } catch (error) {
        console.error('Error fetching billing accounts:', error);
        res.status(500).json({ message: 'Failed to fetch billing accounts' });
    }
});

// --- Invoices ---

router.get('/invoices', async (req: any, res) => {
    try {
        const userId = req.user.id;
        // Simple permission check: must be owner or org member
        const invoices = await prisma.billing_invoices.findMany({
            where: {
                account: {
                    OR: [
                        { userId },
                        ...(req.user.organizationId ? [{ organizationId: req.user.organizationId }] : [])
                    ]
                }
            },
            orderBy: { issueDate: 'desc' },
            include: {
                items: true
            }
        });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Failed to fetch invoices' });
    }
});

router.get('/invoices/:id', async (req: any, res) => {
    try {
        const invoice = await prisma.billing_invoices.findUnique({
            where: { id: req.params.id },
            include: { items: true, payments: true }
        });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        // TODO: Verify ownership
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch invoice' });
    }
});

// --- Subscriptions ---

router.get('/subscriptions', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const subs = await prisma.billing_subscriptions.findMany({
            where: {
                account: {
                    OR: [
                        { userId },
                        ...(req.user.organizationId ? [{ organizationId: req.user.organizationId }] : [])
                    ]
                }
            },
            include: { plan: true }
        });
        res.json(subs);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
});

// --- Pricing Plans ---

// --- Analytics ---

router.get('/analytics', async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const organizationId = req.user?.organizationId;

        // Base filter for RBAC
        const accountFilter = {
            OR: [
                { userId },
                ...(organizationId ? [{ organizationId }] : [])
            ]
        };

        // 1. Total Revenue (Sum of all paid invoices)
        const revenueAgg = await prisma.billing_invoices.aggregate({
            where: {
                account: accountFilter,
                status: 'PAID'
            },
            _sum: {
                amountPaid: true
            }
        });
        const totalRevenue = Number(revenueAgg._sum.amountPaid || 0);

        // 2. Active Subscriptions Count
        const activeSubs = await prisma.billing_subscriptions.count({
            where: {
                account: accountFilter,
                status: 'ACTIVE'
            }
        });

        // 3. Subscription Distribution
        const subDistribution = await prisma.billing_subscriptions.groupBy({
            by: ['status'],
            where: {
                account: accountFilter
            },
            _count: {
                _all: true
            }
        });

        // Map distribution to handy format
        const distribution = subDistribution.map(item => ({
            name: item.status,
            value: item._count._all
        }));

        // 4. Monthly Revenue (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentInvoices = await prisma.billing_invoices.findMany({
            where: {
                account: accountFilter,
                status: 'PAID',
                createdAt: {
                    gte: sixMonthsAgo
                }
            },
            select: {
                amountPaid: true,
                createdAt: true
            }
        });

        // Group by Month in JS
        const monthlyRevenueMap = new Map<string, number>();
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

        recentInvoices.forEach(inv => {
            const date = new Date(inv.createdAt);
            const monthIndex = date.getMonth(); // 0-11
            const monthKey = monthNames[monthIndex];
            const current = monthlyRevenueMap.get(monthKey) || 0;
            monthlyRevenueMap.set(monthKey, current + Number(inv.amountPaid));
        });

        const revenueChartData = Array.from(monthlyRevenueMap.entries()).map(([name, revenue]) => ({
            name,
            revenue
        }));

        // 5. Recent Transactions
        const recentTransactions = await prisma.billing_invoices.findMany({
            where: {
                account: accountFilter
            },
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                account: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true }
                        },
                        organization: {
                            select: { tradeName: true }
                        }
                    }
                },
                subscription: {
                    include: {
                        plan: true
                    }
                }
            }
        });

        const transactions = (recentTransactions as any[]).map(t => {
            // Try to get a user name
            let userName = "مستخدم";
            if (t.account?.organization) {
                userName = t.account.organization.tradeName;
            } else if (t.account?.user) {
                userName = `${t.account.user.firstName} ${t.account.user.lastName}`;
            }

            return {
                id: `TRX-${t.number || t.id.substring(0, 6)}`,
                user: userName,
                plan: t.subscription?.plan?.nameAr || t.subscription?.plan?.nameEn || "اشتراك",
                amount: `${t.amountDue} ${t.currency}`,
                status: t.status,
                date: t.createdAt.toISOString().split('T')[0]
            };
        });

        res.json({
            totalRevenue,
            activeSubscriptions: activeSubs,
            revenueChartData,
            subscriptionDistribution: distribution,
            recentTransactions: transactions
        });

    } catch (error) {
        console.error('Error fetching billing analytics:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

router.get('/plans', async (_req, res) => {
    try {
        const plans = await prisma.pricing_plans.findMany({
            where: { isArchived: false },
            include: { pricing_plan_features: true },
            orderBy: { order: 'asc' }
        });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch pricing plans' });
    }
});

export default router;
