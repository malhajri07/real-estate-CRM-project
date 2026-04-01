import { z } from "zod";

const saudiPhoneRegex = /^(\+?966|0)?5[0-9]{8}$/;

export const leadSchemas = {
    create: z.object({
        // Customer fields
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.union([z.string().email(), z.literal("")]).optional().transform((value) => (value ? value : undefined)),
        phone: z.string().regex(saudiPhoneRegex, 'Phone must be a valid Saudi mobile number').optional(),
        city: z.string().optional(),
        // Lead fields
        status: z.string().optional(),
        source: z.string().optional(),
        leadSource: z.string().optional(),
        priority: z.union([z.string(), z.number()]).optional(),
        interestType: z.string().optional(),
        budgetRange: z.union([z.string(), z.number()]).optional(),
        notes: z.string().optional(),
        customerId: z.string().optional(),
        buyerRequestId: z.string().optional(),
        sellerSubmissionId: z.string().optional(),
    }).passthrough(),
    update: z.object({
        // Customer fields
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.union([z.string().email(), z.literal("")]).optional().transform((value) => (value ? value : undefined)),
        phone: z.string().regex(saudiPhoneRegex, 'Phone must be a valid Saudi mobile number').optional(),
        city: z.string().optional(),
        // Lead fields
        status: z.string().optional(),
        source: z.string().optional(),
        leadSource: z.string().optional(),
        priority: z.union([z.string(), z.number()]).optional(),
        interestType: z.string().optional(),
        budgetRange: z.union([z.string(), z.number()]).optional(),
        notes: z.string().optional(),
    }).passthrough()
};
