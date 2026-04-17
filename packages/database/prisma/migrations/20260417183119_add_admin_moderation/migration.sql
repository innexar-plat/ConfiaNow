-- CreateEnum
CREATE TYPE "ModerationCaseStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationCaseType" AS ENUM ('REPORT_BUSINESS', 'REPORT_REVIEW', 'REPORT_USER', 'FRAUD_SUSPECTED', 'SPAM', 'OTHER');

-- CreateTable
CREATE TABLE "moderation_cases" (
    "id" UUID NOT NULL,
    "type" "ModerationCaseType" NOT NULL,
    "status" "ModerationCaseStatus" NOT NULL DEFAULT 'OPEN',
    "reporterUserId" UUID,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "internalNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_decisions" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "decision" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_cases_status_createdAt_idx" ON "moderation_cases"("status", "createdAt");

-- CreateIndex
CREATE INDEX "moderation_cases_targetType_targetId_idx" ON "moderation_cases"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "moderation_decisions_caseId_createdAt_idx" ON "moderation_decisions"("caseId", "createdAt");

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_decisions" ADD CONSTRAINT "moderation_decisions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_decisions" ADD CONSTRAINT "moderation_decisions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
