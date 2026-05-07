-- CreateEnum
CREATE TYPE "PlatformScope" AS ENUM ('DESKTOP', 'MOBILE', 'UNIVERSAL');

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "defaultPlatformId" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "platformId" TEXT;

-- AlterTable
ALTER TABLE "user_pc_presets" ADD COLUMN     "platformId" TEXT,
ALTER COLUMN "os" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pc_listings" ADD COLUMN     "platformId" TEXT,
ALTER COLUMN "os" DROP NOT NULL;

-- CreateTable
CREATE TABLE "platforms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "scope" "PlatformScope" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emulator_platforms" (
    "id" TEXT NOT NULL,
    "emulatorId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emulator_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_platforms" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platforms_name_key" ON "platforms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "platforms_slug_key" ON "platforms"("slug");

-- CreateIndex
CREATE INDEX "platforms_scope_idx" ON "platforms"("scope");

-- CreateIndex
CREATE INDEX "emulator_platforms_platformId_idx" ON "emulator_platforms"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "emulator_platforms_emulatorId_platformId_key" ON "emulator_platforms"("emulatorId", "platformId");

-- CreateIndex
CREATE INDEX "device_platforms_platformId_idx" ON "device_platforms"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "device_platforms_deviceId_platformId_key" ON "device_platforms"("deviceId", "platformId");

-- CreateIndex
CREATE INDEX "Device_defaultPlatformId_idx" ON "Device"("defaultPlatformId");

-- CreateIndex
CREATE INDEX "Listing_platformId_idx" ON "Listing"("platformId");

-- CreateIndex
CREATE INDEX "user_pc_presets_platformId_idx" ON "user_pc_presets"("platformId");

-- CreateIndex
CREATE INDEX "pc_listings_platformId_idx" ON "pc_listings"("platformId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_defaultPlatformId_fkey" FOREIGN KEY ("defaultPlatformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emulator_platforms" ADD CONSTRAINT "emulator_platforms_emulatorId_fkey" FOREIGN KEY ("emulatorId") REFERENCES "Emulator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emulator_platforms" ADD CONSTRAINT "emulator_platforms_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_platforms" ADD CONSTRAINT "device_platforms_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_platforms" ADD CONSTRAINT "device_platforms_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pc_presets" ADD CONSTRAINT "user_pc_presets_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
