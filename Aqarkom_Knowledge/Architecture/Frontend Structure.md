---
tags: [architecture, frontend, react]
created: 2026-04-10
---

# Frontend Structure

**Root:** `apps/web/src`

## Layout

```
apps/web/src/
├── components/
│   ├── ui/              # shadcn primitives (button, card, dialog, ...)
│   ├── admin/           # admin-only widgets (AdminCard, AdminTable, ...)
│   ├── dashboard/       # MetricCard, RevenueChart, ...
│   ├── layout/          # header, sidebar, page wrappers
│   └── skeletons/       # loading states
├── pages/
│   ├── platform/        # main agent app (91 pages total)
│   ├── admin/           # /admin/* — platform admin
│   ├── client/          # buyer/seller portal
│   └── map/             # public map view
├── lib/                 # utils, auth, query client
├── hooks/               # useAuth, useToast, ...
├── config/              # platform-theme, design-tokens
└── index.css            # CSS variable tokens (HSL emerald)
```

## Routing
- **wouter** for client-side routing
- 57 top-level routes
- Auth guards in `lib/auth.ts`

## Theming
- HSL tokens in `index.css` — emerald hue 160
- Dark mode via `class="dark"` on `html`
- All colors via CSS variables (`bg-background`, `text-foreground`, etc.)
- No hardcoded hex colors — see [[Decisions/ADR Index]] (design tokens unification)

## Key conventions
- Forms: react-hook-form + zod
- Data: TanStack React Query, query keys = API path
- Toasts: shadcn `useToast`, destructive variant uses soft `bg-destructive/10`
- Tables: zero-padding pattern `[&_td]:px-2 [&_td]:py-1.5`
