-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" TEXT NOT NULL,
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "licenseNo" TEXT NOT NULL,
    "licenseValidTo" DATETIME NOT NULL,
    "territories" TEXT NOT NULL,
    "isIndividualAgent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "specialties" TEXT NOT NULL,
    "experience" INTEGER,
    "bio" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agent_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "bathrooms" DECIMAL,
    "areaSqm" DECIMAL,
    "price" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "features" TEXT NOT NULL,
    "photos" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "properties_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "properties_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "organizationId" TEXT,
    "listingType" TEXT NOT NULL,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "price" DECIMAL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "listings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "listings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "listings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "buyer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdByUserId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minBedrooms" INTEGER,
    "maxBedrooms" INTEGER,
    "minPrice" DECIMAL,
    "maxPrice" DECIMAL,
    "contactPreferences" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "maskedContact" TEXT NOT NULL,
    "fullContactJson" TEXT NOT NULL,
    "multiAgentAllowed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "buyer_requests_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "seller_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdByUserId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "priceExpectation" DECIMAL,
    "exclusivePreference" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "maskedContact" TEXT NOT NULL,
    "fullContactJson" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "seller_submissions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "buyerRequestId" TEXT,
    "sellerSubmissionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leads_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leads_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "buyer_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "leads_sellerSubmissionId_fkey" FOREIGN KEY ("sellerSubmissionId") REFERENCES "seller_submissions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "buyerRequestId" TEXT NOT NULL,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "claims_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "claims_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "buyer_requests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contact_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "contactedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_logs_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contact_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "footerCopyright" TEXT NOT NULL DEFAULT '© 2024 منصة عقاراتي. جميع الحقوق محفوظة.'
);

-- CreateTable
CREATE TABLE "landing_page_features" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landingPageContentId" TEXT NOT NULL,
    CONSTRAINT "landing_page_features_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "landing_page_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "suffix" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landingPageContentId" TEXT NOT NULL,
    CONSTRAINT "landing_page_stats_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "landing_page_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_solutions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landingPageContentId" TEXT NOT NULL,
    CONSTRAINT "landing_page_solutions_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "landing_page_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_solution_features" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "solutionId" TEXT NOT NULL,
    CONSTRAINT "landing_page_solution_features_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "landing_page_solutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_hero_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landingPageContentId" TEXT NOT NULL,
    CONSTRAINT "landing_page_hero_metrics_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "landing_page_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_contact_info" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landingPageContentId" TEXT NOT NULL,
    CONSTRAINT "landing_page_contact_info_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "landing_page_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_footer_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landingPageContentId" TEXT NOT NULL,
    CONSTRAINT "landing_page_footer_links_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "landing_page_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "landing_page_navigation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "landingPageContentId" TEXT NOT NULL,
    CONSTRAINT "landing_page_navigation_landingPageContentId_fkey" FOREIGN KEY ("landingPageContentId") REFERENCES "landing_page_content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pricing_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "buttonText" TEXT NOT NULL DEFAULT 'ابدأ الآن',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pricing_plan_features" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pricingPlanId" TEXT NOT NULL,
    CONSTRAINT "pricing_plan_features_pricingPlanId_fkey" FOREIGN KEY ("pricingPlanId") REFERENCES "pricing_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerUserId" TEXT,
    "organizationId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "file_assets_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "file_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_licenseNo_key" ON "organizations"("licenseNo");

-- CreateIndex
CREATE INDEX "organizations_licenseNo_idx" ON "organizations"("licenseNo");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_userId_key" ON "agent_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_licenseNo_key" ON "agent_profiles"("licenseNo");

-- CreateIndex
CREATE INDEX "agent_profiles_userId_idx" ON "agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "agent_profiles_organizationId_idx" ON "agent_profiles"("organizationId");

-- CreateIndex
CREATE INDEX "agent_profiles_licenseNo_idx" ON "agent_profiles"("licenseNo");

-- CreateIndex
CREATE INDEX "agent_profiles_status_idx" ON "agent_profiles"("status");

-- CreateIndex
CREATE INDEX "properties_agentId_idx" ON "properties"("agentId");

-- CreateIndex
CREATE INDEX "properties_organizationId_idx" ON "properties"("organizationId");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "properties"("city");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_type_idx" ON "properties"("type");

-- CreateIndex
CREATE INDEX "properties_price_idx" ON "properties"("price");

-- CreateIndex
CREATE INDEX "listings_propertyId_idx" ON "listings"("propertyId");

-- CreateIndex
CREATE INDEX "listings_agentId_idx" ON "listings"("agentId");

-- CreateIndex
CREATE INDEX "listings_organizationId_idx" ON "listings"("organizationId");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_listingType_idx" ON "listings"("listingType");

-- CreateIndex
CREATE INDEX "buyer_requests_createdByUserId_idx" ON "buyer_requests"("createdByUserId");

-- CreateIndex
CREATE INDEX "buyer_requests_city_idx" ON "buyer_requests"("city");

-- CreateIndex
CREATE INDEX "buyer_requests_status_idx" ON "buyer_requests"("status");

-- CreateIndex
CREATE INDEX "buyer_requests_type_idx" ON "buyer_requests"("type");

-- CreateIndex
CREATE INDEX "buyer_requests_maxPrice_idx" ON "buyer_requests"("maxPrice");

-- CreateIndex
CREATE INDEX "seller_submissions_createdByUserId_idx" ON "seller_submissions"("createdByUserId");

-- CreateIndex
CREATE INDEX "seller_submissions_city_idx" ON "seller_submissions"("city");

-- CreateIndex
CREATE INDEX "seller_submissions_status_idx" ON "seller_submissions"("status");

-- CreateIndex
CREATE INDEX "seller_submissions_type_idx" ON "seller_submissions"("type");

-- CreateIndex
CREATE INDEX "leads_agentId_idx" ON "leads"("agentId");

-- CreateIndex
CREATE INDEX "leads_buyerRequestId_idx" ON "leads"("buyerRequestId");

-- CreateIndex
CREATE INDEX "leads_sellerSubmissionId_idx" ON "leads"("sellerSubmissionId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "claims_agentId_idx" ON "claims"("agentId");

-- CreateIndex
CREATE INDEX "claims_buyerRequestId_idx" ON "claims"("buyerRequestId");

-- CreateIndex
CREATE INDEX "claims_status_idx" ON "claims"("status");

-- CreateIndex
CREATE INDEX "claims_expiresAt_idx" ON "claims"("expiresAt");

-- CreateIndex
CREATE INDEX "contact_logs_leadId_idx" ON "contact_logs"("leadId");

-- CreateIndex
CREATE INDEX "contact_logs_agentId_idx" ON "contact_logs"("agentId");

-- CreateIndex
CREATE INDEX "contact_logs_contactedAt_idx" ON "contact_logs"("contactedAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "file_assets_ownerUserId_idx" ON "file_assets"("ownerUserId");

-- CreateIndex
CREATE INDEX "file_assets_organizationId_idx" ON "file_assets"("organizationId");

-- CreateIndex
CREATE INDEX "file_assets_entity_idx" ON "file_assets"("entity");

-- CreateIndex
CREATE INDEX "file_assets_entityId_idx" ON "file_assets"("entityId");
