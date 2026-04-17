-- CreateTable
CREATE TABLE "client_favorites" (
    "id" UUID NOT NULL,
    "clientUserId" UUID NOT NULL,
    "businessProfileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_dashboard_views" (
    "id" UUID NOT NULL,
    "clientUserId" UUID NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "favoritesCount" INTEGER NOT NULL DEFAULT 0,
    "historyCount" INTEGER NOT NULL DEFAULT 0,
    "pendingReviewsCount" INTEGER NOT NULL DEFAULT 0,
    "openReportsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_dashboard_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_favorites_clientUserId_createdAt_idx" ON "client_favorites"("clientUserId", "createdAt");

-- CreateIndex
CREATE INDEX "client_favorites_businessProfileId_idx" ON "client_favorites"("businessProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "client_favorites_clientUserId_businessProfileId_key" ON "client_favorites"("clientUserId", "businessProfileId");

-- CreateIndex
CREATE INDEX "client_dashboard_views_clientUserId_snapshotDate_idx" ON "client_dashboard_views"("clientUserId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "client_dashboard_views_clientUserId_snapshotDate_key" ON "client_dashboard_views"("clientUserId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "client_favorites" ADD CONSTRAINT "client_favorites_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_favorites" ADD CONSTRAINT "client_favorites_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_dashboard_views" ADD CONSTRAINT "client_dashboard_views_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
