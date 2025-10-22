# Styling Guidelines

- Use Tailwind CSS utility classes or component-level variants exclusively. Avoid authoring standalone CSS files or module styles.
- Leverage the design tokens defined in `tailwind.config.ts` (`background`, `foreground`, `sidebar`, `brand`, etc.) to ensure visual consistency across the `/home` workspace.
- Prefer composable helpers from `@/lib/design-system` (e.g., `surfaceCard`, `sectionShell`) when building new sections to keep spacing and elevation consistent.
- Add new global primitives through Tailwind plugins (`addBase`, `addComponents`, `addUtilities`) instead of editing `index.css`.
- Keep interactive surfaces responsive by pairing color changes with transition utilities such as `transition-colors`, `duration-200`, and `ease-in-out`.
- Reuse the shared overlay (`ui-overlay`), stack (`ui-stack`), and meter (`ui-meter`) component classes exported from the Tailwind plugin when composing popovers, stacked bars, and progress meters so every interactive layer inherits the same motion curve and rounded geometry.
- When rendering map markers or Leaflet popups via HTML strings, author the markup entirely with Tailwind utility classes (e.g., `rounded-3xl`, `bg-slate-900/90`, `shadow-[...]`) and reuse the same color tokens that surface cards use so pins, balloons, and sidebar surfaces feel unified.
- Clamp numeric inputs before computing widths or flex-basis values and feed them through CSS custom properties (`--meter-fill`, `--stack-segment`) instead of hard-coded inline styles; prefer CSS variables or data attributes when passing dynamic measurements.
