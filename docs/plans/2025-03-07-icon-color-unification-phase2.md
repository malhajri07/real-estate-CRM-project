# Icon Color Unification Phase 2 — Full Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit all colored icons (in span, div, Button, or any element), unify to a single color (text-slate-600), and ensure hover states use a similar shade (e.g. text-slate-700) — no colorful icons even on hover.

**Architecture:** Replace all icon-related color classes (blue, emerald, purple, amber, rose, etc.) with slate. Hover: `hover:text-slate-700 hover:bg-slate-100` instead of `hover:text-blue-600 hover:bg-blue-50`. Exclude semantic colors (form errors, status badges, destructive actions).

**Tech Stack:** Tailwind CSS, lucide-react, shadcn/ui

---

## Unified Icon Color Rules

| Context | Default | Hover/Focus |
|---------|---------|-------------|
| Icon color | `text-slate-600` | `text-slate-700` |
| Icon container bg | `bg-slate-100` | `bg-slate-200` or `hover:bg-slate-100` |
| Icon button | `text-slate-400` | `text-slate-600 hover:bg-slate-100` |

**Exclusions (do NOT change):**
- Form validation: `text-red-500` for required `*`, error messages
- Destructive actions: `text-red-600` for delete/reject (semantic)
- Status badges: `bg-emerald-50 text-emerald-700` for "Connected", etc. (semantic)
- Primary CTA buttons: `bg-emerald-600` (brand — optional, can leave)

---

## Task 1: Admin MetricCard Icon Container Hover

**Files:** `apps/web/src/components/admin/data-display/AdminCard.tsx`

**Current:** Line 75 — `group-hover:bg-blue-600 group-hover:text-white`

**Change to:** `group-hover:bg-slate-200 group-hover:text-slate-700`

**Step 1:** Edit AdminCard.tsx line 75
**Step 2:** Run `npx tsc --noEmit` — no new errors

---

## Task 2: Admin Pages — Icon Button Hovers

**Files:**
- `apps/web/src/pages/admin/analytics-management.tsx` — line 117: `hover:text-blue-600` → `hover:text-slate-600`
- `apps/web/src/pages/admin/notifications-management.tsx` — lines 102-103: `hover:text-blue-600 hover:bg-blue-50` → `hover:text-slate-600 hover:bg-slate-100`
- `apps/web/src/pages/admin/billing-management.tsx` — lines 152-154: same
- `apps/web/src/pages/admin/security-management.tsx` — line 55: `group-focus-within:text-blue-500` → `group-focus-within:text-slate-600`; line 115: `hover:text-blue-600 hover:bg-blue-50` → `hover:text-slate-600 hover:bg-slate-100`
- `apps/web/src/pages/admin/complaints-management.tsx` — lines 141, 206, 253, 261: `group-focus-within:text-blue-500`, `hover:text-blue-600`, `group-hover:text-blue-500` → `text-slate-600` / `hover:text-slate-700`
- `apps/web/src/pages/admin/user-management.tsx` — lines 365, 558, 571, 597, 630, 663: `hover:text-blue-600`, `group-focus-within:text-blue-600` etc. → `hover:text-slate-700` / `group-focus-within:text-slate-600`
- `apps/web/src/pages/admin/features-management.tsx` — lines 154, 173, 187-188: `group-focus-within:text-blue-500`, `bg-blue-50 text-blue-600`, `hover:text-blue-600` → slate
- `apps/web/src/pages/admin/navigation-management.tsx` — line 263: `text-emerald-600` → `text-slate-600`
- `apps/web/src/pages/admin/moderation.tsx` — lines 122, 131: approve/reject buttons — keep red for reject (destructive), change approve `text-emerald-600` → `text-slate-600`; hover `hover:text-emerald-700` → `hover:text-slate-700`
- `apps/web/src/pages/admin/system-settings.tsx` — line 256: `group-hover:text-blue-600` → `group-hover:text-slate-600`

---

## Task 3: Platform Pages — Icon Colors

