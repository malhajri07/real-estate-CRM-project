"""
C2 — Comment the Prisma schema with /// triple-slash docs.

Strategy:
- Read schema.prisma
- For every `model X {` line, if the line above is not already `///`, insert
  one or more /// lines describing purpose, domain, and key invariants.
- Same for `enum X {`.
- Also add inline /// for FK fields and calculated/derived columns where they
  add value (the file already has `//` line comments for REGA fields — leave
  those alone, just promote them to /// where the next session needs them
  in TypeDoc output).
- Idempotent: if a /// already exists immediately above, skip.

Convention: see Aqarkom_Knowledge/Engineering/Comment Style.md
"""
from pathlib import Path
import re

SCHEMA = Path("/Users/mohammedalhajri/real-estate-CRM-project/data/schema/prisma/schema.prisma")
text = SCHEMA.read_text()

# ─── Model descriptions (one or more /// lines per model) ───────────────────
MODEL_DOCS = {
    # ── Identity & Access ──
    "users": [
        "Master user account — agents, admins, customers, owners.",
        "All authentication and authorization flows hang off this table.",
        "Roles are stored as a comma-separated string in `roles` and joined out via `user_roles`.",
        "See [[Architecture/Authentication & RBAC]] in the vault.",
    ],
    "accounts": [
        "Imported broker / agency account records (REGA-style account numbers).",
        "Distinct from `users` — these are pre-existing entity registrations.",
    ],
    "agent_profiles": [
        "Per-agent extended profile — REGA license, FAL details, specialties, bio.",
        "1:1 with `users` (only users with INDIV_AGENT or CORP_AGENT role have one).",
        "FAL fields are required for compliance — see [[Features/REGA Compliance]].",
    ],
    "organizations": [
        "Tenancy / agency / brokerage. The org-isolation key for the entire app.",
        "Every multi-tenant table carries `organizationId` and is scoped via",
        "`injectOrgFilter` middleware — see [[Architecture/Org Isolation]].",
    ],
    "organization_memberships": [
        "Many-to-many: which users belong to which organization, with which role.",
        "Status tracks the invite lifecycle (INVITED → PENDING → ACTIVE).",
    ],
    "organization_settings": [
        "Per-org preferences — locale, timezone, notification routing, feature flags.",
        "1:1 with `organizations`.",
    ],
    "permissions": [
        "Catalog of permission keys (e.g. `leads.create`, `deals.delete`).",
        "Joined to `system_roles` via `role_permissions`.",
    ],
    "system_roles": [
        "Named role definitions — WEBSITE_ADMIN, CORP_OWNER, CORP_AGENT, INDIV_AGENT, SELLER, BUYER.",
        "Scope distinguishes platform-wide vs org-scoped roles.",
    ],
    "role_permissions": [
        "Junction: which permissions a role has. Maintained by RBAC admin UI.",
    ],
    "user_roles": [
        "Junction: which roles a user holds. A user can hold multiple roles simultaneously.",
    ],

    # ── CRM ──
    "leads": [
        "A Lead is the *opportunity* wrapping a customer + intent (buy / rent / sell).",
        "Distinct from `customers` which is the master record.",
        "Lifecycle: NEW → IN_PROGRESS → WON / LOST. Once WON, a `deals` row is created.",
        "Org-scoped via `organizationId`. See [[Features/CRM Core]].",
    ],
    "customers": [
        "Master record for a person — buyer, seller, or both.",
        "Phone is unique within an organization (enforced at zod layer, not DB).",
        "Linked to leads, inquiries, appointments, deals, listings (as seller), and tenancies.",
    ],
    "contact_logs": [
        "Append-only log of every touchpoint with a lead — calls, WhatsApps, emails, in-person.",
        "Used to compute `lastContactAt` on the parent lead and to power activity timelines.",
    ],
    "inquiries": [
        "Inbound interest in a specific listing or property. Created by website forms,",
        "WhatsApp webhooks, walk-ins, or referrals. Often the first step before a `lead` is created.",
    ],
    "appointments": [
        "Scheduled meetings — viewings, signings, follow-ups. Linked to a customer + optional",
        "property/listing/inquiry. Powers the calendar page.",
    ],

    # ── Pipeline / Deals ──
    "deals": [
        "A deal is the post-qualification, pre-close opportunity. Drives the Kanban pipeline.",
        "Stage transitions are tracked via `stageEnteredAt` (set on every stage change in",
        "`apps/api/routes/deals.ts`) and powers the stuck-deal alerts on the dashboard.",
        "Saudi compliance: commission ≤ 2.5%, RETT 5%, optional Ejar contract reference.",
        "See [[Features/Pipeline & Deals]].",
    ],
    "deal_documents": [
        "Files attached to a deal — contracts, ID copies, brokerage agreements, payment receipts.",
        "URL points to S3 / GCS storage; metadata only is stored in the DB.",
    ],
    "commission_splits": [
        "How a deal's commission is divided between agents, brokerages, and referrers.",
        "Status tracks the payout lifecycle (PENDING → APPROVED → PAID).",
    ],

    # ── Pool / Requests ──
    "buyer_requests": [
        "Buyer-side entries in the shared Pool (الطلبات العقارية).",
        "Any agent can claim them via `claims`. Contact details are masked until claim.",
    ],
    "seller_submissions": [
        "Seller-side entries in the shared Pool — owners looking for an agent to sell their property.",
        "Mirror of `buyer_requests` for the opposite side of the marketplace.",
    ],
    "claims": [
        "An agent reserving a buyer request from the Pool. Active for 7 days (`expiresAt`).",
        "While active, only the claiming agent sees full contact details.",
    ],
    "broker_requests": [
        "Co-marketing offers — an agent posts their listing for other agents to help market",
        "in exchange for a commission split. Capped by REGA commission rules.",
    ],
    "broker_acceptances": [
        "Agent acceptance of a broker_request. Carries the negotiated rate and the",
        "co-brokerage agreement signing state (DRAFT → PENDING_SIGNATURES → SIGNED).",
    ],
    "marketing_requests": [
        "Generic marketing-help requests posted by property owners. Agents respond with",
        "`marketing_proposals`. The owner picks the winning proposal.",
    ],
    "marketing_proposals": [
        "Agent proposal in response to a marketing_request — message, commission rate,",
        "marketing budget, estimated timeline.",
    ],

    # ── Properties ──
    "properties": [
        "Master property record — physical real estate the agency knows about.",
        "Distinct from `listings` (a property can be unlisted, listed multiple times, etc.).",
        "REGA fields: building age, facade direction, deed number, legal status.",
        "See [[Features/Properties & Listings]].",
    ],
    "listings": [
        "A specific publication of a property to the market — for SALE or RENT.",
        "REGA-compliant: must carry `regaAdLicenseNumber` + `falLicenseNumber` to publish.",
        "Status lifecycle: DRAFT → PENDING_APPROVAL → ACTIVE → SOLD/RENTED.",
    ],
    "property_listings": [
        "Legacy denormalized listings table from the original aqar.fm import.",
        "Kept for backward compatibility with the public map; new code uses `listings`.",
    ],
    "property_category": [
        "GASTAT-aligned top-level property categories (5 total): Residential, Commercial,",
        "Industrial, Agricultural, Land. See [[Features/REGA Compliance]].",
    ],
    "property_type": [
        "GASTAT-aligned property types (33 total) within each category.",
        "Drives the property creation form's category → type cascade.",
    ],
    "properties_seeker": [
        "Public buyer-side seeker entries from the landing page form.",
        "Imported into `buyer_requests` once an agent claims them.",
    ],
    "favorites": [
        "Customer's saved properties on the public site / client portal.",
    ],

    # ── Geography ──
    "regions": [
        "Saudi Arabia administrative regions (13 total). Seeded from official GASTAT data.",
    ],
    "cities": [
        "Saudi cities, FK to regions. Used by listing/customer location pickers.",
    ],
    "districts": [
        "Saudi districts (الأحياء) within cities. Seeded with official boundary polygons (GeoJSON).",
    ],

    # ── Tenancy ──
    "tenancies": [
        "Active rental contract — tenant, property, agent, monthly rent, lease window.",
        "Created from a deal once stage = WON for a RENT listing.",
        "Powers the tenant management page.",
    ],
    "rent_payments": [
        "Scheduled rent payments for a tenancy. One row per due-date.",
        "Status PENDING → PAID / OVERDUE / PARTIAL / WAIVED. Drives late-payment alerts.",
    ],

    # ── Marketing & Communication ──
    "campaigns": [
        "Bulk WhatsApp / SMS / email blast to a segment of leads or customers.",
        "Counters track delivered/opened/responded for performance reporting.",
    ],
    "campaign_recipients": [
        "Per-recipient state for a campaign. One row per (campaign, recipient).",
    ],
    "automation_rules": [
        "Trigger → action rules for hands-off agent workflows.",
        "Triggers: new_lead, cold_lead, listing_match, appointment_reminder, price_drop, deal_stale.",
    ],
    "campaign_sequences": [
        "Drip-campaign sequence definition — ordered steps with delays + templates.",
        "Stored as JSON in `steps`.",
    ],
    "sequence_enrollments": [
        "Active enrollment of a lead in a campaign_sequence. Tracks current step + next run time.",
    ],
    "messages": [
        "Two-way inbox — every WhatsApp/SMS/email message in or out of the system.",
        "Inbound messages from the WhatsApp webhook are matched to a customer by phone.",
    ],
    "listing_promotions": [
        "Paid boost / ad placement for a listing. Daily + total budget, bid amount,",
        "targeting (cities, types, buyer budget). Auto-pause when spend ≥ 95%.",
    ],
    "lead_routing_rules": [
        "How new leads are auto-assigned within an org.",
        "Strategies: manual, round_robin, territory, first_to_claim.",
    ],

    # ── Billing ──
    "pricing_plans": [
        "Subscription plan catalog — name, price, billing interval, currency (SAR by default).",
    ],
    "pricing_plan_features": [
        "Feature line items for a pricing plan (the bullets shown on the pricing page).",
    ],
    "billing_accounts": [
        "Billing entity — typically 1:1 with an organization, but individual agents have one too.",
    ],
    "billing_subscriptions": [
        "Active subscription for a billing_account. Status drives platform feature gating.",
    ],
    "billing_invoices": [
        "Issued invoice for a subscription. PDF stored externally; URL only in DB.",
    ],

    # ── CMS / Landing ──
    "LandingSection": [
        "CMS-managed section on the public landing page. Has draft/published JSON for editing.",
    ],
    "LandingCard": [
        "Card widget within a LandingSection — title, body, media, CTA.",
    ],
    "CMSArticle": [
        "Blog / news article managed via the admin CMS. Supports rich JSON content + SEO fields.",
    ],
    "MediaLibrary": [
        "Uploaded media files (images, videos) — referenced by listings, articles, posts.",
    ],
    "SEOSettings": [
        "Per-page SEO meta — title, description, OG tags, Twitter card. Keyed by page path.",
    ],
    "NavigationLink": [
        "CMS-managed navigation link in the public site header.",
    ],

    # ── Forum / Community ──
    "forum_channels": [
        "Topical forum channels (e.g. عام, سوق, قانوني, تقنية).",
    ],
    "community_posts": [
        "Forum posts. Has likes, pinning, type tag (DISCUSSION/NEWS/ANNOUNCEMENT/DEAL/ALERT).",
    ],
    "community_post_media": [
        "Media attachments (image / video) for a community post.",
    ],
    "community_comments": [
        "Comments on community posts.",
    ],

    # ── Compliance / Audit ──
    "audit_logs": [
        "Immutable append-only log of every meaningful mutation. Used for REGA audits and",
        "for the per-record activity timeline. Stores before/after JSON snapshots.",
    ],
    "content_reports": [
        "User-submitted reports of inappropriate listings. Drives the moderation queue.",
    ],
    "analytics_event_logs": [
        "Generic event log for platform analytics — user actions, system events.",
    ],

    # ── Support ──
    "support_tickets": [
        "Customer support tickets — opened by users, assigned to support staff.",
    ],
    "support_categories": [
        "Categories for grouping support tickets in the admin queue.",
    ],
    "support_templates": [
        "Saved canned responses for support agents.",
    ],

    # ── Off-Plan Projects ──
    "projects": [
        "Off-plan / under-construction projects (مشاريع تطويرية).",
        "Status: PLANNING → UNDER_CONSTRUCTION → COMPLETED → ON_HOLD.",
    ],
    "project_units": [
        "Individual units (apartments, villas, townhouses) within a project.",
        "Status: AVAILABLE → RESERVED → SOLD → BLOCKED. Has payment milestone schedule.",
    ],
    "land_subdivisions": [
        "Land subdivision plans — splitting a large parcel into sellable lots (مخططات الأراضي).",
    ],
    "subdivision_lots": [
        "Individual lots within a land_subdivision.",
    ],

    # ── Operations ──
    "maintenance_requests": [
        "Tenant-reported maintenance issues. Routed to vendors. Tracks status + cost.",
    ],
    "vendors": [
        "Contractor / vendor directory — plumbing, electrical, HVAC, etc. Rated 1-5.",
    ],
    "viewing_feedback": [
        "Post-viewing feedback from customers. Ratings for location/condition/price/overall.",
    ],
    "property_warranties": [
        "Tracked warranties on property components (AC, water heater, elevator) with expiry dates.",
    ],

    # ── Infra ──
    "session": [
        "express-session storage for `connect-pg-simple`. Not application data.",
    ],
    "agent_memory": [
        "Per-agent notes / reminders. Lightweight memory store for agent-specific facts.",
    ],
    "saved_searches": [
        "Customer-saved search criteria with frequency-based alerting.",
    ],
}

