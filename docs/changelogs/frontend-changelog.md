# Frontend Change Log

## [Unreleased] - 2024-05-23

### Changed
- **RTL Enforcement**: Bulk replaced legacy Tailwind direction classes with logical properties:
  - `text-left` -> `text-start`
  - `text-right` -> `text-end`
  - `ml-*` -> `ms-*`
  - `mr-*` -> `me-*`
  - `pl-*` -> `ps-*`
  - `pr-*` -> `pe-*`
  - `border-l` -> `border-s`
  - `border-r` -> `border-e`
- **Typography**: Verified `IBM Plex Sans Arabic` and `Noto Kufi Arabic` configuration in `tailwind.config.ts`.
- **Configuration**: Verified `dir="rtl"` in `index.html`.

### Fixed
- **Layout**: Improved RTL compatibility for sidebar, forms, and data tables.
