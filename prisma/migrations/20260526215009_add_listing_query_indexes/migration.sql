-- CreateIndex
CREATE INDEX "Listing_status_createdAt_deviceId_idx" ON "Listing"("status", "createdAt", "deviceId");

-- CreateIndex
CREATE INDEX "Listing_deviceId_status_createdAt_idx" ON "Listing"("deviceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_gameId_status_createdAt_idx" ON "Listing"("gameId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_emulatorId_status_createdAt_idx" ON "Listing"("emulatorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Listing_authorId_status_createdAt_idx" ON "Listing"("authorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "pc_listings_status_createdAt_cpuId_idx" ON "pc_listings"("status", "createdAt", "cpuId");

-- CreateIndex
CREATE INDEX "pc_listings_cpuId_status_createdAt_idx" ON "pc_listings"("cpuId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "pc_listings_gpuId_status_createdAt_idx" ON "pc_listings"("gpuId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "pc_listings_gameId_status_createdAt_idx" ON "pc_listings"("gameId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "pc_listings_emulatorId_status_createdAt_idx" ON "pc_listings"("emulatorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "pc_listings_authorId_status_createdAt_idx" ON "pc_listings"("authorId", "status", "createdAt");
