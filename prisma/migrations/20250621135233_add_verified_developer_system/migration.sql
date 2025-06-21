-- CreateTable
CREATE TABLE "verified_developers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emulatorId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "verified_developers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_developer_verifications" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "listing_developer_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verified_developers_userId_idx" ON "verified_developers"("userId");

-- CreateIndex
CREATE INDEX "verified_developers_emulatorId_idx" ON "verified_developers"("emulatorId");

-- CreateIndex
CREATE UNIQUE INDEX "verified_developers_userId_emulatorId_key" ON "verified_developers"("userId", "emulatorId");

-- CreateIndex
CREATE INDEX "listing_developer_verifications_listingId_idx" ON "listing_developer_verifications"("listingId");

-- CreateIndex
CREATE INDEX "listing_developer_verifications_verifiedBy_idx" ON "listing_developer_verifications"("verifiedBy");

-- CreateIndex
CREATE UNIQUE INDEX "listing_developer_verifications_listingId_verifiedBy_key" ON "listing_developer_verifications"("listingId", "verifiedBy");

-- AddForeignKey
ALTER TABLE "verified_developers" ADD CONSTRAINT "verified_developers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verified_developers" ADD CONSTRAINT "verified_developers_emulatorId_fkey" FOREIGN KEY ("emulatorId") REFERENCES "Emulator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verified_developers" ADD CONSTRAINT "verified_developers_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_developer_verifications" ADD CONSTRAINT "listing_developer_verifications_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_developer_verifications" ADD CONSTRAINT "listing_developer_verifications_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
