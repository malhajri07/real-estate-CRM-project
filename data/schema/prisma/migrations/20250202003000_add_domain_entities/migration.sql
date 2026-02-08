SET search_path = public;

ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'RESERVED';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

CREATE TYPE "CustomerType" AS ENUM ('BUYER', 'SELLER', 'BOTH');
CREATE TYPE "InquiryChannel" AS ENUM ('WEBSITE', 'WHATSAPP', 'PHONE', 'WALK_IN', 'REFERRAL', 'EMAIL');
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED');
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
CREATE TYPE "DealStage" AS ENUM ('NEW', 'NEGOTIATION', 'UNDER_OFFER', 'WON', 'LOST');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE "property_units" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitType" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" NUMERIC(6, 2),
    "areaSqm" NUMERIC(10, 2),
    "price" NUMERIC(14, 2),
    "floor" INTEGER,
    "isFurnished" BOOLEAN DEFAULT false,
    "hasBalcony" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_units_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "property_units_propertyId_idx" ON "property_units"("propertyId");

ALTER TABLE "property_units"
  ADD CONSTRAINT "property_units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "property_media" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'PHOTO',
    "url" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "property_media_propertyId_idx" ON "property_media"("propertyId");
CREATE INDEX "property_media_mediaType_idx" ON "property_media"("mediaType");

ALTER TABLE "property_media"
  ADD CONSTRAINT "property_media_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'BUYER',
    "salutation" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "whatsappNumber" TEXT,
    "preferredLanguage" TEXT DEFAULT 'ar',
    "city" TEXT,
    "district" TEXT,
    "nationality" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_organizationId_idx" ON "customers"("organizationId");
CREATE INDEX "customers_phone_idx" ON "customers"("phone");
CREATE INDEX "customers_email_idx" ON "customers"("email");
CREATE INDEX "customers_city_idx" ON "customers"("city");

ALTER TABLE "customers"
  ADD CONSTRAINT "customers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listings"
  ADD COLUMN "unitId" TEXT,
  ADD COLUMN "sellerCustomerId" TEXT;

CREATE INDEX "listings_unitId_idx" ON "listings"("unitId");
CREATE INDEX "listings_sellerCustomerId_idx" ON "listings"("sellerCustomerId");

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "property_units"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "listings_sellerCustomerId_fkey" FOREIGN KEY ("sellerCustomerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "customerId" TEXT,
  ADD COLUMN "source" TEXT,
  ADD COLUMN "priority" INTEGER,
  ADD COLUMN "assignedAt" TIMESTAMPTZ,
  ADD COLUMN "lastContactAt" TIMESTAMPTZ;

CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");
CREATE INDEX "leads_customerId_idx" ON "leads"("customerId");

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "listingId" TEXT,
    "agentId" TEXT,
    "channel" "InquiryChannel" NOT NULL DEFAULT 'WEBSITE',
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "preferredTime" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMPTZ,
    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inquiries_organizationId_idx" ON "inquiries"("organizationId");
CREATE INDEX "inquiries_customerId_idx" ON "inquiries"("customerId");
CREATE INDEX "inquiries_propertyId_idx" ON "inquiries"("propertyId");
CREATE INDEX "inquiries_listingId_idx" ON "inquiries"("listingId");
CREATE INDEX "inquiries_agentId_idx" ON "inquiries"("agentId");
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

ALTER TABLE "inquiries"
  ADD CONSTRAINT "inquiries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "inquiries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "inquiries_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "inquiries_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "inquiries_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "listingId" TEXT,
    "inquiryId" TEXT,
    "agentId" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMPTZ NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointments_organizationId_idx" ON "appointments"("organizationId");
CREATE INDEX "appointments_customerId_idx" ON "appointments"("customerId");
CREATE INDEX "appointments_propertyId_idx" ON "appointments"("propertyId");
CREATE INDEX "appointments_listingId_idx" ON "appointments"("listingId");
CREATE INDEX "appointments_inquiryId_idx" ON "appointments"("inquiryId");
CREATE INDEX "appointments_agentId_idx" ON "appointments"("agentId");
CREATE INDEX "appointments_status_idx" ON "appointments"("status");
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "appointments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "appointments_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "appointments_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "appointments_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "appointments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "listingId" TEXT,
    "propertyId" TEXT,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "expectedCloseDate" TIMESTAMPTZ,
    "agreedPrice" NUMERIC(14, 2),
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "wonAt" TIMESTAMPTZ,
    "lostAt" TIMESTAMPTZ,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "deals_organizationId_idx" ON "deals"("organizationId");
CREATE INDEX "deals_customerId_idx" ON "deals"("customerId");
CREATE INDEX "deals_propertyId_idx" ON "deals"("propertyId");
CREATE INDEX "deals_listingId_idx" ON "deals"("listingId");
CREATE INDEX "deals_agentId_idx" ON "deals"("agentId");
CREATE INDEX "deals_stage_idx" ON "deals"("stage");

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "deals_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "deals_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "deals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "deals_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT,
    "createdByUserId" TEXT,
    "assignedToUserId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "channel" "InquiryChannel" DEFAULT 'WEBSITE',
    "openedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_organizationId_idx" ON "support_tickets"("organizationId");
CREATE INDEX "support_tickets_customerId_idx" ON "support_tickets"("customerId");
CREATE INDEX "support_tickets_assignedToUserId_idx" ON "support_tickets"("assignedToUserId");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "support_tickets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "support_tickets_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "support_tickets_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "AnalyticsMetricType" ADD VALUE IF NOT EXISTS 'LISTINGS_CREATED';
ALTER TYPE "AnalyticsMetricType" ADD VALUE IF NOT EXISTS 'APPOINTMENTS_CREATED';
ALTER TYPE "AnalyticsMetricType" ADD VALUE IF NOT EXISTS 'DEALS_WON';
ALTER TYPE "AnalyticsMetricType" ADD VALUE IF NOT EXISTS 'GMV';
ALTER TYPE "AnalyticsMetricType" ADD VALUE IF NOT EXISTS 'INVOICE_TOTAL';
ALTER TYPE "AnalyticsMetricType" ADD VALUE IF NOT EXISTS 'CASH_COLLECTED';

CREATE TABLE "billing_payouts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "accountId" UUID NOT NULL,
    "amount" NUMERIC(14, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "beneficiary" TEXT,
    "processedAt" TIMESTAMPTZ,
    "periodStart" TIMESTAMPTZ,
    "periodEnd" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "billing_payouts_organizationId_idx" ON "billing_payouts"("organizationId");
CREATE INDEX "billing_payouts_accountId_idx" ON "billing_payouts"("accountId");
CREATE INDEX "billing_payouts_status_idx" ON "billing_payouts"("status");

ALTER TABLE "billing_payouts"
  ADD CONSTRAINT "billing_payouts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_payouts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
