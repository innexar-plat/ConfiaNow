-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('OPEN', 'VIEWED', 'RESPONDED', 'CONTACT_RELEASED', 'CLOSED');

-- CreateEnum
CREATE TYPE "LeadMessageSenderRole" AS ENUM ('CLIENT', 'BUSINESS');

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "clientUserId" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "messagePreview" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'OPEN',
    "respondedAt" TIMESTAMP(3),
    "contactReleasedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_messages" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "senderRole" "LeadMessageSenderRole" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_status_history" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus" NOT NULL,
    "actorUserId" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_contact_releases" (
    "id" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "actorUserId" UUID,
    "releasedEmail" TEXT,
    "releasedPhone" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_contact_releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_clientUserId_createdAt_idx" ON "leads"("clientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "leads_businessProfileId_createdAt_idx" ON "leads"("businessProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "lead_messages_leadId_createdAt_idx" ON "lead_messages"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_status_history_leadId_createdAt_idx" ON "lead_status_history"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_contact_releases_leadId_createdAt_idx" ON "lead_contact_releases"("leadId", "createdAt");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_messages" ADD CONSTRAINT "lead_messages_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_messages" ADD CONSTRAINT "lead_messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_contact_releases" ADD CONSTRAINT "lead_contact_releases_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_contact_releases" ADD CONSTRAINT "lead_contact_releases_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
