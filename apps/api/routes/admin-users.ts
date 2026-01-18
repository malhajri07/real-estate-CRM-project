
import express from 'express';
import { prisma } from '../prismaClient';

const router = express.Router();

router.get('/all-users', async (req, res) => {
    try {
        const users = await prisma.users.findMany({
            include: {
                organization: true,
                agent_profiles: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            success: true,
            users: users.map(user => {
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
                    approvalStatus: null, // Add default approval status
                    lastLoginAt: null, // Add default last login
                    licenseNumber: null, // Add default license number
                    memberships: [], // Add default memberships
                    primaryMembership: null, // Add default primary membership
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                };
            })
        });
    } catch (error) {
        console.error('Admin users fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
