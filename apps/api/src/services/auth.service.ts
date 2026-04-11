/**
 * auth.service.ts — Core authentication and session management service.
 *
 * Handles user login/logout, JWT signing and verification, password hashing
 * via bcrypt, and session token persistence. Used by `auth.middleware.ts` and
 * the `/api/auth` route handlers throughout the application.
 */

import { prisma } from '../../prismaClient';
import { UserRole, parseStoredRoles, serializeRoles, normalizeRoleKeys } from '@shared/rbac';
import { JWT_SECRET as getJwtSecret } from '../../config/env';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const JWT_SECRET = getJwtSecret();

interface JWTPayload {
    userId: string;
    email: string | null;
    username?: string | null;
    roles: string;
    organizationId?: string;
    iat?: number;
    exp?: number;
}

/** Auth service. */
export class AuthService {

    static generateToken(user: {
        id: string;
        email: string | null;
        username?: string | null;
        roles: string;
        organizationId?: string;
    }): string {
        const payload: JWTPayload = {
            userId: user.id,
            email: user.email,
            username: user.username ?? null,
            roles: user.roles,
            organizationId: user.organizationId
        };
        return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    }

    static verifyToken(token: string): JWTPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch (error) {
            return null;
        }
    }

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    }

    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    async login(identifier: string, password: string) {
        const lookupIdentifier = identifier.trim().toLowerCase();

        let user = await prisma.users.findUnique({ where: { username: lookupIdentifier } });

        if (!user && lookupIdentifier.includes('@')) {
            user = await prisma.users.findUnique({ where: { email: lookupIdentifier } });
        }

        if (!user || !user.isActive) {
            throw new Error('Invalid credentials or inactive account');
        }

        const isValidAndConfirmed = await AuthService.comparePassword(password, user.passwordHash);
        if (!isValidAndConfirmed) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        await prisma.users.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date(), updatedAt: new Date() }
        }).catch(console.error);

        const token = AuthService.generateToken({
            id: user.id,
            email: user.email ?? null,
            username: user.username ?? null,
            roles: user.roles,
            organizationId: user.organizationId || undefined
        });

        const parsedRoles = normalizeRoleKeys(parseStoredRoles(user.roles));

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: parsedRoles,
                organizationId: user.organizationId
            },
            token
        };
    }

    async register(data: any) {
        const existing = await prisma.users.findUnique({ where: { email: data.email } });
        if (existing) throw new Error('User already exists');

        const passwordHash = await AuthService.hashPassword(data.password);
        const normalizedRoles = serializeRoles(normalizeRoleKeys(data.roles));
        const username = (data.username ?? data.email).trim().toLowerCase();

        const userId = randomUUID();
        const user = await prisma.users.create({
            data: {
                id: userId,
                username,
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                roles: normalizedRoles,
                organizationId: data.organizationId || null,
                updatedAt: new Date()
            }
        });

        // Create agent profile with FAL license data if provided
        if (data.falLicenseNumber) {
            try {
                await prisma.agent_profiles.create({
                    data: {
                        userId,
                        licenseNo: data.falLicenseNumber,
                        licenseValidTo: data.falIssuedAt ? new Date(data.falIssuedAt) : new Date(),
                        territories: "",
                        specialties: data.falLicenseType || "BROKERAGE_MARKETING",
                        isIndividualAgent: normalizedRoles.includes("INDIV_AGENT"),
                        falLicenseNumber: data.falLicenseNumber,
                        falLicenseType: data.falLicenseType || undefined,
                        falIssuedAt: data.falIssuedAt ? new Date(data.falIssuedAt) : undefined,
                        nationalIdNumber: data.saudiId || undefined,
                        sreiCertified: data.sreiCertified || false,
                        status: "PENDING_VERIFICATION",
                    },
                });
            } catch (e) {
                console.warn("Agent profile creation note:", (e as Error).message);
            }
        }

        const token = AuthService.generateToken({
            id: user.id,
            email: user.email ?? null,
            username: user.username ?? null,
            roles: user.roles,
            organizationId: user.organizationId || undefined
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: normalizeRoleKeys(parseStoredRoles(user.roles)),
                organizationId: user.organizationId
            },
            token
        };
    }

    async impersonate(adminId: string, targetUserId: string) {
        const admin = await prisma.users.findUnique({ where: { id: adminId } });
        if (!admin) throw new Error('Admin not found');

        const roles = parseStoredRoles(admin.roles);
        if (!roles.includes(UserRole.WEBSITE_ADMIN)) throw new Error('Insufficient permissions');

        const target = await prisma.users.findUnique({ where: { id: targetUserId } });
        if (!target) throw new Error('Target user not found');

        const token = AuthService.generateToken({
            id: target.id,
            email: target.email ?? null,
            username: target.username ?? null,
            roles: target.roles,
            organizationId: target.organizationId || undefined
        });

        await prisma.audit_logs.create({
            data: {
                userId: adminId,
                action: 'IMPERSONATE',
                entity: 'USER',
                entityId: targetUserId,
                afterJson: JSON.stringify({ impersonated: target.email }),
                createdAt: new Date()
            }
        });

        return { token };
    }
}
