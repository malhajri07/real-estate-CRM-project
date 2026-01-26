import { prisma } from '../../prismaClient';
import { UserRole, normalizeRoleKeys } from '@shared/rbac';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export class RbacService {
    /**
     * Get system audit logs/activities
     */
    async getActivities(limit: number = 20) {
        const logs = await prisma.audit_logs.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                users: {
                    select: {
                        firstName: true,
                        lastName: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        return logs.map(log => {
            const actionUpper = log.action.toUpperCase();
            let risk = 'Low';
            if (actionUpper.includes('DELETE') || actionUpper.includes('DROP') || actionUpper.includes('BAN')) {
                risk = 'High';
            } else if (actionUpper.includes('UPDATE') || actionUpper.includes('EDIT') || actionUpper.includes('CHANGE')) {
                risk = 'Medium';
            } else if (actionUpper.includes('LOGIN_FAIL') || actionUpper.includes('UNAUTHORIZED')) {
                risk = 'High';
            }

            const userName = log.users
                ? `${log.users.firstName} ${log.users.lastName}`.trim() || log.users.username
                : 'System';

            return {
                id: log.id,
                user: userName,
                action: log.action,
                target: log.entity || 'System',
                time: log.createdAt,
                risk
            };
        });
    }

    /**
     * Get Dashboard Metrics
     */
    async getDashboardMetrics(days: number = 30) {
        // Helper to count safely
        const safeCount = async (modelName: string, query?: any) => {
            try {
                const model = (prisma as any)[modelName];
                if (!model) return 0;
                return await model.count(query);
            } catch (err) {
                console.warn(`Count failed for ${modelName}:`, err);
                return 0;
            }
        };

        const getDateFilter = (d: number) => {
            if (d === 0) {
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);
                return { gte: startOfDay };
            }
            return { gte: new Date(Date.now() - d * 24 * 60 * 60 * 1000) };
        };

        // Metrics logic (copied and adapted from rbac-admin.ts)
        const leadsToday = await safeCount('leads', { where: { createdAt: getDateFilter(0) } });
        const leads7Days = await safeCount('leads', { where: { createdAt: getDateFilter(7) } });
        const leads30Days = await safeCount('leads', { where: { createdAt: getDateFilter(30) } });

        const listingsToday = await safeCount('listings', { where: { createdAt: getDateFilter(0) } });
        const listings7Days = await safeCount('listings', { where: { createdAt: getDateFilter(7) } });
        const listings30Days = await safeCount('listings', { where: { createdAt: getDateFilter(30) } });

        const appointmentsToday = await safeCount('appointments', { where: { scheduledAt: getDateFilter(0) } });
        const appointments7Days = await safeCount('appointments', { where: { scheduledAt: getDateFilter(7) } });
        const appointments30Days = await safeCount('appointments', { where: { scheduledAt: getDateFilter(30) } });

        // Financials & GMV
        const getFinancials = async (d: number) => {
            try {
                if (!(prisma as any).billing_invoices) return { paid: 0, due: 0 };
                const agg = await (prisma as any).billing_invoices.aggregate({
                    _sum: { amountPaid: true, amountDue: true },
                    where: { issueDate: getDateFilter(d) }
                });
                return { paid: Number(agg._sum.amountPaid || 0), due: Number(agg._sum.amountDue || 0) };
            } catch { return { paid: 0, due: 0 }; }
        };

        const getGMV = async (d: number) => {
            try {
                if (!(prisma as any).deals) return 0;
                const agg = await (prisma as any).deals.aggregate({
                    _sum: { agreedPrice: true },
                    where: { stage: 'WON', wonAt: getDateFilter(d) }
                });
                return Number(agg._sum.agreedPrice || 0);
            } catch { return 0; }
        };

        const [finToday, fin7Days, fin30Days] = await Promise.all([getFinancials(0), getFinancials(7), getFinancials(30)]);
        const [gmvToday, gmv7Days, gmv30Days] = await Promise.all([getGMV(0), getGMV(7), getGMV(30)]);

        // Deals Won Logic
        const getDealsWon = async (d: number) => {
            try {
                if (!(prisma as any).deals) return 0;
                return await (prisma as any).deals.count({
                    where: { stage: 'WON', wonAt: getDateFilter(d) }
                });
            } catch { return 0; }
        };
        const [dealsToday, deals7Days, deals30Days] = await Promise.all([getDealsWon(0), getDealsWon(7), getDealsWon(30)]);

        // 8. Top Agents
        let topAgents: any[] = [];
        try {
            if ((prisma as any).deals && (prisma as any).users) {
                const agentStats = await (prisma as any).deals.groupBy({
                    by: ['agentId'],
                    where: { stage: 'WON' },
                    _sum: { agreedPrice: true },
                    _count: { id: true },
                    orderBy: { _sum: { agreedPrice: 'desc' } },
                    take: 5
                });
                const agentIds = agentStats.map((s: any) => s.agentId).filter(Boolean);
                const agents = await (prisma as any).users.findMany({
                    where: { id: { in: agentIds } },
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true }
                });
                topAgents = agentStats.map((stat: any) => {
                    const agent = agents.find((a: any) => a.id === stat.agentId);
                    if (!agent) return null;
                    return {
                        id: agent.id,
                        name: `${agent.firstName} ${agent.lastName}`,
                        email: agent.email,
                        phone: agent.phone,
                        avatarUrl: agent.avatarUrl,
                        dealsWon: stat._count.id,
                        gmv: Number(stat._sum.agreedPrice || 0)
                    };
                }).filter(Boolean);
            }
        } catch (e) { console.error('Top Agents fetch failed', e); }

        return {
            metrics: {
                currency: 'SAR',
                leads: { today: leadsToday, last7Days: leads7Days, last30Days: leads30Days },
                listings: { today: listingsToday, last7Days: listings7Days, last30Days: listings30Days },
                appointments: { today: appointmentsToday, last7Days: appointments7Days, last30Days: appointments30Days },
                dealsWon: { today: dealsToday, last7Days: deals7Days, last30Days: deals30Days },
                gmv: { today: gmvToday, last7Days: gmv7Days, last30Days: gmv30Days, currency: 'SAR' },
                invoiceTotal: { today: finToday.due, last7Days: fin7Days.due, last30Days: fin30Days.due, currency: 'SAR' },
                cashCollected: { today: finToday.paid, last7Days: fin7Days.paid, last30Days: fin30Days.paid, currency: 'SAR' }
            },
            topAgents
        };
    }

    async getRoles() {
        const roles = await prisma.system_roles.findMany({
            include: {
                role_permissions: {
                    include: { permission: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return roles.map(role => ({
            name: role.key, // Frontend uses 'name' as the ID/Key
            displayName: role.name,
            description: role.description,
            scope: role.scope,
            isSystem: role.isSystem,
            isDefault: role.isDefault,
            permissions: role.role_permissions.map(rp => rp.permission.key),
            permissionDetails: role.role_permissions.map(rp => rp.permission).map(p => ({
                key: p.key,
                label: p.label,
                description: p.description,
                domain: p.domain
            }))
        }));
    }

    async getAllUsers() {
        const users = await prisma.users.findMany({
            include: { organization: true, agent_profiles: true },
            orderBy: { createdAt: 'desc' },
        });

        return users.map(user => {
            // Parse roles from JSON string to array
            let parsedRoles = [];
            try {
                parsedRoles = JSON.parse(user.roles);
            } catch (e) {
                parsedRoles = [user.roles];
            }

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                phone: user.phone,
                roles: parsedRoles,
                isActive: user.isActive,
                organizationId: user.organizationId,
                organization: user.organization,
                agent_profiles: user.agent_profiles,
                approvalStatus: null,
                lastLoginAt: null,
                licenseNumber: null,
                memberships: [],
                primaryMembership: null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        });
    }

    async getAllOrganizations() {
        const orgs = await prisma.organizations.findMany({
            include: { _count: { select: { users: true } } },
            orderBy: { updatedAt: 'desc' }
        });
        return orgs.map(org => ({
            id: org.id,
            name: org.tradeName || org.legalName,
            description: (org.metadata as any)?.description || '',
            type: org.industry || 'Unknown',
            status: org.status.toLowerCase(),
            userCount: org._count.users,
            contactInfo: {
                email: org.email || '',
                phone: org.phone || '',
                address: org.address || '',
                website: org.website || ''
            },
            subscription: {
                plan: 'Standard Plan',
                status: 'active',
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            },
            createdAt: org.createdAt,
            lastActive: org.updatedAt
        }));
    }

    async createOrganization(data: any) {
        return await prisma.organizations.create({
            data: {
                id: crypto.randomUUID(),
                legalName: data.name,
                tradeName: data.name,
                licenseNo: `ORG-${Date.now()}`,
                industry: data.type,
                email: data.email,
                phone: data.phone,
                address: data.address,
                status: 'PENDING_VERIFICATION',
                metadata: { description: data.description },
                updatedAt: new Date()
            }
        });
    }

    async deleteOrganization(id: string) {
        return await prisma.organizations.delete({ where: { id } });
    }

    async createUser(data: any, adminId?: string) {
        // Validation check for existing user
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [{ username: data.username }, { email: data.email }, { phone: data.phone }]
            }
        });

        if (existingUser) {
            throw new Error('User with this username, email, or phone already exists');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const rolesJson = JSON.stringify(Array.isArray(data.roles) ? data.roles : [data.roles]);

        const newUser = await prisma.users.create({
            data: {
                id: crypto.randomUUID(),
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
                email: data.email,
                phone: data.phone,
                passwordHash,
                roles: rolesJson,
                isActive: data.isActive ?? true,
                organizationId: data.organizationId,
                approvalStatus: 'APPROVED',
                updatedAt: new Date()
            }
        });

        if (adminId) {
            await this.logActivity(adminId, 'CREATE_USER', 'User', newUser.id, { username: newUser.username });
        }

        return newUser;
    }

    async logActivity(userId: string, action: string, entity: string, entityId: string, metadata?: any) {
        try {
            await prisma.audit_logs.create({
                data: {
                    userId,
                    action,
                    entity,
                    entityId,
                    afterJson: metadata ? JSON.stringify(metadata) : undefined,
                    createdAt: new Date()
                }
            });
        } catch (e) {
            console.error('Failed to log activity', e);
        }
    }
}
