import { z } from "zod";

export const listingSchemas = {
    create: z.object({
        title: z.string(),
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        price: z.union([z.number(), z.string()]),
        propertyCategory: z.string(),
        propertyType: z.string(),
        ownerId: z.string().optional(),
        createdBy: z.string().optional(),
        moderationStatus: z.string().optional(),
        status: z.string().optional(),
    }),
    update: z.object({
        title: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        price: z.union([z.number(), z.string()]).optional(),
        propertyCategory: z.string().optional(),
        propertyType: z.string().optional(),
        ownerId: z.string().optional(),
        createdBy: z.string().optional(),
        moderationStatus: z.string().optional(),
        status: z.string().optional(),
    })
};
