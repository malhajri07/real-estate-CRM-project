-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('WEBSITE_ADMIN', 'CORP_OWNER', 'CORP_AGENT', 'INDIV_AGENT', 'SELLER', 'BUYER');

-- CreateEnum
CREATE TYPE "public"."OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."AgentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD', 'RENTED', 'PENDING_APPROVAL');

-- CreateEnum
CREATE TYPE "public"."ListingType" AS ENUM ('RENT', 'SALE');

-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD', 'RENTED', 'PENDING_APPROVAL');

-- CreateEnum
CREATE TYPE "public"."BuyerRequestStatus" AS ENUM ('OPEN', 'CLAIMED', 'CLOSED', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."SellerSubmissionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "public"."ClaimStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'RELEASED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "public"."ContactChannel" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP', 'SMS', 'IN_PERSON');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "status" "public"."OrganizationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "licenseNo" TEXT NOT NULL,
    "licenseValidTo" TIMESTAMP(3) NOT NULL,
    "territories" TEXT NOT NULL,
    "isIndividualAgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."AgentStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "specialties" TEXT NOT NULL,
    "experience" INTEGER,
    "bio" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."properties" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" DECIMAL(65,30),
    "areaSqm" DECIMAL(65,30),
    "price" DECIMAL(65,30) NOT NULL,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "features" TEXT NOT NULL,
    "photos" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."listings" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "organizationId" TEXT,
    "listingType" "public"."ListingType" NOT NULL,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "status" "public"."ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DECIMAL(65,30),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."buyer_requests" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minBedrooms" INTEGER,
    "maxBedrooms" INTEGER,
    "minPrice" DECIMAL(65,30),
    "maxPrice" DECIMAL(65,30),
    "contactPreferences" TEXT NOT NULL,
    "status" "public"."BuyerRequestStatus" NOT NULL DEFAULT 'OPEN',
    "maskedContact" TEXT NOT NULL,
    "fullContactJson" TEXT NOT NULL,
    "multiAgentAllowed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seller_submissions" (
    "id" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "priceExpectation" DECIMAL(65,30),
    "exclusivePreference" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."SellerSubmissionStatus" NOT NULL DEFAULT 'OPEN',
    "maskedContact" TEXT NOT NULL,
    "fullContactJson" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "buyerRequestId" TEXT,
    "sellerSubmissionId" TEXT,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."claims" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "buyerRequestId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."ClaimStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_logs" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "channel" "public"."ContactChannel" NOT NULL,
    "contactedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_content" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "loadingText" TEXT NOT NULL DEFAULT 'جار تحميل المحتوى...',
    "heroWelcomeText" TEXT NOT NULL DEFAULT 'مرحباً بك في',
    "heroTitle" TEXT NOT NULL DEFAULT 'منصة عقاراتي للوساطة العقارية',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'منصة شاملة لإدارة العقارات والوساطة العقارية مع أدوات تسويق متقدمة',
    "heroButton" TEXT NOT NULL DEFAULT 'ابدأ رحلتك المجانية',
    "heroLoginButton" TEXT NOT NULL DEFAULT 'تسجيل الدخول',
    "heroDashboardTitle" TEXT NOT NULL DEFAULT 'منصة عقاراتي - لوحة التحكم',
    "featuresTitle" TEXT NOT NULL DEFAULT 'لماذا تختار منصة عقاراتي؟',
    "featuresDescription" TEXT NOT NULL DEFAULT 'عندما يجتمع التحديث بالاحترافية، تكون منصة عقاراتي هي الخيار الأمثل لإدارة عقاراتك بكفاءة',
    "solutionsTitle" TEXT NOT NULL DEFAULT 'حلول شاملة لإدارة العقارات',
    "solutionsDescription" TEXT NOT NULL DEFAULT 'أدوات متكاملة تساعدك في إدارة جميع جوانب أعمالك العقارية',
    "statsTitle" TEXT NOT NULL DEFAULT 'أرقامنا تتحدث',
    "pricingTitle" TEXT NOT NULL DEFAULT 'خطط الأسعار',
    "pricingSubtitle" TEXT NOT NULL DEFAULT 'اختر الخطة المناسبة لك',
    "contactTitle" TEXT NOT NULL DEFAULT 'تواصل معنا',
    "contactDescription" TEXT NOT NULL DEFAULT 'نحن هنا لمساعدتك في رحلتك العقارية',
    "footerDescription" TEXT NOT NULL DEFAULT 'منصة عقاراتي - الحل الشامل لإدارة العقارات والوساطة العقارية',
    "footerCopyright" TEXT NOT NULL DEFAULT '© 2024 منصة عقاراتي. جميع الحقوق محفوظة.',

    CONSTRAINT "landing_page_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_features" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landingPageContentId" TEXT NOT NULL,

    CONSTRAINT "landing_page_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_stats" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "suffix" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landingPageContentId" TEXT NOT NULL,

    CONSTRAINT "landing_page_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_solutions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landingPageContentId" TEXT NOT NULL,

    CONSTRAINT "landing_page_solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_solution_features" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "solutionId" TEXT NOT NULL,

    CONSTRAINT "landing_page_solution_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_hero_metrics" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landingPageContentId" TEXT NOT NULL,

    CONSTRAINT "landing_page_hero_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_contact_info" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landingPageContentId" TEXT NOT NULL,

    CONSTRAINT "landing_page_contact_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_footer_links" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landingPageContentId" TEXT NOT NULL,

    CONSTRAINT "landing_page_footer_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing_page_navigation" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landingPageContentId" TEXT NOT NULL,

    CONSTRAINT "landing_page_navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pricing_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL DEFAULT 'ابدأ الآن',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pricing_plan_features" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pricingPlanId" TEXT NOT NULL,

    CONSTRAINT "pricing_plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_assets" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "organizationId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "firstNameAr" TEXT,
    "lastNameAr" TEXT,
    "roleType" TEXT,
    "accountIdType" TEXT,
    "accountNumber" TEXT NOT NULL,
    "parentAccount" TEXT,
    "usernameEn" TEXT,
    "mobile" TEXT,
    "createDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "public"."users"("organizationId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_licenseNo_key" ON "public"."organizations"("licenseNo");

-- CreateIndex
CREATE INDEX "organizations_licenseNo_idx" ON "public"."organizations"("licenseNo");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "public"."organizations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "public"."agent_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_licenseNo_key" ON "public"."agent_profiles"("licenseNo");

-- CreateIndex
CREATE INDEX "agent_profiles_userId_idx" ON "public"."agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "agent_profiles_organizationId_idx" ON "public"."agent_profiles"("organizationId");

-- CreateIndex
CREATE INDEX "agent_profiles_licenseNo_idx" ON "public"."agent_profiles"("licenseNo");

-- CreateIndex
CREATE INDEX "agent_profiles_status_idx" ON "public"."agent_profiles"("status");

-- CreateIndex
CREATE INDEX "properties_agentId_idx" ON "public"."properties"("agentId");

-- CreateIndex
CREATE INDEX "properties_organizationId_idx" ON "public"."properties"("organizationId");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "public"."properties"("city");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "public"."properties"("status");

-- CreateIndex
CREATE INDEX "properties_type_idx" ON "public"."properties"("type");

-- CreateIndex
CREATE INDEX "properties_price_idx" ON "public"."properties"("price");

-- CreateIndex
CREATE INDEX "listings_propertyId_idx" ON "public"."listings"("propertyId");

-- CreateIndex
CREATE INDEX "listings_agentId_idx" ON "public"."listings"("agentId");

-- CreateIndex
CREATE INDEX "listings_organizationId_idx" ON "public"."listings"("organizationId");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "public"."listings"("status");

-- CreateIndex
CREATE INDEX "listings_listingType_idx" ON "public"."listings"("listingType");

-- CreateIndex
CREATE INDEX "buyer_requests_createdByUserId_idx" ON "public"."buyer_requests"("createdByUserId");

-- CreateIndex
CREATE INDEX "buyer_requests_city_idx" ON "public"."buyer_requests"("city");

-- CreateIndex
CREATE INDEX "buyer_requests_status_idx" ON "public"."buyer_requests"("status");

-- CreateIndex
CREATE INDEX "buyer_requests_type_idx" ON "public"."buyer_requests"("type");

-- CreateIndex
CREATE INDEX "buyer_requests_maxPrice_idx" ON "public"."buyer_requests"("maxPrice");

-- CreateIndex
CREATE INDEX "seller_submissions_createdByUserId_idx" ON "public"."seller_submissions"("createdByUserId");

-- CreateIndex
CREATE INDEX "seller_submissions_city_idx" ON "public"."seller_submissions"("city");

-- CreateIndex
CREATE INDEX "seller_submissions_status_idx" ON "public"."seller_submissions"("status");

-- CreateIndex
CREATE INDEX "seller_submissions_type_idx" ON "public"."seller_submissions"("type");

-- CreateIndex
CREATE INDEX "leads_agentId_idx" ON "public"."leads"("agentId");

-- CreateIndex
CREATE INDEX "leads_buyerRequestId_idx" ON "public"."leads"("buyerRequestId");

-- CreateIndex
CREATE INDEX "leads_sellerSubmissionId_idx" ON "public"."leads"("sellerSubmissionId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "public"."leads"("status");

-- CreateIndex
CREATE INDEX "claims_agentId_idx" ON "public"."claims"("agentId");

-- CreateIndex
CREATE INDEX "claims_buyerRequestId_idx" ON "public"."claims"("buyerRequestId");

-- CreateIndex
CREATE INDEX "claims_status_idx" ON "public"."claims"("status");

-- CreateIndex
CREATE INDEX "claims_expiresAt_idx" ON "public"."claims"("expiresAt");

-- CreateIndex
CREATE INDEX "contact_logs_leadId_idx" ON "public"."contact_logs"("leadId");

-- CreateIndex
CREATE INDEX "contact_logs_agentId_idx" ON "public"."contact_logs"("agentId");

-- CreateIndex
CREATE INDEX "contact_logs_contactedAt_idx" ON "public"."contact_logs"("contactedAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "public"."audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "public"."audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "file_assets_ownerUserId_idx" ON "public"."file_assets"("ownerUserId");

-- CreateIndex
CREATE INDEX "file_assets_organizationId_idx" ON "public"."file_assets"("organizationId");

-- CreateIndex
CREATE INDEX "file_assets_entity_idx" ON "public"."file_assets"("entity");

-- CreateIndex
CREATE INDEX "file_assets_entityId_idx" ON "public"."file_assets"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_accountNumber_key" ON "public"."accounts"("accountNumber");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_profiles" ADD CONSTRAINT "agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agent_profiles" ADD CONSTRAINT "agent_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."listings" ADD CONSTRAINT "listings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."buyer_requests" ADD CONSTRAINT "buyer_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seller_submissions" ADD CONSTRAINT "seller_submissions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "public"."buyer_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leads" ADD CONSTRAINT "leads_sellerSubmissionId_fkey" FOREIGN KEY ("sellerSubmissionId") REFERENCES "public"."seller_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."claims" ADD CONSTRAINT "claims_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."claims" ADD CONSTRAINT "claims_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "public"."buyer_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_logs" ADD CONSTRAINT "contact_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_logs" ADD CONSTRAINT "contact_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_features" ADD CONSTRAINT "landing_page_features_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "public"."landing_page_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_stats" ADD CONSTRAINT "landing_page_stats_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "public"."landing_page_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_solutions" ADD CONSTRAINT "landing_page_solutions_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "public"."landing_page_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_solution_features" ADD CONSTRAINT "landing_page_solution_features_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "public"."landing_page_solutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_hero_metrics" ADD CONSTRAINT "landing_page_hero_metrics_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "public"."landing_page_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_contact_info" ADD CONSTRAINT "landing_page_contact_info_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "public"."landing_page_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_footer_links" ADD CONSTRAINT "landing_page_footer_links_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "public"."landing_page_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."landing_page_navigation" ADD CONSTRAINT "landing_page_navigation_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "public"."landing_page_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pricing_plan_features" ADD CONSTRAINT "pricing_plan_features_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "public"."pricing_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_assets" ADD CONSTRAINT "file_assets_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_assets" ADD CONSTRAINT "file_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
