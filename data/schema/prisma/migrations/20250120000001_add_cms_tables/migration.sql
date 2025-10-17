-- CreateTable
CREATE TABLE "public"."LandingSection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "layoutVariant" TEXT NOT NULL DEFAULT 'custom',
    "theme" JSONB,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "draftJson" JSONB,
    "publishedJson" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "publishedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LandingCard" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "body" TEXT,
    "mediaUrl" TEXT,
    "icon" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "draftJson" JSONB,
    "publishedJson" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "publishedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LandingAuditLog" (
    "id" BIGSERIAL NOT NULL,
    "actor" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromVersion" INTEGER,
    "toVersion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LandingVersion" (
    "id" BIGSERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LandingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LandingSection_slug_key" ON "public"."LandingSection"("slug");

-- CreateIndex
CREATE INDEX "LandingSection_status_idx" ON "public"."LandingSection"("status");

-- CreateIndex
CREATE INDEX "LandingSection_orderIndex_idx" ON "public"."LandingSection"("orderIndex");

-- CreateIndex
CREATE INDEX "LandingCard_sectionId_idx" ON "public"."LandingCard"("sectionId");

-- CreateIndex
CREATE INDEX "LandingCard_status_idx" ON "public"."LandingCard"("status");

-- CreateIndex
CREATE INDEX "LandingCard_orderIndex_idx" ON "public"."LandingCard"("orderIndex");

-- CreateIndex
CREATE INDEX "LandingAuditLog_entityType_entityId_idx" ON "public"."LandingAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "LandingVersion_entityType_entityId_idx" ON "public"."LandingVersion"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "LandingVersion_entityType_entityId_version_key" ON "public"."LandingVersion"("entityType", "entityId", "version");

-- AddForeignKey
ALTER TABLE "public"."LandingCard" ADD CONSTRAINT "LandingCard_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."LandingSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
