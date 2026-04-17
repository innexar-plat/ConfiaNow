-- CreateEnum
CREATE TYPE "BadgeLevelCode" AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "BadgeEventType" AS ENUM ('RECALCULATED', 'PROMOTED', 'DEMOTED', 'SUSPENDED', 'RESTORED');

-- AlterTable
ALTER TABLE "business_search_index" ADD COLUMN     "trustBadge" "BadgeLevelCode" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "badge_levels" (
    "id" UUID NOT NULL,
    "code" "BadgeLevelCode" NOT NULL,
    "label" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_scores" (
    "id" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "badgeLevelId" UUID,
    "score" INTEGER NOT NULL DEFAULT 0,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "verificationPoints" INTEGER NOT NULL DEFAULT 0,
    "profilePoints" INTEGER NOT NULL DEFAULT 0,
    "servicePoints" INTEGER NOT NULL DEFAULT 0,
    "portfolioPoints" INTEGER NOT NULL DEFAULT 0,
    "leadResponsePoints" INTEGER NOT NULL DEFAULT 0,
    "penaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalLeadCount" INTEGER NOT NULL DEFAULT 0,
    "respondedLeadCount" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_events" (
    "id" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "actorUserId" UUID,
    "type" "BadgeEventType" NOT NULL,
    "previousBadgeLevel" "BadgeLevelCode",
    "nextBadgeLevel" "BadgeLevelCode",
    "scoreBefore" INTEGER,
    "scoreAfter" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_penalties" (
    "id" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "actorUserId" UUID,
    "reason" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_penalties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badge_levels_code_key" ON "badge_levels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "trust_scores_businessProfileId_key" ON "trust_scores"("businessProfileId");

-- CreateIndex
CREATE INDEX "trust_scores_score_idx" ON "trust_scores"("score");

-- CreateIndex
CREATE INDEX "trust_scores_isSuspended_idx" ON "trust_scores"("isSuspended");

-- CreateIndex
CREATE INDEX "badge_events_businessProfileId_createdAt_idx" ON "badge_events"("businessProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "badge_penalties_businessProfileId_isActive_idx" ON "badge_penalties"("businessProfileId", "isActive");

-- AddForeignKey
ALTER TABLE "trust_scores" ADD CONSTRAINT "trust_scores_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_scores" ADD CONSTRAINT "trust_scores_badgeLevelId_fkey" FOREIGN KEY ("badgeLevelId") REFERENCES "badge_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_events" ADD CONSTRAINT "badge_events_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_events" ADD CONSTRAINT "badge_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_penalties" ADD CONSTRAINT "badge_penalties_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_penalties" ADD CONSTRAINT "badge_penalties_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
