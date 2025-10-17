CREATE TABLE "cms_content_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cms_content_blocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cms_content_blocks_key_locale_key" ON "cms_content_blocks"("key", "locale");
CREATE INDEX "cms_content_blocks_locale_idx" ON "cms_content_blocks"("locale");