# ─── Enum descriptions ──────────────────────────────────────────────────────
ENUM_DOCS = {
    "AgentStatus": "Agent profile lifecycle state.",
    "FalLicenseType": "REGA FAL license category — see [[Features/REGA Compliance]].",
    "LicenseVerificationStatus": "Generic license verification status.",
    "PropertyLegalStatus": "Saudi property legal classifications (deed type / encumbrance).",
    "BuyerRequestStatus": "Pool buyer-request lifecycle.",
    "ClaimStatus": "Claim lifecycle on a buyer/owner request.",
    "ContactChannel": "Channel of a contact_log entry.",
    "LeadStatus": "Lead funnel state — see [[Features/CRM Core]].",
    "ListingStatus": "Listing lifecycle — DRAFT → PENDING_APPROVAL → ACTIVE → SOLD/RENTED.",
    "ListingType": "RENT vs SALE — drives validation rules and commission cap.",
    "OrganizationStatus": "Organization onboarding lifecycle.",
    "PropertyStatus": "Coarse property visibility/availability state.",
    "SellerSubmissionStatus": "Seller submission lifecycle in the Pool.",
    "UserRole": "Role taxonomy — drives RBAC and route guards.",
    "UserApprovalStatus": "Admin moderation state for a newly registered user.",
    "RoleScope": "Whether a role applies platform-wide or per organization.",
    "MembershipStatus": "Org membership invite lifecycle.",
    "BillingAccountStatus": "Billing account state used by gating logic.",
    "SubscriptionStatus": "Subscription lifecycle — see [[Features/CRM Core]] for gating rules.",
    "InvoiceStatus": "Invoice lifecycle.",
    "PaymentStatus": "Payment processing state.",
    "PaymentMethodType": "Supported payment methods.",
    "PaymentMethodStatus": "Payment method validity.",
    "RevenueMetricType": "Revenue metric types tracked by analytics.",
    "AnalyticsMetricType": "Catalog of analytics metric kinds.",
    "CustomerType": "Whether a customer is a buyer, seller, or both.",
    "InquiryChannel": "Inbound inquiry source channel.",
    "InquiryStatus": "Inquiry handling state.",
    "AppointmentStatus": "Appointment lifecycle (calendar page).",
    "DealStage": "Pipeline stages — see [[Features/Pipeline & Deals]] for probabilities.",
    "SupportTicketStatus": "Support ticket lifecycle.",
    "SupportTicketPriority": "Support ticket priority levels.",
    "BrokerRequestStatus": "Co-marketing broker request lifecycle.",
    "CampaignStatus": "Bulk campaign send lifecycle.",
    "CampaignRecipientStatus": "Per-recipient delivery state.",
    "PromotionStatus": "Listing promotion / boost lifecycle.",
    "CommissionStatus": "Commission split payout state.",
    "TenancyStatus": "Active rental lifecycle. EXPIRING = within 90 days of leaseEnd.",
    "RentPaymentStatus": "Rent payment state — drives late-payment alerts.",
}

