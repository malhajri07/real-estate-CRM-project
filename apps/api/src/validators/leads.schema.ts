import { z } from "zod";

export const leadSchemas = {
    create: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.union([z.string().email(), z.literal("")]).optional().transform((value) => (value ? value : undefined)),
        phone: z.string().min(1).optional(),
        status: z.string().optional(),
        leadSource: z.string().optional(),
        interestType: z.string().optional(),
        city: z.string().optional(),
        budgetRange: z.union([z.string(), z.number()]).optional(),
        notes: z.string().optional(),
    }).passthrough(),
    update: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.union([z.string().email(), z.literal("")]).optional().transform((value) => (value ? value : undefined)),
        phone: z.string().min(1).optional(),
        status: z.string().optional(),
        leadSource: z.string().optional(),
        interestType: z.string().optional(),
        city: z.string().optional(),
        budgetRange: z.union([z.string(), z.number()]).optional(),
        notes: z.string().optional(),
    }).passthrough()
};
