-- CreateTable
CREATE TABLE "scans" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "customerId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL,
    "costSummary" JSONB NOT NULL,
    "resourceInventory" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "savings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scans_scanId_key" ON "scans"("scanId");

-- CreateIndex
CREATE INDEX "scans_scanId_idx" ON "scans"("scanId");

-- CreateIndex
CREATE INDEX "scans_customerId_idx" ON "scans"("customerId");

-- CreateIndex
CREATE INDEX "scans_timestamp_idx" ON "scans"("timestamp");