**Files:**
- `apps/web/src/pages/platform/settings/PreferencesSection.tsx` — lines 45, 57: `bg-emerald-100 text-emerald-600`, `bg-blue-100 text-blue-600` → `bg-slate-100 text-slate-600`
- `apps/web/src/pages/platform/calendar/index.tsx` — lines 230, 235: Accept/Reject buttons — keep red for Reject; Accept `text-emerald-600 hover:text-emerald-700` → `text-slate-600 hover:text-slate-700`
- `apps/web/src/pages/map/index.tsx` — lines 449, 567, 618: `text-emerald-600` → `text-slate-600`
- `apps/web/src/pages/map/components/PropertiesList.tsx` — lines 212, 238: `text-red-600`, `text-purple-600` (icon buttons) → `text-slate-600` (unless destructive)
- `apps/web/src/components/dashboard/LeadCard.tsx` — line 147: `text-emerald-600` → `text-slate-600`

---

## Task 4: Landing & Marketing — Icon Hovers

**Files:**
- `apps/web/src/components/landing/FeatureGrid.tsx` — line 107: `group-hover:text-emerald-600` (title, not icon) — change to `group-hover:text-slate-700` for consistency
- `apps/web/src/components/landing/SolutionsSection.tsx` — line 85: same
- `apps/web/src/pages/marketing/board.tsx` — line 267: `text-emerald-600` (Sparkles icon) → `text-slate-600`

---

## Task 5: Auth, Signup, Requests — Icon Colors

**Files:**
- `apps/web/src/components/auth/LoginForm.tsx` — line 92: `text-emerald-600 hover:text-emerald-700` (link) → `text-slate-600 hover:text-slate-700`
- `apps/web/src/pages/signup/corporate.tsx` — lines 673, 687, 701: `group-hover:text-blue-600` (Upload icon) → `group-hover:text-slate-600`

---

## Task 6: Query Error Fallback & Misc UI

**Files:**
- `apps/web/src/components/ui/query-error-fallback.tsx` — line 25: `bg-amber-100 text-amber-600` (AlertCircle icon) → `bg-slate-100 text-slate-600`
- `apps/web/src/pages/admin/security-management.tsx` — lines 191, 218, 220, 237: icon containers `bg-blue-50 text-blue-600` → `bg-slate-100 text-slate-600`
- `apps/web/src/pages/admin/features-management.tsx` — lines 130, 173, 214, 243: `bg-emerald-50 text-emerald-600`, `bg-blue-50 text-blue-600`, `Crown text-amber-500` → slate
- `apps/web/src/pages/admin/integrations-management.tsx` — icon containers and hovers → slate

---

## Task 7: Dashboard & Revenue — Remaining Icon Colors

**Files:**
- `apps/web/src/pages/admin/dashboard.tsx` — line 301: agent avatar `bg-blue-600/10 text-blue-600` — change to `bg-slate-100 text-slate-600`; line 316: GMV text can stay or use slate
- `apps/web/src/pages/admin/revenue-management.tsx` — lines 316, 390, 501: icon containers `bg-blue-50 text-blue-600` → `bg-slate-100 text-slate-600`; line 506: `hover:text-blue-600` → `hover:text-slate-700`

---

## Task 8: Verification & Memory Bank

**Step 1:** Run full grep for remaining colorful icon patterns:
```bash
rg "text-(blue|emerald|purple|amber|rose)-[0-9]+" apps/web/src --type-add 'web:*.{ts,tsx}' -t web
rg "hover:text-(blue|emerald|purple|amber|rose)" apps/web/src -t web
rg "group-hover:text-(blue|emerald|purple|amber|rose)" apps/web/src -t web
rg "group-focus-within:text-(blue|emerald|purple|amber|rose)" apps/web/src -t web
```

**Step 2:** Fix any remaining matches (excluding semantic: errors, destructive, status badges)

**Step 3:** Update `lib/icon-styles.ts` — add `ICON_HOVER = "hover:text-slate-700 hover:bg-slate-100"` if useful

**Step 4:** Update `.cursor/rules/memory-bank/activeContext.md` — add Phase 2 completion entry

---

## Execution Order

1. Task 1 (AdminCard)
2. Tasks 2–3 (Admin + Platform icon buttons/containers)
3. Tasks 4–5 (Landing, Auth, Signup)
4. Tasks 6–7 (Misc, Dashboard, Revenue)
5. Task 8 (Verification, memory bank)
