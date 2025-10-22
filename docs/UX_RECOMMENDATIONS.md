# Experience & Styling Recommendations

## Quick Wins
- Adopt the shared Tailwind primitives (`ui-overlay`, `ui-stack`, `ui-meter`) whenever a new interactive layer is introduced so hover, focus, and motion easing stay aligned across dashboards, modals, and dropdowns.
- Replace legacy inline style fragments with CSS variable driven utilities as demonstrated in the analytics, reporting, and map modules to keep the bundle free from ad-hoc styling.
- Audit any remaining third-party widgets (e.g., Leaflet markers) and wrap their markup generators with helpers that map palette tokens to Tailwind-friendly values.
- Keep the "Customer Workbench" and "Corporate management" sidebar sections populated with contextual badge counts (open leads, pending agency verifications) sourced from the same queries powering `/home/platform/customers` and `/home/platform/agencies` so navigation feels situationally aware.
- Use the database summary in `DATABASE_SCHEMA_SUMMARY.md` to validate assumptions about numeric precision (decimal vs integer) when formatting KPIs or aggregating totals inside UI components.

## Deep Dive Opportunities
- **Sidebar information architecture**: Use the subgroup labels baked into `platformSidebarConfig` (`sidebar.customers.core`, `sidebar.crossRole.discovery`, etc.) to stage related actions together; surface meta counts (e.g., saved searches total) alongside each subgroup heading once the associated endpoints are ready.
- **Analytics surface cohesion**: Introduce reusable chart descriptors that bind legend, tooltip, and stacked meter styles via the chart context (`@/components/ui/chart`) so third-party contributions inherit the same aesthetic automatically.
- **Modal & popover ecosystem**: Consolidate Radix-powered overlays (dialog, dropdown, select) behind a shared headless wrapper that applies the overlay utilities, focus ring, and safe-area padding, reducing risk of pointer-event regressions.
- **Performance telemetry**: Leverage the schema tables for `audit_logs`, `contact_logs`, and `revenueStats` derivatives to build drill-down cards that connect UI metrics with the exact relational sources, easing cross-team debugging.
- **Localization fidelity**: Pair `useLanguage` output with typography utilities that switch between `font-arabic` and `font-sans` families on a per-component basis, ensuring RTL-first layouts retain typographic rhythm.

## Data-Driven Guardrails
- When surfacing percentages in stacked bars or meters, clamp the computed value to `[0, 100]` before applying it to `--meter-fill` or `--stack-segment`.
- Treat optional decimal columns (e.g., `listings.price`, `buyer_requests.maxPrice`) as nullable when aggregating to avoid `NaN` results in KPIs.
- For `DateTime` fields, normalize to ISO strings before passing to chart components so the tooltip formatters stay locale-safe.
- Align customer-ops dashboards with the `customers`, `leads`, `appointments`, and `support_tickets` tables (see `PLATFORM_DOMAIN_REFERENCE.md`) to ensure each metric lists its source relation and key data types during QA reviews.
