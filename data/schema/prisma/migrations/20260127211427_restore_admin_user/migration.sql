/*
  Warnings:

  - The primary key for the `analytics_daily_metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `analytics_event_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_invoice_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_invoices` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_payment_attempts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_payment_methods` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_payments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_subscriptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `billing_usage_records` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `cms_content_blocks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organization_invites` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organization_memberships` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `organization_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `revenue_snapshots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `system_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `display_order` on table `property_category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `property_category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `property_category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `property_category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_parking` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_elevator` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_maids_room` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `has_driver_room` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `furnished` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `balcony` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `swimming_pool` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `central_ac` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_verified` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `views_count` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `favorites_count` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `listed_date` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `property_listings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `display_order` on table `property_type` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_active` on table `property_type` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `property_type` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `property_type` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "public"."BuyerRequestStatus" ADD VALUE 'ARCHIVED';

-- DropForeignKey
ALTER TABLE "public"."billing_invoice_items" DROP CONSTRAINT "billing_invoice_items_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_invoice_items" DROP CONSTRAINT "billing_invoice_items_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_invoices" DROP CONSTRAINT "billing_invoices_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_invoices" DROP CONSTRAINT "billing_invoices_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_payment_attempts" DROP CONSTRAINT "billing_payment_attempts_methodId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_payment_attempts" DROP CONSTRAINT "billing_payment_attempts_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_payment_methods" DROP CONSTRAINT "billing_payment_methods_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_payments" DROP CONSTRAINT "billing_payments_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_payments" DROP CONSTRAINT "billing_payments_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_payments" DROP CONSTRAINT "billing_payments_methodId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_payouts" DROP CONSTRAINT "billing_payouts_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_subscriptions" DROP CONSTRAINT "billing_subscriptions_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."billing_usage_records" DROP CONSTRAINT "billing_usage_records_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."listings" DROP CONSTRAINT "listings_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."organization_invites" DROP CONSTRAINT "organization_invites_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."organization_memberships" DROP CONSTRAINT "organization_memberships_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_agentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_cityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_districtId_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_regionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."property_type" DROP CONSTRAINT "property_type_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_roleId_fkey";

-- DropIndex
DROP INDEX "public"."properties_agentId_idx";

-- DropIndex
DROP INDEX "public"."properties_cityId_idx";

-- DropIndex
DROP INDEX "public"."properties_city_idx";

-- DropIndex
DROP INDEX "public"."properties_districtId_idx";

-- DropIndex
DROP INDEX "public"."properties_organizationId_idx";

-- DropIndex
DROP INDEX "public"."properties_price_idx";

-- DropIndex
DROP INDEX "public"."properties_regionId_idx";

-- DropIndex
DROP INDEX "public"."properties_status_idx";

-- DropIndex
DROP INDEX "public"."properties_type_idx";

-- AlterTable
ALTER TABLE "public"."analytics_daily_metrics" DROP CONSTRAINT "analytics_daily_metrics_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "recordedFor" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "analytics_daily_metrics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."analytics_event_logs" DROP CONSTRAINT "analytics_event_logs_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "occurredAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "analytics_event_logs_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."appointments" ALTER COLUMN "scheduledAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."billing_accounts" DROP CONSTRAINT "billing_accounts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."billing_invoice_items" DROP CONSTRAINT "billing_invoice_items_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "invoiceId" SET DATA TYPE TEXT,
ALTER COLUMN "subscriptionId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_invoice_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."billing_invoices" DROP CONSTRAINT "billing_invoices_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT,
ALTER COLUMN "subscriptionId" SET DATA TYPE TEXT,
ALTER COLUMN "issueDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "dueDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."billing_payment_attempts" DROP CONSTRAINT "billing_payment_attempts_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "paymentId" SET DATA TYPE TEXT,
ALTER COLUMN "methodId" SET DATA TYPE TEXT,
ALTER COLUMN "processedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_payment_attempts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."billing_payment_methods" DROP CONSTRAINT "billing_payment_methods_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT,
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_payment_methods_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."billing_payments" DROP CONSTRAINT "billing_payments_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "invoiceId" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT,
ALTER COLUMN "methodId" SET DATA TYPE TEXT,
ALTER COLUMN "processedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."billing_payouts" ALTER COLUMN "accountId" SET DATA TYPE TEXT,
ALTER COLUMN "processedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "periodStart" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "periodEnd" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."billing_subscriptions" DROP CONSTRAINT "billing_subscriptions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "accountId" SET DATA TYPE TEXT,
ALTER COLUMN "trialEndsAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "startDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "currentPeriodStart" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "currentPeriodEnd" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "canceledAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "renewalReminderSentAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."billing_usage_records" DROP CONSTRAINT "billing_usage_records_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "subscriptionId" SET DATA TYPE TEXT,
ALTER COLUMN "recordedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "billing_usage_records_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."cms_content_blocks" DROP CONSTRAINT "cms_content_blocks_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "cms_content_blocks_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."customers" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."deals" ALTER COLUMN "expectedCloseDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "wonAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lostAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."inquiries" ALTER COLUMN "preferredTime" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "respondedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."leads" ALTER COLUMN "assignedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastContactAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."organization_invites" DROP CONSTRAINT "organization_invites_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "roleId" SET DATA TYPE TEXT,
ALTER COLUMN "invitedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "acceptedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."organization_memberships" DROP CONSTRAINT "organization_memberships_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "roleId" SET DATA TYPE TEXT,
ALTER COLUMN "invitedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "joinedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."organization_settings" DROP CONSTRAINT "organization_settings_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."organizations" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."permissions" DROP CONSTRAINT "permissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."properties" ALTER COLUMN "agentId" DROP NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "type" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "visibility" DROP NOT NULL,
ALTER COLUMN "visibility" DROP DEFAULT,
ALTER COLUMN "features" DROP NOT NULL,
ALTER COLUMN "photos" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."property_category" ALTER COLUMN "display_order" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."property_listings" ALTER COLUMN "property_id" DROP DEFAULT,
ALTER COLUMN "bedrooms" SET DATA TYPE INTEGER,
ALTER COLUMN "bathrooms" SET DATA TYPE INTEGER,
ALTER COLUMN "living_rooms" SET DATA TYPE INTEGER,
ALTER COLUMN "kitchens" SET DATA TYPE INTEGER,
ALTER COLUMN "floor_number" SET DATA TYPE INTEGER,
ALTER COLUMN "total_floors" SET DATA TYPE INTEGER,
ALTER COLUMN "building_year" SET DATA TYPE INTEGER,
ALTER COLUMN "has_parking" SET NOT NULL,
ALTER COLUMN "has_elevator" SET NOT NULL,
ALTER COLUMN "has_maids_room" SET NOT NULL,
ALTER COLUMN "has_driver_room" SET NOT NULL,
ALTER COLUMN "furnished" SET NOT NULL,
ALTER COLUMN "balcony" SET NOT NULL,
ALTER COLUMN "swimming_pool" SET NOT NULL,
ALTER COLUMN "central_ac" SET NOT NULL,
ALTER COLUMN "is_verified" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "views_count" SET NOT NULL,
ALTER COLUMN "favorites_count" SET NOT NULL,
ALTER COLUMN "listed_date" SET NOT NULL,
ALTER COLUMN "listed_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."property_media" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."property_type" ALTER COLUMN "display_order" SET NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."property_units" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."revenue_snapshots" DROP CONSTRAINT "revenue_snapshots_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "snapshotDate" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "revenue_snapshots_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."role_permissions" DROP CONSTRAINT "role_permissions_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "roleId" SET DATA TYPE TEXT,
ALTER COLUMN "permissionId" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."support_tickets" ALTER COLUMN "openedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "closedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."system_roles" DROP CONSTRAINT "system_roles_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."user_roles" DROP CONSTRAINT "user_roles_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "roleId" SET DATA TYPE TEXT,
ALTER COLUMN "assignedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "lastSeenAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."properties_seeker" (
    "seeker_num" BIGSERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "monthly_income" DECIMAL(65,30) NOT NULL,
    "gender" TEXT NOT NULL,
    "type_of_property" TEXT NOT NULL,
    "type_of_contract" TEXT NOT NULL,
    "number_of_rooms" INTEGER NOT NULL,
    "number_of_bathrooms" INTEGER NOT NULL,
    "number_of_living_rooms" INTEGER NOT NULL,
    "house_direction" TEXT,
    "budget_size" DECIMAL(65,30) NOT NULL,
    "has_maid_room" BOOLEAN NOT NULL DEFAULT false,
    "has_driver_room" BOOLEAN DEFAULT false,
    "kitchen_installed" BOOLEAN DEFAULT false,
    "has_elevator" BOOLEAN DEFAULT false,
    "parking_available" BOOLEAN DEFAULT false,
    "city" TEXT,
    "district" TEXT,
    "region" TEXT,
    "other_comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Sqm" BIGINT,
    "seeker_id" CHAR(13) GENERATED ALWAYS AS ('S-' || lpad(seeker_num::text, 11, '0')) STORED,

    CONSTRAINT "properties_seeker_pkey" PRIMARY KEY ("seeker_num")
);

-- CreateTable
CREATE TABLE "public"."CMSArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "contentJson" JSONB,
    "featuredImageId" TEXT,
    "authorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "ogImage" TEXT,

    CONSTRAINT "CMSArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CMSArticleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSArticleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CMSArticleCategoryRelation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSArticleCategoryRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CMSArticleTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSArticleTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CMSArticleTagRelation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSArticleTagRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CMSArticleVersion" (
    "id" BIGSERIAL NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CMSArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaLibrary" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "title" TEXT,
    "description" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MediaUsage" (
    "id" BIGSERIAL NOT NULL,
    "mediaId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SEOSettings" (
    "id" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "ogType" TEXT DEFAULT 'website',
    "twitterCard" TEXT DEFAULT 'summary_large_image',
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImage" TEXT,
    "robotsMeta" TEXT DEFAULT 'index, follow',
    "canonicalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentJson" JSONB,
    "variables" JSONB,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentTemplateVersion" (
    "id" BIGSERIAL NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NavigationLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "target" TEXT DEFAULT '_self',
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "public"."daily_system_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "totalListings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "disputesOpened" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_system_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."community_posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" JSONB,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'DISCUSSION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."community_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_seeker_seeker_id_key" ON "public"."properties_seeker"("seeker_id");

-- CreateIndex
CREATE INDEX "properties_seeker_city_district_idx" ON "public"."properties_seeker"("city", "district");

-- CreateIndex
CREATE INDEX "properties_seeker_city_idx" ON "public"."properties_seeker"("city");

-- CreateIndex
CREATE INDEX "properties_seeker_region_idx" ON "public"."properties_seeker"("region");

-- CreateIndex
CREATE INDEX "properties_seeker_type_of_property_type_of_contract_idx" ON "public"."properties_seeker"("type_of_property", "type_of_contract");

-- CreateIndex
CREATE UNIQUE INDEX "properties_seeker_email_mobile_number_key" ON "public"."properties_seeker"("email", "mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "CMSArticle_slug_key" ON "public"."CMSArticle"("slug");

-- CreateIndex
CREATE INDEX "CMSArticle_slug_idx" ON "public"."CMSArticle"("slug");

-- CreateIndex
CREATE INDEX "CMSArticle_status_idx" ON "public"."CMSArticle"("status");

-- CreateIndex
CREATE INDEX "CMSArticle_authorId_idx" ON "public"."CMSArticle"("authorId");

-- CreateIndex
CREATE INDEX "CMSArticle_publishedAt_idx" ON "public"."CMSArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "CMSArticle_createdAt_idx" ON "public"."CMSArticle"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CMSArticleCategory_slug_key" ON "public"."CMSArticleCategory"("slug");

-- CreateIndex
CREATE INDEX "CMSArticleCategory_slug_idx" ON "public"."CMSArticleCategory"("slug");

-- CreateIndex
CREATE INDEX "CMSArticleCategoryRelation_articleId_idx" ON "public"."CMSArticleCategoryRelation"("articleId");

-- CreateIndex
CREATE INDEX "CMSArticleCategoryRelation_categoryId_idx" ON "public"."CMSArticleCategoryRelation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSArticleCategoryRelation_articleId_categoryId_key" ON "public"."CMSArticleCategoryRelation"("articleId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSArticleTag_slug_key" ON "public"."CMSArticleTag"("slug");

-- CreateIndex
CREATE INDEX "CMSArticleTag_slug_idx" ON "public"."CMSArticleTag"("slug");

-- CreateIndex
CREATE INDEX "CMSArticleTagRelation_articleId_idx" ON "public"."CMSArticleTagRelation"("articleId");

-- CreateIndex
CREATE INDEX "CMSArticleTagRelation_tagId_idx" ON "public"."CMSArticleTagRelation"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSArticleTagRelation_articleId_tagId_key" ON "public"."CMSArticleTagRelation"("articleId", "tagId");

-- CreateIndex
CREATE INDEX "CMSArticleVersion_articleId_idx" ON "public"."CMSArticleVersion"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSArticleVersion_articleId_version_key" ON "public"."CMSArticleVersion"("articleId", "version");

-- CreateIndex
CREATE INDEX "MediaLibrary_mimeType_idx" ON "public"."MediaLibrary"("mimeType");

-- CreateIndex
CREATE INDEX "MediaLibrary_uploadedBy_idx" ON "public"."MediaLibrary"("uploadedBy");

-- CreateIndex
CREATE INDEX "MediaLibrary_createdAt_idx" ON "public"."MediaLibrary"("createdAt");

-- CreateIndex
CREATE INDEX "MediaUsage_mediaId_idx" ON "public"."MediaUsage"("mediaId");

-- CreateIndex
CREATE INDEX "MediaUsage_entityType_entityId_idx" ON "public"."MediaUsage"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SEOSettings_pagePath_key" ON "public"."SEOSettings"("pagePath");

-- CreateIndex
CREATE INDEX "SEOSettings_pagePath_idx" ON "public"."SEOSettings"("pagePath");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTemplate_slug_key" ON "public"."ContentTemplate"("slug");

-- CreateIndex
CREATE INDEX "ContentTemplate_slug_idx" ON "public"."ContentTemplate"("slug");

-- CreateIndex
CREATE INDEX "ContentTemplate_type_idx" ON "public"."ContentTemplate"("type");

-- CreateIndex
CREATE INDEX "ContentTemplate_category_idx" ON "public"."ContentTemplate"("category");

-- CreateIndex
CREATE INDEX "ContentTemplateVersion_templateId_idx" ON "public"."ContentTemplateVersion"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTemplateVersion_templateId_version_key" ON "public"."ContentTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "NavigationLink_order_idx" ON "public"."NavigationLink"("order");

-- CreateIndex
CREATE INDEX "NavigationLink_visible_idx" ON "public"."NavigationLink"("visible");

-- CreateIndex
CREATE INDEX "session_expire_idx" ON "public"."session"("expire");

-- CreateIndex
CREATE UNIQUE INDEX "daily_system_stats_date_key" ON "public"."daily_system_stats"("date");

-- CreateIndex
CREATE INDEX "daily_system_stats_date_idx" ON "public"."daily_system_stats"("date");

-- CreateIndex
CREATE INDEX "community_posts_authorId_idx" ON "public"."community_posts"("authorId");

-- CreateIndex
CREATE INDEX "community_posts_type_idx" ON "public"."community_posts"("type");

-- CreateIndex
CREATE INDEX "community_posts_createdAt_idx" ON "public"."community_posts"("createdAt");

-- CreateIndex
CREATE INDEX "community_comments_postId_idx" ON "public"."community_comments"("postId");

-- CreateIndex
CREATE INDEX "community_comments_authorId_idx" ON "public"."community_comments"("authorId");

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_propertyid_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."system_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."system_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_memberships" ADD CONSTRAINT "organization_memberships_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."system_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_invites" ADD CONSTRAINT "organization_invites_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."system_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment_methods" ADD CONSTRAINT "billing_payment_methods_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_usage_records" ADD CONSTRAINT "billing_usage_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."billing_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoices" ADD CONSTRAINT "billing_invoices_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoices" ADD CONSTRAINT "billing_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."billing_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."billing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_invoice_items" ADD CONSTRAINT "billing_invoice_items_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."billing_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payments" ADD CONSTRAINT "billing_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."billing_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payments" ADD CONSTRAINT "billing_payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payments" ADD CONSTRAINT "billing_payments_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "public"."billing_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payouts" ADD CONSTRAINT "billing_payouts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment_attempts" ADD CONSTRAINT "billing_payment_attempts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."billing_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."billing_payment_attempts" ADD CONSTRAINT "billing_payment_attempts_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "public"."billing_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CMSArticle" ADD CONSTRAINT "CMSArticle_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "public"."MediaLibrary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CMSArticleCategoryRelation" ADD CONSTRAINT "CMSArticleCategoryRelation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."CMSArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CMSArticleCategoryRelation" ADD CONSTRAINT "CMSArticleCategoryRelation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."CMSArticleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CMSArticleTagRelation" ADD CONSTRAINT "CMSArticleTagRelation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."CMSArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CMSArticleTagRelation" ADD CONSTRAINT "CMSArticleTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."CMSArticleTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CMSArticleVersion" ADD CONSTRAINT "CMSArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."CMSArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MediaUsage" ADD CONSTRAINT "MediaUsage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."MediaLibrary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentTemplateVersion" ADD CONSTRAINT "ContentTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ContentTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_type" ADD CONSTRAINT "property_type_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."property_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_posts" ADD CONSTRAINT "community_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_comments" ADD CONSTRAINT "community_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_comments" ADD CONSTRAINT "community_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."analytics_daily_metrics_metric_recordedFor_dimension_dimensionV" RENAME TO "analytics_daily_metrics_metric_recordedFor_dimension_dimens_key";

-- RenameIndex
ALTER INDEX "public"."idx_property_category_active" RENAME TO "property_category_is_active_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_category_code" RENAME TO "property_category_code_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_city" RENAME TO "property_listings_city_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_is_active" RENAME TO "property_listings_is_active_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_listed_date" RENAME TO "property_listings_listed_date_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_listing_type" RENAME TO "property_listings_listing_type_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_price" RENAME TO "property_listings_price_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_property_id" RENAME TO "property_listings_property_id_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_property_type" RENAME TO "property_listings_property_type_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_region" RENAME TO "property_listings_region_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_listings_status" RENAME TO "property_listings_status_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_type_active" RENAME TO "property_type_is_active_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_type_category" RENAME TO "property_type_category_id_idx";

-- RenameIndex
ALTER INDEX "public"."idx_property_type_code" RENAME TO "property_type_code_idx";
