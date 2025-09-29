-- AlterTable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'properties'
  ) THEN
    BEGIN
      ALTER TABLE "public"."properties" ADD COLUMN "regionId" INTEGER;
    EXCEPTION
      WHEN duplicate_column THEN
        RAISE NOTICE 'Column regionId already exists on properties.';
    END;

    BEGIN
      ALTER TABLE "public"."properties" ADD COLUMN "cityId" INTEGER;
    EXCEPTION
      WHEN duplicate_column THEN
        RAISE NOTICE 'Column cityId already exists on properties.';
    END;

    BEGIN
      ALTER TABLE "public"."properties" ADD COLUMN "districtId" BIGINT;
    EXCEPTION
      WHEN duplicate_column THEN
        RAISE NOTICE 'Column districtId already exists on properties.';
    END;
  ELSE
    RAISE NOTICE 'Table public.properties does not exist. Skipping property location columns.';
  END IF;
END
$$;

-- CreateTable
CREATE TABLE "public"."regions" (
    "id" INTEGER NOT NULL,
    "code" TEXT,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "population" INTEGER,
    "centerLatitude" DECIMAL(65,30),
    "centerLongitude" DECIMAL(65,30),
    "boundary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cities" (
    "id" INTEGER NOT NULL,
    "regionId" INTEGER NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "centerLatitude" DECIMAL(65,30),
    "centerLongitude" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."districts" (
    "id" BIGINT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "cityId" INTEGER NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "boundary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "regions_nameEn_idx" ON "public"."regions"("nameEn");

-- CreateIndex
CREATE INDEX "regions_nameAr_idx" ON "public"."regions"("nameAr");

-- CreateIndex
CREATE INDEX "cities_regionId_idx" ON "public"."cities"("regionId");

-- CreateIndex
CREATE INDEX "cities_nameEn_idx" ON "public"."cities"("nameEn");

-- CreateIndex
CREATE INDEX "cities_nameAr_idx" ON "public"."cities"("nameAr");

-- CreateIndex
CREATE INDEX "districts_regionId_idx" ON "public"."districts"("regionId");

-- CreateIndex
CREATE INDEX "districts_cityId_idx" ON "public"."districts"("cityId");

-- CreateIndex
CREATE INDEX "districts_nameEn_idx" ON "public"."districts"("nameEn");

-- CreateIndex
CREATE INDEX "districts_nameAr_idx" ON "public"."districts"("nameAr");

-- CreateIndex (conditional for properties table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'regionId'
  ) THEN
    BEGIN
      CREATE INDEX "properties_regionId_idx" ON "public"."properties"("regionId");
    EXCEPTION
      WHEN duplicate_table THEN
        RAISE NOTICE 'Index properties_regionId_idx already exists.';
    END;

    BEGIN
      CREATE INDEX "properties_cityId_idx" ON "public"."properties"("cityId");
    EXCEPTION
      WHEN duplicate_table THEN
        RAISE NOTICE 'Index properties_cityId_idx already exists.';
    END;

    BEGIN
      CREATE INDEX "properties_districtId_idx" ON "public"."properties"("districtId");
    EXCEPTION
      WHEN duplicate_table THEN
        RAISE NOTICE 'Index properties_districtId_idx already exists.';
    END;
  ELSE
    RAISE NOTICE 'Skipping property location indexes because columns do not exist.';
  END IF;
END
$$;

-- AddForeignKey
ALTER TABLE "public"."cities" ADD CONSTRAINT "cities_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."districts" ADD CONSTRAINT "districts_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."districts" ADD CONSTRAINT "districts_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (conditional for properties table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'regionId'
  ) THEN
    BEGIN
      ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint properties_regionId_fkey already exists.';
    END;

    BEGIN
      ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint properties_cityId_fkey already exists.';
    END;

    BEGIN
      ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint properties_districtId_fkey already exists.';
    END;
  ELSE
    RAISE NOTICE 'Skipping property location foreign keys because columns do not exist.';
  END IF;
END
$$;
