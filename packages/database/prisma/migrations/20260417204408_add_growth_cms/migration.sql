-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('CMS', 'CITY', 'CATEGORY');

-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "pages" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "PageType" NOT NULL DEFAULT 'CMS',
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ogImage" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "canonicalUrl" TEXT,
    "entitySlug" TEXT,
    "authorId" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT,
    "body" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metadata" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entitySlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "structuredData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_attributions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "landingPage" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "pages_type_status_idx" ON "pages"("type", "status");

-- CreateIndex
CREATE INDEX "pages_entitySlug_idx" ON "pages"("entitySlug");

-- CreateIndex
CREATE INDEX "page_sections_pageId_order_idx" ON "page_sections"("pageId", "order");

-- CreateIndex
CREATE INDEX "seo_metadata_entityType_entitySlug_idx" ON "seo_metadata"("entityType", "entitySlug");

-- CreateIndex
CREATE UNIQUE INDEX "seo_metadata_entityType_entitySlug_key" ON "seo_metadata"("entityType", "entitySlug");

-- CreateIndex
CREATE INDEX "campaign_attributions_userId_idx" ON "campaign_attributions"("userId");

-- CreateIndex
CREATE INDEX "campaign_attributions_utmCampaign_createdAt_idx" ON "campaign_attributions"("utmCampaign", "createdAt");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_attributions" ADD CONSTRAINT "campaign_attributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
