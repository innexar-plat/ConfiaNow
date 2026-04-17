-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('VERIFICATION_PROVIDER', 'EMAIL_PROVIDER', 'STORAGE_PROVIDER');

-- CreateEnum
CREATE TYPE "IntegrationEventStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "BackgroundJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RetrySourceType" AS ENUM ('WEBHOOK_DELIVERY', 'BACKGROUND_JOB');

-- CreateEnum
CREATE TYPE "RetryQueueStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "integration_events" (
    "id" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "eventType" TEXT NOT NULL,
    "providerEventId" TEXT,
    "status" "IntegrationEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB,
    "signature" TEXT,
    "sourceIp" TEXT,
    "actorUserId" UUID,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "integrationEventId" UUID NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "endpoint" TEXT NOT NULL,
    "headers" JSONB,
    "payload" JSONB,
    "status" "IntegrationEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL,
    "integrationEventId" UUID,
    "provider" "IntegrationProvider",
    "jobType" TEXT NOT NULL,
    "queueName" TEXT NOT NULL DEFAULT 'default',
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "result" JSONB,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "retriedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retry_queue" (
    "id" UUID NOT NULL,
    "sourceType" "RetrySourceType" NOT NULL,
    "sourceId" UUID NOT NULL,
    "integrationEventId" UUID,
    "webhookDeliveryId" UUID,
    "backgroundJobId" UUID,
    "status" "RetryQueueStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "payload" JSONB,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "actorUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retry_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_events_providerEventId_key" ON "integration_events"("providerEventId");

-- CreateIndex
CREATE INDEX "integration_events_provider_status_receivedAt_idx" ON "integration_events"("provider", "status", "receivedAt");

-- CreateIndex
CREATE INDEX "integration_events_eventType_receivedAt_idx" ON "integration_events"("eventType", "receivedAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_provider_status_createdAt_idx" ON "webhook_deliveries"("provider", "status", "createdAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_integrationEventId_createdAt_idx" ON "webhook_deliveries"("integrationEventId", "createdAt");

-- CreateIndex
CREATE INDEX "background_jobs_status_runAt_idx" ON "background_jobs"("status", "runAt");

-- CreateIndex
CREATE INDEX "background_jobs_provider_status_createdAt_idx" ON "background_jobs"("provider", "status", "createdAt");

-- CreateIndex
CREATE INDEX "background_jobs_integrationEventId_createdAt_idx" ON "background_jobs"("integrationEventId", "createdAt");

-- CreateIndex
CREATE INDEX "retry_queue_status_nextAttemptAt_idx" ON "retry_queue"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "retry_queue_sourceType_sourceId_idx" ON "retry_queue"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "retry_queue_integrationEventId_createdAt_idx" ON "retry_queue"("integrationEventId", "createdAt");

-- AddForeignKey
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_integrationEventId_fkey" FOREIGN KEY ("integrationEventId") REFERENCES "integration_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_integrationEventId_fkey" FOREIGN KEY ("integrationEventId") REFERENCES "integration_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_retriedByUserId_fkey" FOREIGN KEY ("retriedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retry_queue" ADD CONSTRAINT "retry_queue_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retry_queue" ADD CONSTRAINT "retry_queue_integrationEventId_fkey" FOREIGN KEY ("integrationEventId") REFERENCES "integration_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retry_queue" ADD CONSTRAINT "retry_queue_webhookDeliveryId_fkey" FOREIGN KEY ("webhookDeliveryId") REFERENCES "webhook_deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retry_queue" ADD CONSTRAINT "retry_queue_backgroundJobId_fkey" FOREIGN KEY ("backgroundJobId") REFERENCES "background_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
