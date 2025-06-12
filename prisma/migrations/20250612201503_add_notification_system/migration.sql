/*
  Warnings:

  - You are about to drop the `UserSocPreference` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('LISTING_COMMENT', 'LISTING_VOTE_UP', 'LISTING_VOTE_DOWN', 'COMMENT_REPLY', 'USER_MENTION', 'NEW_DEVICE_LISTING', 'NEW_SOC_LISTING', 'GAME_ADDED', 'EMULATOR_UPDATED', 'MAINTENANCE_NOTICE', 'FEATURE_ANNOUNCEMENT', 'POLICY_UPDATE', 'LISTING_APPROVED', 'LISTING_REJECTED', 'CONTENT_FLAGGED', 'ACCOUNT_WARNING');

-- CreateEnum
CREATE TYPE "notification_category" AS ENUM ('ENGAGEMENT', 'CONTENT', 'SYSTEM', 'MODERATION');

-- CreateEnum
CREATE TYPE "delivery_channel" AS ENUM ('IN_APP', 'EMAIL', 'BOTH');

-- CreateEnum
CREATE TYPE "notification_delivery_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- DropForeignKey
ALTER TABLE "UserSocPreference" DROP CONSTRAINT "UserSocPreference_socId_fkey";

-- DropForeignKey
ALTER TABLE "UserSocPreference" DROP CONSTRAINT "UserSocPreference_userId_fkey";

-- DropTable
DROP TABLE "UserSocPreference";

-- CreateTable
CREATE TABLE "user_soc_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_soc_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "category" "notification_category" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "deliveryChannel" "delivery_channel" NOT NULL DEFAULT 'IN_APP',
    "deliveryStatus" "notification_delivery_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "payload" JSONB,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_soc_preferences_userId_socId_key" ON "user_soc_preferences"("userId", "socId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_createdAt_idx" ON "notifications"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_type_key" ON "notification_preferences"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "listing_notification_preferences_userId_listingId_key" ON "listing_notification_preferences"("userId", "listingId");

-- CreateIndex
CREATE INDEX "notification_events_eventType_createdAt_idx" ON "notification_events"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "notification_events_entityType_entityId_idx" ON "notification_events"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "user_soc_preferences" ADD CONSTRAINT "user_soc_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_soc_preferences" ADD CONSTRAINT "user_soc_preferences_socId_fkey" FOREIGN KEY ("socId") REFERENCES "SoC"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_notification_preferences" ADD CONSTRAINT "listing_notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_notification_preferences" ADD CONSTRAINT "listing_notification_preferences_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
