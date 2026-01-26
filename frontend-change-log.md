# Frontend Change Log

## 2026-01-26 – Admin Layout Unification

### What Changed
- Refactored 10+ Admin pages (`dashboard`, `user-management`, etc.) to use a standardized `AdminLayout`.
- Updated `App.tsx` routing to prioritize specific admin routes.
- **New Components**: Created `AdminDialog`, `AdminSheet`, and `AdminTabs` wrappers to enforce RTL design rules (e.g., logical side mapping).
- **Architecture**: Refactored `AdminLayout`, `AdminSidebar`, `AdminHeader` to use logical CSS properties (`start`, `end`, `ms`) instead of physical ones (`left`, `right`, `ml`).
- **Typography**: Added `IBM Plex Sans Arabic` to `index.html` as the primary enterprise font.

### Why This Change Was Made
- **Consistency**: Enforce a single source of truth for the Admin Shell and RTL behavior.
- **RTL Integrity**: Logical properties ensure correct layout mirroring without fragile conditional CSS.
- **Standardization**: Component wrappers prevent "off-the-shelf" usage of Shadcn components that might violate RTL design patterns (e.g., Drawers appearing on the wrong side).

### Impact
- Eliminates "double header" bugs.
- Simplifies future global layout updates (e.g., adding a notification drawer).
- Reduces code duplication across admin pages.

### Notes / Trade-offs
- Requires `AdminLayout` to expose flexible props (`actions`, `isLoading`) to handle diverse page requirements.
