-- CreateEnum
CREATE TYPE "PcOs" AS ENUM ('WINDOWS', 'LINUX', 'MACOS');

-- CreateTable
CREATE TABLE "user_pc_presets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpuId" TEXT NOT NULL,
    "gpuId" TEXT NOT NULL,
    "memorySize" INTEGER NOT NULL,
    "os" "PcOs" NOT NULL,
    "osVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pc_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpus" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gpus" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gpus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listings" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "emulatorId" TEXT NOT NULL,
    "performanceId" INTEGER NOT NULL,
    "notes" TEXT,
    "authorId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "processedNotes" TEXT,
    "processedByUserId" TEXT,
    "memorySize" INTEGER NOT NULL,
    "cpuId" TEXT NOT NULL,
    "gpuId" TEXT NOT NULL,
    "os" "PcOs" NOT NULL,
    "osVersion" TEXT NOT NULL,

    CONSTRAINT "pc_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listing_custom_field_values" (
    "id" TEXT NOT NULL,
    "pcListingId" TEXT NOT NULL,
    "customFieldDefinitionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pc_listing_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listing_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pcListingId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pc_listing_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listing_developer_verifications" (
    "id" TEXT NOT NULL,
    "pcListingId" TEXT NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "pc_listing_developer_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listing_reports" (
    "id" TEXT NOT NULL,
    "pcListingId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pc_listing_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_pc_presets_userId_idx" ON "user_pc_presets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_pc_presets_userId_name_key" ON "user_pc_presets"("userId", "name");

-- CreateIndex
CREATE INDEX "cpus_brandId_idx" ON "cpus"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "cpus_brandId_modelName_key" ON "cpus"("brandId", "modelName");

-- CreateIndex
CREATE INDEX "gpus_brandId_idx" ON "gpus"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "gpus_brandId_modelName_key" ON "gpus"("brandId", "modelName");

-- CreateIndex
CREATE INDEX "pc_listings_processedByUserId_idx" ON "pc_listings"("processedByUserId");

-- CreateIndex
CREATE INDEX "pc_listings_status_idx" ON "pc_listings"("status");

-- CreateIndex
CREATE INDEX "pc_listings_gameId_idx" ON "pc_listings"("gameId");

-- CreateIndex
CREATE INDEX "pc_listings_emulatorId_idx" ON "pc_listings"("emulatorId");

-- CreateIndex
CREATE INDEX "pc_listings_cpuId_idx" ON "pc_listings"("cpuId");

-- CreateIndex
CREATE INDEX "pc_listings_gpuId_idx" ON "pc_listings"("gpuId");

-- CreateIndex
CREATE INDEX "pc_listings_authorId_idx" ON "pc_listings"("authorId");

-- CreateIndex
CREATE INDEX "pc_listing_custom_field_values_pcListingId_idx" ON "pc_listing_custom_field_values"("pcListingId");

-- CreateIndex
CREATE INDEX "pc_listing_custom_field_values_customFieldDefinitionId_idx" ON "pc_listing_custom_field_values"("customFieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listing_custom_field_values_pcListingId_customFieldDefin_key" ON "pc_listing_custom_field_values"("pcListingId", "customFieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listing_notification_preferences_userId_pcListingId_key" ON "pc_listing_notification_preferences"("userId", "pcListingId");

-- CreateIndex
CREATE INDEX "pc_listing_developer_verifications_pcListingId_idx" ON "pc_listing_developer_verifications"("pcListingId");

-- CreateIndex
CREATE INDEX "pc_listing_developer_verifications_verifiedBy_idx" ON "pc_listing_developer_verifications"("verifiedBy");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listing_developer_verifications_pcListingId_verifiedBy_key" ON "pc_listing_developer_verifications"("pcListingId", "verifiedBy");

-- CreateIndex
CREATE INDEX "pc_listing_reports_pcListingId_idx" ON "pc_listing_reports"("pcListingId");

-- CreateIndex
CREATE INDEX "pc_listing_reports_reportedById_idx" ON "pc_listing_reports"("reportedById");

-- CreateIndex
CREATE INDEX "pc_listing_reports_reviewedById_idx" ON "pc_listing_reports"("reviewedById");

-- CreateIndex
CREATE INDEX "pc_listing_reports_status_idx" ON "pc_listing_reports"("status");

-- CreateIndex
CREATE INDEX "pc_listing_reports_createdAt_idx" ON "pc_listing_reports"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listing_reports_pcListingId_reportedById_key" ON "pc_listing_reports"("pcListingId", "reportedById");

-- AddForeignKey
ALTER TABLE "user_pc_presets" ADD CONSTRAINT "user_pc_presets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pc_presets" ADD CONSTRAINT "user_pc_presets_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "cpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pc_presets" ADD CONSTRAINT "user_pc_presets_gpuId_fkey" FOREIGN KEY ("gpuId") REFERENCES "gpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpus" ADD CONSTRAINT "cpus_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "DeviceBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpus" ADD CONSTRAINT "gpus_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "DeviceBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES "PerformanceScale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_emulatorId_fkey" FOREIGN KEY ("emulatorId") REFERENCES "Emulator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_gpuId_fkey" FOREIGN KEY ("gpuId") REFERENCES "gpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "cpus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_custom_field_values" ADD CONSTRAINT "pc_listing_custom_field_values_pcListingId_fkey" FOREIGN KEY ("pcListingId") REFERENCES "pc_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_custom_field_values" ADD CONSTRAINT "pc_listing_custom_field_values_customFieldDefinitionId_fkey" FOREIGN KEY ("customFieldDefinitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_notification_preferences" ADD CONSTRAINT "pc_listing_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_notification_preferences" ADD CONSTRAINT "pc_listing_notification_preferences_pcListingId_fkey" FOREIGN KEY ("pcListingId") REFERENCES "pc_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_developer_verifications" ADD CONSTRAINT "pc_listing_developer_verifications_pcListingId_fkey" FOREIGN KEY ("pcListingId") REFERENCES "pc_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_developer_verifications" ADD CONSTRAINT "pc_listing_developer_verifications_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_reports" ADD CONSTRAINT "pc_listing_reports_pcListingId_fkey" FOREIGN KEY ("pcListingId") REFERENCES "pc_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_reports" ADD CONSTRAINT "pc_listing_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_reports" ADD CONSTRAINT "pc_listing_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
