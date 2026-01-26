import { z } from 'zod';

const arabicNameRegex = /^[\u0600-\u06FFa-zA-Z\s]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;

export const authSchemas = {
    login: z.object({
        identifier: z.string().min(1, 'Email or username is required').optional(),
        email: z.string().email().optional(),
        username: z.string().min(1).optional(),
        password: z.string().min(1, 'Password is required')
    }).refine((data) => Boolean(data.identifier || data.email || data.username), {
        message: 'Email or username is required',
        path: ['identifier']
    }),

    register: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().regex(passwordRegex, 'Password must be at least 8 characters with uppercase, lowercase, and number'),
        firstName: z.string().regex(arabicNameRegex, 'First name must be valid (Arabic or English)'),
        lastName: z.string().regex(arabicNameRegex, 'Last name must be valid (Arabic or English)'),
        phone: z.string().optional(),
        roles: z.string().min(1),
        organizationId: z.string().optional(),
        username: z.string().min(3).optional()
    }),

    impersonate: z.object({
        targetUserId: z.string().uuid()
    })
};
