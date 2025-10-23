# Platform Layout Guidelines

To keep the Home/Platform experience stable across all pages, follow these conventions when adding new screens that live inside the platform shell.

## Structural requirements

- Always render platform pages inside `PlatformShell` so that the shared `<Header />` and `<Sidebar />` stay mounted across navigation.
- The shell now uses the shadcn/ui `SidebarProvider` + `SidebarInset` primitives. Keep the markup order as `[ShellSidebar][SidebarInset]` and let the shell decide whether the sidebar sits on the right (RTL) or left (LTR). Do not manually reorder or duplicate the sidebar wrapper.
- Set `dir="rtl"` on any intermediate wrapper only if you need to force RTL rendering for isolated subtrees. Never override it with `dir="ltr"` unless the view is intentionally LTR.

## Tailwind layout classes

- Use container utilities that respect the existing shell spacing, e.g. wrap screen content with `pageContainer` (already provided by the shell) instead of adding new `px-*` paddings on the outermost element.
- Avoid classes that pin layout to the left, such as `left-0`, `ml-*`, or `flex-row`, when building sidebar-aware components. Prefer logical direction utilities (`right-0`, `mr-*`) or rely on the logical properties that the shell already applies through the shadcn sidebar.
- Give side panels and navigation elements explicit widths (`--sidebar-width` or Tailwind width utilities) and scrolling behavior (`overflow-y-auto`) so that content changes do not trigger layout reflow.

## Interaction patterns

- The mobile sidebar is controlled by the shell. Do not mount additional overlays or duplicate the sidebar content in page components.
- When adding buttons that toggle the sidebar, hide them on large breakpoints with `lg:hidden` to prevent desktop layout shifts.

Adhering to these rules keeps the sidebar fixed on the right edge, eliminates flicker during route transitions, and ensures Lighthouse does not report cumulative layout shift (CLS) regressions from navigation chrome.
