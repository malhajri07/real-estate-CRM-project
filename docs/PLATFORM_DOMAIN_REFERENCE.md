# Platform Domain Reference

This guide maps each `/home/platform` surface to its primary data sources and notable field types so feature teams can align UX decisions with the underlying schema.

## Customer Workbench (`sidebar.customers`)

| Route | Primary tables | Key fields & types |
| --- | --- | --- |
| `/home/platform/customers` | `customers` | `id` (`String`, `@default(uuid())`), `type` (`CustomerType`), `phone` (`String`), `preferredLanguage` (`String?`), relational links to `leads`, `appointments`, and `support_tickets`. |
| `/home/platform/properties` | `properties`, `listings` | `properties.id` (`String`), `price` (`Decimal?`), `status` (`PropertyStatus?`); `listings.status` (`ListingStatus`), `publishedAt` (`DateTime?`). |
| `/home/platform/leads` | `leads`, `contact_logs` | `leads.status` (`LeadStatus`), `priority` (`Int?`), optional relations to `customers` and `buyer_requests`; each lead spawns `contact_logs` rows with timestamps. |
| `/home/platform/pipeline` | `deals` | `stage` (`DealStage`), `expectedCloseDate` (`DateTime?`), `agreedPrice` (`Decimal?`), references to `customers`, `listings`, and `users`. |
| `/home/platform/clients` | `organizations`, `customers` | `organizations.legalName` (`String`), `status` (`OrganizationStatus`), `primaryContactId` (`String?`); clients also reuse `customers` rows when acting as sellers. |
| `/home/platform/reports` | `analytics_event_logs`, `deals`, `listings` | Event logs expose raw metrics (`Json` payloads), while `deals` and `listings` deliver revenue and inventory dimensions. |
| `/home/platform/notifications` | `support_tickets`, `appointments` | Ticket `status` (`SupportTicketStatus`) and appointment scheduling fields (`scheduledAt` `DateTime`) drive notification counts. |
| `/home/platform/settings` | `organization_settings`, `users` | Workspace preferences live in `organization_settings` while ownership and locale defaults come from `users` and `organizations`. |
| `/home/platform/marketing-requests` | `buyer_requests`, `seller_submissions` | Buyer briefs include `minPrice`/`maxPrice` (`Decimal?`) and channel preferences; seller submissions capture inventory intake metadata. |

## Corporate Management Exclusives (`sidebar.corporateExclusive`)

| Route | Primary tables | Key fields & types |
| --- | --- | --- |
| `/home/platform/agencies` | `organizations`, `agent_profiles` | Licensing (`licenseNo`), verification status (`OrganizationStatus`), linked agent roster via `agent_profiles`. |
| `/home/platform/agency/:id` | `organizations`, `agent_profiles`, `listings` | Combines organization profile fields with active listings and agent biographies. |
| `/home/platform/customer-requests` | `buyer_requests`, `claims` | Request `status` (`BuyerRequestStatus`), budget ranges (`Decimal?`), and claim ownership metadata for internal routing. |

## Cross-role Utilities (`sidebar.crossRole`)

| Route | Existing tables | Implementation notes |
| --- | --- | --- |
| `/home/platform/favorites` | `listings`, `properties` | Uses listing metadata for card rendering; requires a new junction (e.g., `user_favorites`) keyed by `userId` and `listingId` to persist choices. |
| `/home/platform/saved-searches` | `listings`, `properties` | Relies on property filters; plan a persistence model for serialized criteria per user before enabling alerts. |
| `/home/platform/compare` | `properties` | Compare view can hydrate from property dimensions; introduce a lightweight snapshot table to cache selected property IDs per session. |
| `/home/platform/post-listing` | `listings`, `properties` | Listing creation touches pricing (`Decimal`), exclusivity flags (`Boolean`), and publication timestamps. |
| `/home/platform/agent/:id` | `agent_profiles`, `users` | Licensing (`licenseValidTo`), specialties (`String`), and associated `users` metadata. |
| `/home/platform/properties/:id` | `properties`, `property_media`, `inquiries` | Surface-level detail relies on property dimensions, gallery assets, and inquiry history. |
| `/home/platform/listing/:id` | `listings` | Public-facing listing states pair with inquiry counts; append audit history once a `listing_revisions` table lands. |
| `/home/platform/unverified-listings` | `listings` | Filter for `status` stages such as pending verification; include legacy alias `/home/platform/unverfied-listing`. |

Consult `docs/DATABASE_SCHEMA_SUMMARY.md` for the exhaustive field inventory and relation diagrams when expanding these modules.