# ─── Apply ──────────────────────────────────────────────────────────────────
lines = text.splitlines()
out = []
i = 0
inserted_models = 0
inserted_enums = 0
skipped = 0

def has_doc_above(buf):
    """Look back at most 10 non-blank lines for an existing /// block."""
    for line in reversed(buf[-10:]):
        s = line.strip()
        if not s:
            continue
        return s.startswith("///")
    return False

while i < len(lines):
    line = lines[i]
    m_model = re.match(r"^model\s+(\w+)\s*\{", line)
    m_enum = re.match(r"^enum\s+(\w+)\s*\{", line)
    if m_model:
        name = m_model.group(1)
        if not has_doc_above(out):
            doc = MODEL_DOCS.get(name)
            if doc:
                for d in doc:
                    out.append(f"/// {d}")
                inserted_models += 1
            else:
                out.append(f"/// TODO: document model `{name}` (no entry in MODEL_DOCS)")
                skipped += 1
        out.append(line)
    elif m_enum:
        name = m_enum.group(1)
        if not has_doc_above(out):
            doc = ENUM_DOCS.get(name)
            if doc:
                out.append(f"/// {doc}")
                inserted_enums += 1
            else:
                out.append(f"/// TODO: document enum `{name}` (no entry in ENUM_DOCS)")
                skipped += 1
        out.append(line)
    else:
        out.append(line)
    i += 1

new_text = "\n".join(out) + ("\n" if text.endswith("\n") else "")
SCHEMA.write_text(new_text)
print(f"Inserted {inserted_models} model docs, {inserted_enums} enum docs, {skipped} TODOs")
print(f"Schema: {len(text)} → {len(new_text)} chars (+{len(new_text) - len(text)})")
