/**
 * billingAdmin.ts - Billing Admin Utilities
 * 
 * Location: apps/web/src/ → Lib/ → billingAdmin.ts
 * 
 * Billing admin utility functions and hooks. Provides:
 * - Revenue analytics
 * - Subscription management
 * - Plan management
 * - Transaction history
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

// --- Types ---

export interface AdminBillingAnalytics {
    totalRevenue: number;
    activeSubscriptions: number;
    revenueChartData: { name: string; revenue: number }[];
    subscriptionDistribution: { name: string; value: number }[];
    recentTransactions: AdminTransaction[];
}

export interface AdminTransaction {
    id: string;
    user: string;
    plan: string;
    amount: string;
    status: string;
    date: string;
}

export interface AdminSubscription {
    id: string;
    userId: string;
    planId: string;
    status: string;
    startDate: string;
    endDate: string;
    user?: {
        firstName: string | null;
        lastName: string | null;
        email: string;
        username: string;
    };
    plan?: {
        nameAr: string | null;
        nameEn: string | null;
        price: string;
        currency: string;
    };
}

export interface AdminPlanFeature {
    id: string;
    nameAr: string | null;
    nameEn: string | null;
    code: string;
}

export interface AdminPlan {
    id: string;
    nameAr: string | null;
    nameEn: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    price: string;
    currency: string;
    billingPeriod: string;
    isActive: boolean;
    pricing_plan_features?: AdminPlanFeature[];
}

// --- Keys ---

const BILLING_ANALYTICS_KEY = ["billing-admin", "analytics"] as const;
const BILLING_SUBSCRIPTIONS_KEY = ["billing-admin", "subscriptions"] as const;
const BILLING_PLANS_KEY = ["billing-admin", "plans"] as const;

// --- Helpers ---

const ensureSuccess = <T extends { success?: boolean; message?: string }>(payload: T): T => {
    // Relaxed check for strict success flag if data is present, adapting to different API styles
    if (payload.success === false) {
        throw new Error(payload.message ?? "حدث خطأ غير متوقع");
    }
    return payload;
};

// --- Hooks ---

export const useAdminBillingAnalytics = () => {
    return useQuery<AdminBillingAnalytics, Error>({
        queryKey: BILLING_ANALYTICS_KEY,
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/billing/analytics");
            return await res.json();
        },
    });
};

export const useAdminSubscriptions = () => {
    return useQuery<AdminSubscription[], Error>({
        queryKey: BILLING_SUBSCRIPTIONS_KEY,
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/billing/subscriptions");
            // Expecting array directly or wrap in object
            const json = await res.json();
            return Array.isArray(json) ? json : (json.subscriptions || []);
        },
    });
};

export const useAdminPlans = () => {
    return useQuery<AdminPlan[], Error>({
        queryKey: BILLING_PLANS_KEY,
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/billing/plans");
            const json = await res.json();
            return Array.isArray(json) ? json : (json.plans || []);
        },
    });
};

// --- Mutations ---

export const useSeedBillingData = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/billing/seed");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["billing-admin"] });
        },
    });
};
