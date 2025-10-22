# Experience & Styling Recommendations

## Quick Wins
- Adopt the shared Tailwind primitives (`ui-overlay`, `ui-stack`, `ui-meter`) whenever a new interactive layer is introduced so hover, focus, and motion easing stay aligned across dashboards, modals, and dropdowns.
- Replace legacy inline style fragments with CSS variable driven utilities as demonstrated in the analytics, reporting, and map modules to keep the bundle free from ad-hoc styling.
- Audit any remaining third-party widgets (e.g., Leaflet markers) and wrap their markup generators with helpers that map palette tokens to Tailwind-friendly values.
- Use the database summary in `DATABASE_SCHEMA_SUMMARY.md` to validate assumptions about numeric precision (decimal vs integer) when formatting KPIs or aggregating totals inside UI components.

## Deep Dive Opportunities
- **Sidebar information architecture**: Evaluate the nested navigation groups in `platformSidebarConfig` and consider progressive disclosure for dense modules (marketing, marketplace) using section-specific quick links or badges sourced from live metrics.
- **Analytics surface cohesion**: Introduce reusable chart descriptors that bind legend, tooltip, and stacked meter styles via the chart context (`@/components/ui/chart`) so third-party contributions inherit the same aesthetic automatically.
- **Modal & popover ecosystem**: Consolidate Radix-powered overlays (dialog, dropdown, select) behind a shared headless wrapper that applies the overlay utilities, focus ring, and safe-area padding, reducing risk of pointer-event regressions.
- **Performance telemetry**: Leverage the schema tables for `audit_logs`, `contact_logs`, and `revenueStats` derivatives to build drill-down cards that connect UI metrics with the exact relational sources, easing cross-team debugging.
- **Localization fidelity**: Pair `useLanguage` output with typography utilities that switch between `font-arabic` and `font-sans` families on a per-component basis, ensuring RTL-first layouts retain typographic rhythm.

## Data-Driven Guardrails
- When surfacing percentages in stacked bars or meters, clamp the computed value to `[0, 100]` before applying it to `--meter-fill` or `--stack-segment`.
- Treat optional decimal columns (e.g., `listings.price`, `buyer_requests.maxPrice`) as nullable when aggregating to avoid `NaN` results in KPIs.
- For `DateTime` fields, normalize to ISO strings before passing to chart components so the tooltip formatters stay locale-safe.
