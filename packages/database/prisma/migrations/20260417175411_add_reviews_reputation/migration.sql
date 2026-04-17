-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'MORE_INFO_REQUIRED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "trust_scores" ADD COLUMN     "approvedReviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "reputationPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "clientUserId" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_evidence" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_moderation_queue" (
    "id" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "assignedAdminId" UUID,
    "reviewedByUserId" UUID,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "decisionNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_leadId_key" ON "reviews"("leadId");

-- CreateIndex
CREATE INDEX "reviews_businessProfileId_status_createdAt_idx" ON "reviews"("businessProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_clientUserId_createdAt_idx" ON "reviews"("clientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "review_evidence_reviewId_createdAt_idx" ON "review_evidence"("reviewId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "review_moderation_queue_reviewId_key" ON "review_moderation_queue"("reviewId");

-- CreateIndex
CREATE INDEX "review_moderation_queue_status_requestedAt_idx" ON "review_moderation_queue"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "review_moderation_queue_assignedAdminId_idx" ON "review_moderation_queue"("assignedAdminId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_evidence" ADD CONSTRAINT "review_evidence_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_moderation_queue" ADD CONSTRAINT "review_moderation_queue_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_moderation_queue" ADD CONSTRAINT "review_moderation_queue_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_moderation_queue" ADD CONSTRAINT "review_moderation_queue_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
