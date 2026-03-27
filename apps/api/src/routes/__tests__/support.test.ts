import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-declare schemas here to test validation logic in isolation (no DB/server required)
const createTicketSchema = z.object({
    subject: z.string().min(1).max(200),
    description: z.string().min(1),
    categoryId: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

const updateTicketSchema = z.object({
    status: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedToUserId: z.string().optional(),
    description: z.string().optional(),
});

describe('Support ticket schema validation', () => {
    describe('createTicketSchema', () => {
        it('accepts valid ticket data', () => {
            const result = createTicketSchema.safeParse({
                subject: 'Login issue',
                description: 'Cannot log in to the platform',
                priority: 'HIGH',
            });
            expect(result.success).toBe(true);
        });

        it('accepts ticket without optional fields', () => {
            const result = createTicketSchema.safeParse({
                subject: 'Billing question',
                description: 'Invoice not received',
            });
            expect(result.success).toBe(true);
        });

        it('rejects empty subject', () => {
            const result = createTicketSchema.safeParse({
                subject: '',
                description: 'Some description',
            });
            expect(result.success).toBe(false);
        });

        it('rejects subject longer than 200 chars', () => {
            const result = createTicketSchema.safeParse({
                subject: 'A'.repeat(201),
                description: 'Some description',
            });
            expect(result.success).toBe(false);
        });

        it('rejects missing description', () => {
            const result = createTicketSchema.safeParse({
                subject: 'Valid subject',
            });
            expect(result.success).toBe(false);
        });

        it('rejects invalid priority value', () => {
            const result = createTicketSchema.safeParse({
                subject: 'Test',
                description: 'Test',
                priority: 'CRITICAL', // not in enum
            });
            expect(result.success).toBe(false);
        });
    });

    describe('updateTicketSchema', () => {
        it('accepts partial update with status only', () => {
            const result = updateTicketSchema.safeParse({ status: 'CLOSED' });
            expect(result.success).toBe(true);
        });

        it('accepts empty object (no-op update)', () => {
            const result = updateTicketSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('rejects invalid priority', () => {
            const result = updateTicketSchema.safeParse({ priority: 'SUPER_HIGH' });
            expect(result.success).toBe(false);
        });

        it('accepts all valid fields', () => {
            const result = updateTicketSchema.safeParse({
                status: 'IN_PROGRESS',
                priority: 'URGENT',
                assignedToUserId: 'user-123',
                description: 'Updated description',
            });
            expect(result.success).toBe(true);
        });
    });
});
