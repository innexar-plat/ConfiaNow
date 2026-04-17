-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_search_index" (
    "id" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "headline" TEXT,
    "description" TEXT,
    "citySlug" TEXT,
    "cityName" TEXT,
    "stateCode" TEXT,
    "categorySlugs" TEXT[],
    "searchText" TEXT NOT NULL,
    "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_CONTACT_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_search_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_snapshots" (
    "id" UUID NOT NULL,
    "query" TEXT,
    "categorySlug" TEXT,
    "citySlug" TEXT,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_slug_idx" ON "cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_search_index_businessProfileId_key" ON "business_search_index"("businessProfileId");

-- CreateIndex
CREATE INDEX "business_search_index_isPublished_rankingScore_idx" ON "business_search_index"("isPublished", "rankingScore");

-- CreateIndex
CREATE INDEX "business_search_index_citySlug_idx" ON "business_search_index"("citySlug");

-- CreateIndex
CREATE INDEX "search_snapshots_createdAt_idx" ON "search_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "search_snapshots_categorySlug_idx" ON "search_snapshots"("categorySlug");

-- CreateIndex
CREATE INDEX "search_snapshots_citySlug_idx" ON "search_snapshots"("citySlug");

-- AddForeignKey
ALTER TABLE "business_search_index" ADD CONSTRAINT "business_search_index_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
