# apiRequest → apiClient Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all remaining `apiRequest` usages to `apiClient` (apiGet, apiPost, apiPut, apiPatch, apiDelete), then deprecate `apiRequest`.

**Architecture:** Replace `apiRequest(method, url, body)` with typed helpers. `apiClient` returns parsed JSON and throws on non-2xx. Remove `.json()` calls and simplify error handling.

**Tech Stack:** React Query, apiClient (apps/web/src/lib/apiClient.ts), TypeScript

---

## Current State (verified via grep)

**Files still using `apiRequest` (undefined/broken - not imported):**
- `apps/web/src/pages/admin/moderation.tsx` — 1 usage
- `apps/web/src/lib/billingAdmin.ts` — 1 usage
- `apps/web/src/lib/rbacAdmin.ts` — 10 usages (getJson + mutations)

**Already migrated:** forum, notifications, pipeline, pool, add-property-modal, send-whatsapp-modal, LandingStudio, cms-landing, templates-management, articles-management, media-library, billing-management, notifications-management, analytics-management, requests, seo-management, unverified-listings-management, dashboard, security-management, useMapProperties, useMapLocations, useCMSLandingSections, supportAdmin

---

### Task 1: Migrate moderation.tsx

**Files:**
- Modify: `apps/web/src/pages/admin/moderation.tsx`

**Step 1: Replace apiRequest with apiGet**

Change:
```tsx
queryFn: async () => {
  const res = await apiRequest("GET", "/api/moderation/queue");
  return res.json();
}
```

To:
```tsx
queryFn: async () => apiGet<Property[]>("api/moderation/queue")
```

**Step 2: Verify**

Run: `pnpm dev` (or `npx tsc --noEmit` from workspace root)
Expected: No TypeScript errors in moderation.tsx

---

### Task 2: Migrate billingAdmin.ts

**Files:**
- Modify: `apps/web/src/lib/billingAdmin.ts`

**Step 1: Replace apiRequest with apiGet**

Change:
```ts
queryFn: async () => {
  const res = await apiRequest("GET", "/api/billing/subscriptions");
  const json = await res.json();
  return Array.isArray(json) ? json : (json.subscriptions || []);
},
```

To:
```ts
queryFn: async () => {
  const json = await apiGet<AdminSubscription[] | { subscriptions?: AdminSubscription[] }>("api/billing/subscriptions");
  return Array.isArray(json) ? json : (json.subscriptions || []);
},
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors in billingAdmin.ts

---

### Task 3: Migrate rbacAdmin.ts — getJson helper

**Files:**
- Modify: `apps/web/src/lib/rbacAdmin.ts`

**Step 1: Replace getJson to use apiGet**

Change:
```ts
async function getJson<T>(url: string): Promise<T> {
  const res = await apiRequest("GET", url);
  return res.json() as Promise<T>;
}
```

To:
```ts
async function getJson<T>(url: string): Promise<T> {
  return apiGet<T>(url.replace(/^\//, ""));
}
```

Note: apiClient expects path without leading slash for relative paths, or with "api/..." format. The url passed is like `/api/rbac-admin/...` — apiGet accepts `api/rbac-admin/...` (strip leading slash).

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

---

### Task 4: Migrate rbacAdmin.ts — useUpdateAdminUser

**Files:**
- Modify: `apps/web/src/lib/rbacAdmin.ts:366-377`

**Step 1: Replace apiRequest PUT with apiPut**

Change:
```ts
mutationFn: async ({ id, ...payload }) => {
  const res = await apiRequest("PUT", `/api/rbac-admin/users/${id}`, payload);
  const json = (await res.json()) as AdminUserMutationResponse;
  if (!json.success || !json.user) {
    throw new Error(json.message ?? "فشل تحديث المستخدم");
  }
  return json.user;
},
```

To:
```ts
mutationFn: async ({ id, ...payload }) => {
  const json = await apiPut<AdminUserMutationResponse>(`api/rbac-admin/users/${id}`, payload);
  if (!json.success || !json.user) {
    throw new Error(json.message ?? "فشل تحديث المستخدم");
  }
  return json.user;
},
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

---

### Task 5: Migrate rbacAdmin.ts — useDeleteAdminUser

**Files:**
- Modify: `apps/web/src/lib/rbacAdmin.ts:446-449`

**Step 1: Replace apiRequest DELETE with apiDelete**

Change:
```ts
mutationFn: async ({ id }) => {
  await apiRequest("DELETE", `/api/rbac-admin/users/${id}`);
},
```

To:
```ts
mutationFn: async ({ id }) => {
  await apiDelete(`api/rbac-admin/users/${id}`);
},
```

---

### Task 6: Migrate rbacAdmin.ts — useCreateAdminRole, useUpdateAdminRole, useDeleteAdminRole

**Files:**
- Modify: `apps/web/src/lib/rbacAdmin.ts`

**Step 1: useCreateAdminRole** — Replace apiRequest POST with apiPost

Change:
```ts
mutationFn: async (payload) => {
  const res = await apiRequest("POST", "/api/rbac-admin/roles", payload);
  const json = await res.json();
  ...
}
```

To:
```ts
mutationFn: async (payload) => {
  const json = await apiPost<{ success?: boolean; role?: AdminRole; message?: string }>("api/rbac-admin/roles", payload);
  ...
}
```

**Step 2: useUpdateAdminRole** — Replace apiRequest PUT with apiPut

**Step 3: useDeleteAdminRole** — Replace apiRequest DELETE with apiDelete

---

### Task 7: Migrate rbacAdmin.ts — Organizations (create, update, delete)

**Files:**
- Modify: `apps/web/src/lib/rbacAdmin.ts`

**Step 1: useCreateAdminOrganization** — apiRequest POST → apiPost

**Step 2: useUpdateAdminOrganization** — apiRequest PUT → apiPut

**Step 3: useDeleteAdminOrganization** — apiRequest DELETE → apiDelete

---

### Task 8: Deprecate apiRequest and update ARCHITECTURE.md

**Files:**
- Modify: `apps/web/src/lib/queryClient.ts`
- Modify: `docs/ARCHITECTURE.md`

**Step 1: Add deprecation to apiRequest**

In queryClient.ts, add JSDoc:
```ts
/**
 * @deprecated Use apiGet, apiPost, apiPut, apiPatch, apiDelete from @/lib/apiClient instead.
 */
export async function apiRequest(...)
```

**Step 2: Update ARCHITECTURE.md**

Remove or update the line: "Auth token is attached automatically. Use for new code; existing `apiRequest` remains for compatibility."

Replace with: "Use apiClient (apiGet, apiPost, etc.) from @/lib/apiClient for all API requests. apiRequest is deprecated."

**Step 3: Update REBUILD_PLAN.md**

Mark Phase 1 complete, Phase 3 complete.

---

## Execution Order

1. Task 1: moderation.tsx
2. Task 2: billingAdmin.ts
3. Tasks 3–7: rbacAdmin.ts (can batch)
4. Task 8: Deprecate apiRequest, update docs
