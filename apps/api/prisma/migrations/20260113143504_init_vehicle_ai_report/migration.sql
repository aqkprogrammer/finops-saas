-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_ai_reports" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "trustScore" INTEGER,
    "exteriorScore" INTEGER,
    "engineScore" INTEGER,
    "interiorScore" INTEGER,
    "transmissionScore" INTEGER,
    "highlightsJson" JSONB,
    "issuesJson" JSONB,
    "aiModelVersion" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_ai_reports_vehicleId_idx" ON "vehicle_ai_reports"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_ai_reports_vehicleId_key" ON "vehicle_ai_reports"("vehicleId");

-- AddForeignKey
ALTER TABLE "vehicle_ai_reports" ADD CONSTRAINT "vehicle_ai_reports_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
