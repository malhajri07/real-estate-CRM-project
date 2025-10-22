# Styling Guidelines

- Use Tailwind CSS utility classes or component-level variants exclusively. Avoid authoring standalone CSS files or module styles.
- Leverage the design tokens defined in `tailwind.config.ts` (`background`, `foreground`, `sidebar`, `brand`, etc.) to ensure visual consistency across the `/home` workspace.
- Prefer composable helpers from `@/lib/design-system` (e.g., `surfaceCard`, `sectionShell`) when building new sections to keep spacing and elevation consistent.
- Add new global primitives through Tailwind plugins (`addBase`, `addComponents`, `addUtilities`) instead of editing `index.css`.
- Keep interactive surfaces responsive by pairing color changes with transition utilities such as `transition-colors`, `duration-200`, and `ease-in-out`.
