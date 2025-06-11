-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultToUserDevices" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyOnNewListings" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserDevicePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDevicePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDevicePreference_userId_idx" ON "UserDevicePreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevicePreference_userId_deviceId_key" ON "UserDevicePreference"("userId", "deviceId");

-- AddForeignKey
ALTER TABLE "UserDevicePreference" ADD CONSTRAINT "UserDevicePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevicePreference" ADD CONSTRAINT "UserDevicePreference_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
