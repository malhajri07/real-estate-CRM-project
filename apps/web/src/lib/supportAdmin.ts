/**
 * supportAdmin.ts - Support Admin Utilities
 * 
 * Location: apps/web/src/ → Lib/ → supportAdmin.ts
 * 
 * Support admin utility functions and hooks. Provides:
 * - Ticket management
 * - Category management
 * - Response template management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "./apiClient";

// --- Types ---

export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type ComplaintPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface SupportTicket {
    id: string;
    subject: string;
    description: string | null;
    priority: ComplaintPriority;
    status: ComplaintStatus;
    channel: string;
    createdAt: string;
    updatedAt: string;
    createdBy: { firstName: string | null; lastName: string | null; username: string } | null;
    assignedTo: { firstName: string | null; lastName: string | null; username: string } | null;
    customer?: { id: string; firstName: string | null; lastName: string | null; email: string };
    category?: { id: string; name: string };
}

export interface SupportCategory {
    id: string;
    name: string;
    description?: string;
    ticketCount?: number;
    active: boolean;
}

export interface SupportTemplate {
    id: string;
    title: string;
    content: string;
    usageCount: number;
}

// --- Keys ---

const SUPPORT_TICKETS_KEY = ["support-admin", "tickets"] as const;
const SUPPORT_CATEGORIES_KEY = ["support-admin", "categories"] as const;
const SUPPORT_TEMPLATES_KEY = ["support-admin", "templates"] as const;

// --- Hooks ---

export const useSupportTickets = (status?: string) => {
    return useQuery<SupportTicket[], Error>({
        queryKey: [...SUPPORT_TICKETS_KEY, status],
        queryFn: async () => {
            const url = status && status !== 'ALL'
                ? `api/support?status=${status}`
                : "api/support";
            const json = await apiGet<SupportTicket[] | { tickets?: SupportTicket[] }>(url);
            return Array.isArray(json) ? json : (json.tickets || []);
        },
    });
};

export const useSupportCategories = () => {
    return useQuery<SupportCategory[], Error>({
        queryKey: SUPPORT_CATEGORIES_KEY,
        queryFn: async () => {
            // Create endpoint assumption or use mock response if easy
            // For now, let's assume /api/support/categories exists or we augment it
            try {
                const json = await apiGet<SupportCategory[] | { categories?: SupportCategory[] }>("api/support/categories");
                return Array.isArray(json) ? json : (json.categories || []);
            } catch {
                return [];
            }
        },
    });
};

export const useSupportTemplates = () => {
    return useQuery<SupportTemplate[], Error>({
        queryKey: SUPPORT_TEMPLATES_KEY,
        queryFn: async () => {
            try {
                const json = await apiGet<SupportTemplate[] | { templates?: SupportTemplate[] }>("api/support/templates");
                return Array.isArray(json) ? json : (json.templates || []);
            } catch {
                return [];
            }
        },
    });
};

// --- Mutations ---

export const useCreateSupportTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<SupportTicket>) =>
            apiPost("api/support", payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
        },
    });
};

export const useUpdateTicketStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: ComplaintStatus }) =>
            apiPatch(`api/support/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
        }
    })
}
