-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PROFILE_VIEW', 'CONTACT_CLICK', 'LEAD_CREATED', 'REVIEW_SUBMITTED', 'SUBSCRIPTION_ACTIVATED', 'BOOST_ACTIVATED');

-- CreateEnum
CREATE TYPE "DailyMetricScope" AS ENUM ('PLATFORM', 'BUSINESS');

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "actorUserId" UUID,
    "businessProfileId" UUID,
    "categorySlug" TEXT,
    "citySlug" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_metrics" (
    "id" UUID NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "scope" "DailyMetricScope" NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "businessProfileId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_reports" (
    "id" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "profileViewsCount" INTEGER NOT NULL DEFAULT 0,
    "contactClicksCount" INTEGER NOT NULL DEFAULT 0,
    "leadsReceivedCount" INTEGER NOT NULL DEFAULT 0,
    "respondedLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION,
    "averageResponseHours" DOUBLE PRECISION,
    "trustScoreLatest" INTEGER NOT NULL DEFAULT 0,
    "trustScoreAverage" DOUBLE PRECISION,
    "approvedReviewsCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "platformAverageRating" DOUBLE PRECISION,
    "platformAverageResponseRate" DOUBLE PRECISION,
    "activeBoostCount" INTEGER NOT NULL DEFAULT 0,
    "demandHighlights" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_type_occurredAt_idx" ON "analytics_events"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_businessProfileId_type_occurredAt_idx" ON "analytics_events"("businessProfileId", "type", "occurredAt");

-- CreateIndex
CREATE INDEX "analytics_events_categorySlug_citySlug_occurredAt_idx" ON "analytics_events"("categorySlug", "citySlug", "occurredAt");

-- CreateIndex
CREATE INDEX "daily_metrics_scope_metricDate_idx" ON "daily_metrics"("scope", "metricDate");

-- CreateIndex
CREATE INDEX "daily_metrics_businessProfileId_metricDate_idx" ON "daily_metrics"("businessProfileId", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_metrics_metricDate_scope_scopeKey_metricKey_key" ON "daily_metrics"("metricDate", "scope", "scopeKey", "metricKey");

-- CreateIndex
CREATE INDEX "business_reports_businessProfileId_periodEnd_idx" ON "business_reports"("businessProfileId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "business_reports_businessProfileId_periodStart_periodEnd_key" ON "business_reports"("businessProfileId", "periodStart", "periodEnd");

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_reports" ADD CONSTRAINT "business_reports_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
