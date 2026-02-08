# Database Change Log

## 2026-01-27 – Migration Cleanup & Synchronization

### What Changed
1.  **Renamed Migration:** `20250915202129_init` → `20250101000000_init`.
2.  **Deleted Migration:** `20251031233847_add_property_listings` (Empty directory).
3.  **Renamed Migration for Order:** `20250202000000_admin_core_schema` → `20250202000001_admin_core_schema`.
4.  **Merged Migration:** `20250202001000_seed_admin_core` merged into `20250202000001_admin_core_schema`.
5.  **Fixed Migration:** `20250202003000_add_domain_entities`
    - Converted `id` from `UUID` to `TEXT` for: `property_units`, `property_media`, `customers`, `inquiries`, `appointments`, `deals`, `support_tickets`, `billing_payouts`.
    - Added `SET search_path = public` to enforce namespace.
6.  **Added Migration:** `add_forum_and_pool` (Pending application).

### Why This Change Was Made
1.  **Fix Shadow DB Error:** Corrected `init` timestamp to run first.
2.  **Resolve Timestamp Conflict:** Renamed `admin_core` to avoid collision with `add_property_type`.
3.  **Fix Seed Dependency:** Merged seed data directly into the schema creation file.
4.  **Fix Foreign Key Type Mismatches:**
    - `listings.unitId` (TEXT) → `property_units.id` (was UUID, now TEXT).
    - `listings.sellerCustomerId` (TEXT) → `customers.id` (was UUID, now TEXT).
    - Other entities (`inquiries`, `appointments`, etc.) also normalized to TEXT to match the Prisma Schema definition (`String @id`) and prevent future mismatch errors with the legacy schema.

### Impact
- Resolves multiple P3006 `incompatible types: text and uuid` errors.
- Ensures consistent ID typing across the entire domain model.

### Notes / Trade-offs
- Modified migration history files. Requires a dev environment reset or sloppy mode if applied to a tracked environment.
