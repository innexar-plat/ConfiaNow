-- CreateEnum
CREATE TYPE "ProviderSubscriptionStatus" AS ENUM ('NOT_ENABLED', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "ProviderRecommendationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "provider_dashboard_snapshots" (
    "id" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "subscriptionStatus" "ProviderSubscriptionStatus" NOT NULL DEFAULT 'NOT_ENABLED',
    "isProfilePublished" BOOLEAN NOT NULL DEFAULT false,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "openLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "lateLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "respondedLeadsCount" INTEGER NOT NULL DEFAULT 0,
    "approvedReviewsCount" INTEGER NOT NULL DEFAULT 0,
    "pendingReviewsCount" INTEGER NOT NULL DEFAULT 0,
    "pendingActionsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_dashboard_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_recommendations" (
    "id" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ProviderRecommendationPriority" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_dashboard_snapshots_businessProfileId_snapshotDate_idx" ON "provider_dashboard_snapshots"("businessProfileId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "provider_dashboard_snapshots_businessProfileId_snapshotDate_key" ON "provider_dashboard_snapshots"("businessProfileId", "snapshotDate");

-- CreateIndex
CREATE INDEX "provider_recommendations_businessProfileId_priority_isActiv_idx" ON "provider_recommendations"("businessProfileId", "priority", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "provider_recommendations_businessProfileId_code_key" ON "provider_recommendations"("businessProfileId", "code");

-- AddForeignKey
ALTER TABLE "provider_dashboard_snapshots" ADD CONSTRAINT "provider_dashboard_snapshots_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_recommendations" ADD CONSTRAINT "provider_recommendations_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
