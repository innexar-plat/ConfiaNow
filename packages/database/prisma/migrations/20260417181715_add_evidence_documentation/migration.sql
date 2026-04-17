-- CreateEnum
CREATE TYPE "StoredFilePurpose" AS ENUM ('VERIFICATION_DOCUMENT', 'REVIEW_EVIDENCE', 'MODERATION_EVIDENCE', 'CHAT_ATTACHMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "StorageEventType" AS ENUM ('UPLOADED', 'VERSION_ADDED', 'LINKED', 'UNLINKED', 'DELETED', 'RESTORED');

-- CreateEnum
CREATE TYPE "EvidenceTargetType" AS ENUM ('VERIFICATION_REQUEST', 'REVIEW', 'REVIEW_MODERATION', 'CONVERSATION_MESSAGE');

-- AlterTable
ALTER TABLE "verification_documents" ADD COLUMN     "latestFileId" UUID,
ADD COLUMN     "versionNumber" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "purpose" "StoredFilePurpose" NOT NULL DEFAULT 'GENERAL',
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "checksumSha256" TEXT,
    "uploadedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_links" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "targetType" "EvidenceTargetType" NOT NULL,
    "targetId" UUID NOT NULL,
    "description" TEXT,
    "actorUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_events" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "type" "StorageEventType" NOT NULL,
    "versionNumber" INTEGER,
    "actorUserId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_ownerUserId_createdAt_idx" ON "files"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "files_purpose_createdAt_idx" ON "files"("purpose", "createdAt");

-- CreateIndex
CREATE INDEX "document_versions_fileId_createdAt_idx" ON "document_versions"("fileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_fileId_versionNumber_key" ON "document_versions"("fileId", "versionNumber");

-- CreateIndex
CREATE INDEX "evidence_links_targetType_targetId_idx" ON "evidence_links"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "evidence_links_fileId_idx" ON "evidence_links"("fileId");

-- CreateIndex
CREATE INDEX "storage_events_fileId_createdAt_idx" ON "storage_events"("fileId", "createdAt");

-- CreateIndex
CREATE INDEX "storage_events_type_createdAt_idx" ON "storage_events"("type", "createdAt");

-- CreateIndex
CREATE INDEX "verification_documents_latestFileId_idx" ON "verification_documents"("latestFileId");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_links" ADD CONSTRAINT "evidence_links_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_events" ADD CONSTRAINT "storage_events_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_events" ADD CONSTRAINT "storage_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_latestFileId_fkey" FOREIGN KEY ("latestFileId") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
