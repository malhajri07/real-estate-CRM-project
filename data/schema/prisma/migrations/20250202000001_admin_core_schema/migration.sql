SET search_path = public;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "public"."UserApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO');

-- CreateEnum
CREATE TYPE "public"."RoleScope" AS ENUM ('PLATFORM', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "public"."MembershipStatus" AS ENUM ('INVITED', 'PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."BillingAccountStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'PAST_DUE', 'VOID');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethodType" AS ENUM ('CARD', 'BANK_TRANSFER', 'INVOICE', 'CASH');

-- CreateEnum
CREATE TYPE "public"."PaymentMethodStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."RevenueMetricType" AS ENUM ('MRR', 'ARR', 'CASH_COLLECTION', 'CHURN', 'NET_REVENUE');

-- CreateEnum
CREATE TYPE "public"."AnalyticsMetricType" AS ENUM ('USERS_ACTIVE', 'USERS_NEW', 'ORGANIZATIONS_ACTIVE', 'ORGANIZATIONS_NEW', 'LEADS_CREATED', 'LEADS_CONVERTED', 'BOOKINGS_VALUE', 'RETENTION_RATE');

-- AlterTable users
ALTER TABLE "users"
  ADD COLUMN     "approvalStatus" "public"."UserApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN     "avatarUrl" TEXT,
  ADD COLUMN     "department" TEXT,
  ADD COLUMN     "jobTitle" TEXT,
  ADD COLUMN     "lastSeenAt" TIMESTAMPTZ,
  ADD COLUMN     "metadata" JSONB,
  ADD COLUMN     "timezone" TEXT,
  ALTER COLUMN   "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable organizations
ALTER TABLE "organizations"
  ADD COLUMN     "billingEmail" TEXT,
  ADD COLUMN     "billingPhone" TEXT,
  ADD COLUMN     "city" TEXT,
  ADD COLUMN     "countryCode" TEXT,
  ADD COLUMN     "industry" TEXT,
  ADD COLUMN     "metadata" JSONB,
  ADD COLUMN     "primaryContactId" TEXT,
  ADD COLUMN     "region" TEXT,
  ADD COLUMN     "size" INTEGER,
  ADD COLUMN     "timezone" TEXT,
  ALTER COLUMN   "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable pricing_plans
ALTER TABLE "pricing_plans"
  ADD COLUMN     "billingInterval" TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SAR',
  ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "metadata" JSONB;

-- CreateTable permissions
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable system_roles
CREATE TABLE "system_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "public"."RoleScope" NOT NULL DEFAULT 'PLATFORM',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable role_permissions
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_roles
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable organization_memberships
CREATE TABLE "organization_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" UUID,
    "title" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMPTZ,
    "joinedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable organization_settings
CREATE TABLE "organization_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "locale" TEXT DEFAULT 'ar-SA',
    "timezone" TEXT DEFAULT 'Asia/Riyadh',
    "notificationEmail" TEXT,
    "notificationPhone" TEXT,
    "featureFlags" JSONB,
    "billingPreferences" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable organization_invites
CREATE TABLE "organization_invites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleId" UUID,
    "status" "public"."MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ,
    "acceptedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_accounts
CREATE TABLE "billing_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" TEXT,
    "userId" TEXT,
    "status" "public"."BillingAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "billingEmail" TEXT,
    "billingPhone" TEXT,
    "taxNumber" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_payment_methods
CREATE TABLE "billing_payment_methods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "ownerUserId" TEXT,
    "type" "public"."PaymentMethodType" NOT NULL,
    "status" "public"."PaymentMethodStatus" NOT NULL DEFAULT 'ACTIVE',
    "vendor" TEXT,
    "reference" TEXT,
    "maskedDetails" TEXT,
    "expiresAt" TIMESTAMPTZ,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_subscriptions
CREATE TABLE "billing_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "trialEndsAt" TIMESTAMPTZ,
    "startDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodStart" TIMESTAMPTZ NOT NULL,
    "currentPeriodEnd" TIMESTAMPTZ NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMPTZ,
    "renewalReminderSentAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_usage_records
CREATE TABLE "billing_usage_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL,
    "metric" TEXT NOT NULL,
    "quantity" NUMERIC(14, 2) NOT NULL,
    "recordedAt" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_invoices
CREATE TABLE "billing_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "accountId" UUID NOT NULL,
    "subscriptionId" UUID,
    "number" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMPTZ,
    "amountDue" NUMERIC(14, 2) NOT NULL DEFAULT 0,
    "amountPaid" NUMERIC(14, 2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "notes" TEXT,
    "pdfUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_invoice_items
CREATE TABLE "billing_invoice_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "subscriptionId" UUID,
    "description" TEXT NOT NULL,
    "quantity" NUMERIC(14, 2) NOT NULL DEFAULT 1,
    "unitAmount" NUMERIC(14, 2) NOT NULL,
    "total" NUMERIC(14, 2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_payments
CREATE TABLE "billing_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoiceId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "methodId" UUID,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" NUMERIC(14, 2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "transactionReference" TEXT,
    "gateway" TEXT,
    "processedAt" TIMESTAMPTZ,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable billing_payment_attempts
CREATE TABLE "billing_payment_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paymentId" UUID NOT NULL,
    "methodId" UUID,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" NUMERIC(14, 2) NOT NULL,
    "failureReason" TEXT,
    "processedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable revenue_snapshots
CREATE TABLE "revenue_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshotDate" DATE NOT NULL,
    "metric" "public"."RevenueMetricType" NOT NULL,
    "dimension" TEXT,
    "dimensionId" TEXT,
    "value" NUMERIC(18, 4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable analytics_daily_metrics
CREATE TABLE "analytics_daily_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "metric" "public"."AnalyticsMetricType" NOT NULL,
    "recordedFor" DATE NOT NULL,
    "dimension" TEXT,
    "dimensionValue" TEXT,
    "total" NUMERIC(18, 4),
    "count" INTEGER,
    "changePercent" NUMERIC(9, 4),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable analytics_event_logs
CREATE TABLE "analytics_event_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventName" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "occurredAt" TIMESTAMPTZ NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_domain_idx" ON "permissions"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "system_roles_key_key" ON "system_roles"("key");

-- CreateIndex
CREATE INDEX "system_roles_scope_idx" ON "system_roles"("scope");

-- CreateIndex
CREATE INDEX "system_roles_isSystem_idx" ON "system_roles"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE INDEX "user_roles_assignedAt_idx" ON "user_roles"("assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_organizationId_userId_key" ON "organization_memberships"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "organization_memberships_userId_idx" ON "organization_memberships"("userId");

-- CreateIndex
CREATE INDEX "organization_memberships_roleId_idx" ON "organization_memberships"("roleId");

-- CreateIndex
CREATE INDEX "organization_memberships_status_idx" ON "organization_memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organizationId_key" ON "organization_settings"("organizationId");

-- CreateIndex
CREATE INDEX "organization_invites_organizationId_idx" ON "organization_invites"("organizationId");

-- CreateIndex
CREATE INDEX "organization_invites_email_idx" ON "organization_invites"("email");

-- CreateIndex
CREATE INDEX "organization_invites_status_idx" ON "organization_invites"("status");

-- CreateIndex
CREATE INDEX "billing_accounts_organizationId_idx" ON "billing_accounts"("organizationId");

-- CreateIndex
CREATE INDEX "billing_accounts_userId_idx" ON "billing_accounts"("userId");

-- CreateIndex
CREATE INDEX "billing_accounts_status_idx" ON "billing_accounts"("status");

-- CreateIndex
CREATE INDEX "billing_payment_methods_accountId_idx" ON "billing_payment_methods"("accountId");

-- CreateIndex
CREATE INDEX "billing_payment_methods_ownerUserId_idx" ON "billing_payment_methods"("ownerUserId");

-- CreateIndex
CREATE INDEX "billing_payment_methods_type_idx" ON "billing_payment_methods"("type");

-- CreateIndex
CREATE INDEX "billing_payment_methods_status_idx" ON "billing_payment_methods"("status");

-- CreateIndex
CREATE INDEX "billing_subscriptions_accountId_idx" ON "billing_subscriptions"("accountId");

-- CreateIndex
CREATE INDEX "billing_subscriptions_planId_idx" ON "billing_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "billing_subscriptions_status_idx" ON "billing_subscriptions"("status");

-- CreateIndex
CREATE INDEX "billing_usage_records_subscriptionId_idx" ON "billing_usage_records"("subscriptionId");

-- CreateIndex
CREATE INDEX "billing_usage_records_metric_idx" ON "billing_usage_records"("metric");

-- CreateIndex
CREATE INDEX "billing_usage_records_recordedAt_idx" ON "billing_usage_records"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "billing_invoices_number_key" ON "billing_invoices"("number");

-- CreateIndex
CREATE INDEX "billing_invoices_accountId_idx" ON "billing_invoices"("accountId");

-- CreateIndex
CREATE INDEX "billing_invoices_subscriptionId_idx" ON "billing_invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "billing_invoices_status_idx" ON "billing_invoices"("status");

-- CreateIndex
CREATE INDEX "billing_invoice_items_invoiceId_idx" ON "billing_invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "billing_invoice_items_subscriptionId_idx" ON "billing_invoice_items"("subscriptionId");

-- CreateIndex
CREATE INDEX "billing_payments_invoiceId_idx" ON "billing_payments"("invoiceId");

-- CreateIndex
CREATE INDEX "billing_payments_methodId_idx" ON "billing_payments"("methodId");

-- CreateIndex
CREATE INDEX "billing_payments_status_idx" ON "billing_payments"("status");

-- CreateIndex
CREATE INDEX "billing_payment_attempts_paymentId_idx" ON "billing_payment_attempts"("paymentId");

-- CreateIndex
CREATE INDEX "billing_payment_attempts_methodId_idx" ON "billing_payment_attempts"("methodId");

-- CreateIndex
CREATE INDEX "billing_payment_attempts_status_idx" ON "billing_payment_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_snapshots_snapshotDate_metric_dimension_dimensionId_key" ON "revenue_snapshots"("snapshotDate", "metric", "dimension", "dimensionId");

-- CreateIndex
CREATE INDEX "revenue_snapshots_metric_snapshotDate_idx" ON "revenue_snapshots"("metric", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_daily_metrics_metric_recordedFor_dimension_dimensionValue_key" ON "analytics_daily_metrics"("metric", "recordedFor", "dimension", "dimensionValue");

-- CreateIndex
CREATE INDEX "analytics_daily_metrics_metric_recordedFor_idx" ON "analytics_daily_metrics"("metric", "recordedFor");

-- CreateIndex
CREATE INDEX "analytics_event_logs_eventName_idx" ON "analytics_event_logs"("eventName");

-- CreateIndex
CREATE INDEX "analytics_event_logs_occurredAt_idx" ON "analytics_event_logs"("occurredAt");

-- CreateIndex
CREATE INDEX "analytics_event_logs_userId_idx" ON "analytics_event_logs"("userId");

-- CreateIndex
CREATE INDEX "analytics_event_logs_organizationId_idx" ON "analytics_event_logs"("organizationId");

-- CreateIndex
CREATE INDEX "users_approvalStatus_idx" ON "users"("approvalStatus");

-- CreateIndex
CREATE INDEX "organizations_industry_idx" ON "organizations"("industry");

-- CreateIndex
CREATE INDEX "organizations_primaryContactId_idx" ON "organizations"("primaryContactId");

-- AlterTable add foreign keys
ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "role_permissions"
  ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles"
  ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_memberships"
  ADD CONSTRAINT "organization_memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "organization_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "organization_memberships_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "organization_settings"
  ADD CONSTRAINT "organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organization_invites"
  ADD CONSTRAINT "organization_invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "organization_invites_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "system_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billing_accounts"
  ADD CONSTRAINT "billing_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "billing_payment_methods"
  ADD CONSTRAINT "billing_payment_methods_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_payment_methods_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billing_subscriptions"
  ADD CONSTRAINT "billing_subscriptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pricing_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "billing_usage_records"
  ADD CONSTRAINT "billing_usage_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "billing_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "billing_invoices"
  ADD CONSTRAINT "billing_invoices_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "billing_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billing_invoice_items"
  ADD CONSTRAINT "billing_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "billing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_invoice_items_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "billing_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billing_payments"
  ADD CONSTRAINT "billing_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "billing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_payments_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "billing_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "billing_payment_attempts"
  ADD CONSTRAINT "billing_payment_attempts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "billing_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "billing_payment_attempts_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "billing_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "analytics_event_logs"
  ADD CONSTRAINT "analytics_event_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "analytics_event_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
SET search_path = public;

INSERT INTO "permissions" ("id", "key", "label", "description", "domain")
VALUES
  ('00000000-0000-0000-0000-000000000201', 'manage_users', 'Manage Users', 'Create, update, deactivate platform user accounts', 'rbac'),
  ('00000000-0000-0000-0000-000000000202', 'manage_organizations', 'Manage Organizations', 'Manage organization onboarding, status, and details', 'rbac'),
  ('00000000-0000-0000-0000-000000000203', 'manage_roles', 'Manage Roles', 'Create and update RBAC roles and permissions', 'rbac'),
  ('00000000-0000-0000-0000-000000000204', 'view_all_data', 'View All Data', 'View system-wide analytics and CRM records', 'analytics'),
  ('00000000-0000-0000-0000-000000000205', 'impersonate_users', 'Impersonate Users', 'Assume user identities for support and debugging', 'rbac'),
  ('00000000-0000-0000-0000-000000000206', 'manage_site_settings', 'Manage Site Settings', 'Configure global platform settings and feature flags', 'platform'),
  ('00000000-0000-0000-0000-000000000207', 'view_audit_logs', 'View Audit Logs', 'Inspect audit trails and security activity', 'security'),
  ('00000000-0000-0000-0000-000000000208', 'manage_org_profile', 'Manage Organization Profile', 'Edit organization profile, billing, and branding', 'organization'),
  ('00000000-0000-0000-0000-000000000209', 'manage_org_agents', 'Manage Organization Agents', 'Invite and manage organization agents and owners', 'organization'),
  ('00000000-0000-0000-0000-000000000210', 'view_org_data', 'View Organization Data', 'Access organization level reports and CRM data', 'organization'),
  ('00000000-0000-0000-0000-000000000211', 'search_buyer_pool', 'Search Buyer Pool', 'Search and filter buyer pool records', 'crm'),
  ('00000000-0000-0000-0000-000000000212', 'reassign_leads', 'Reassign Leads', 'Reassign buyers and leads across agents', 'crm'),
  ('00000000-0000-0000-0000-000000000213', 'view_org_reports', 'View Organization Reports', 'Access organization level analytics dashboards', 'analytics'),
  ('00000000-0000-0000-0000-000000000214', 'manage_own_properties', 'Manage Own Properties', 'Create and maintain owned property listings', 'crm'),
  ('00000000-0000-0000-0000-000000000215', 'view_org_properties', 'View Organization Properties', 'View properties listed by the organization', 'crm'),
  ('00000000-0000-0000-0000-000000000216', 'claim_buyer_requests', 'Claim Buyer Requests', 'Claim buyer requests from the marketplace', 'crm'),
  ('00000000-0000-0000-0000-000000000217', 'manage_own_leads', 'Manage Own Leads', 'Manage leads owned by the agent', 'crm'),
  ('00000000-0000-0000-0000-000000000218', 'view_org_leads', 'View Organization Leads', 'View leads assigned within the organization', 'crm'),
  ('00000000-0000-0000-0000-000000000219', 'manage_own_submissions', 'Manage Own Submissions', 'Submit and manage seller property submissions', 'crm'),
  ('00000000-0000-0000-0000-000000000220', 'view_own_leads', 'View Own Leads', 'See inbound leads for owned listings', 'crm'),
  ('00000000-0000-0000-0000-000000000221', 'manage_own_requests', 'Manage Own Requests', 'Create and manage buyer requests', 'crm'),
  ('00000000-0000-0000-0000-000000000222', 'view_own_claims', 'View Own Claims', 'See which agents claimed buyer requests', 'crm'),
  ('00000000-0000-0000-0000-000000000223', 'manage_billing', 'Manage Billing', 'Configure billing accounts, subscriptions, and invoices', 'billing'),
  ('00000000-0000-0000-0000-000000000224', 'view_analytics', 'View Analytics', 'Access analytics dashboards and exports', 'analytics'),
  ('00000000-0000-0000-0000-000000000225', 'manage_revenue_reporting', 'Manage Revenue Reporting', 'Build and schedule revenue reports', 'revenue')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "system_roles" ("id", "key", "name", "description", "scope", "isDefault", "isSystem")
VALUES
  ('00000000-0000-0000-0000-000000000301', 'WEBSITE_ADMIN', 'Website Administrator', 'Platform owner/admin with full system access', 'PLATFORM', true, true),
  ('00000000-0000-0000-0000-000000000302', 'CORP_OWNER', 'Corporate Owner', 'Corporate account owner or manager', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000303', 'CORP_AGENT', 'Corporate Agent', 'Licensed agent managed under an organization', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000304', 'INDIV_AGENT', 'Independent Agent', 'Independent licensed agent with marketplace access', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000305', 'SELLER', 'Seller', 'Individual customer selling property', 'ORGANIZATION', true, true),
  ('00000000-0000-0000-0000-000000000306', 'BUYER', 'Buyer', 'Individual customer searching for property', 'ORGANIZATION', true, true)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
VALUES
  -- WEBSITE_ADMIN
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000203'),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000204'),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000205'),
  ('00000000-0000-0000-0000-000000000406', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000206'),
  ('00000000-0000-0000-0000-000000000407', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000207'),
  ('00000000-0000-0000-0000-000000000408', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000223'),
  ('00000000-0000-0000-0000-000000000409', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000224'),
  ('00000000-0000-0000-0000-00000000040a', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000225'),
  -- CORP_OWNER
  ('00000000-0000-0000-0000-00000000040b', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000208'),
  ('00000000-0000-0000-0000-00000000040c', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000209'),
  ('00000000-0000-0000-0000-00000000040d', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000210'),
  ('00000000-0000-0000-0000-00000000040e', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000211'),
  ('00000000-0000-0000-0000-00000000040f', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000212'),
  ('00000000-0000-0000-0000-000000000410', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000213'),
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000223'),
  ('00000000-0000-0000-0000-000000000412', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000224'),
  -- CORP_AGENT
  ('00000000-0000-0000-0000-000000000413', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000214'),
  ('00000000-0000-0000-0000-000000000414', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000215'),
  ('00000000-0000-0000-0000-000000000415', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000211'),
  ('00000000-0000-0000-0000-000000000416', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000216'),
  ('00000000-0000-0000-0000-000000000417', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000217'),
  ('00000000-0000-0000-0000-000000000418', '00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000218'),
  -- INDIV_AGENT
  ('00000000-0000-0000-0000-000000000419', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000214'),
  ('00000000-0000-0000-0000-00000000041a', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000211'),
  ('00000000-0000-0000-0000-00000000041b', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000216'),
  ('00000000-0000-0000-0000-00000000041c', '00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000217'),
  -- SELLER
  ('00000000-0000-0000-0000-00000000041d', '00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000219'),
  ('00000000-0000-0000-0000-00000000041e', '00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000220'),
  -- BUYER
  ('00000000-0000-0000-0000-00000000041f', '00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000221'),
  ('00000000-0000-0000-0000-000000000420', '00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000222')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

UPDATE "users"
SET "approvalStatus" = CASE
    WHEN "isActive" = TRUE THEN 'APPROVED'::"public"."UserApprovalStatus"
    ELSE "approvalStatus"
  END;
