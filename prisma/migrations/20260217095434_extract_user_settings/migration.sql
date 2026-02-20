-- CreateTable: user_settings (1:1 with User)
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "defaultToUserDevices" BOOLEAN NOT NULL DEFAULT false,
    "defaultToUserSocs" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnNewListings" BOOLEAN NOT NULL DEFAULT true,
    "showNsfw" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedDeviceId" TEXT,
    "profilePublic" BOOLEAN NOT NULL DEFAULT true,
    "showActivityInFeed" BOOLEAN NOT NULL DEFAULT true,
    "showVotingActivity" BOOLEAN NOT NULL DEFAULT true,
    "allowFollows" BOOLEAN NOT NULL DEFAULT true,
    "allowFriendRequests" BOOLEAN NOT NULL DEFAULT true,
    "followersVisible" BOOLEAN NOT NULL DEFAULT true,
    "followingVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- Backfill: Copy existing preference values from User table
-- Privacy fields (profilePublic, etc.) get their DEFAULT values since they never existed in production
INSERT INTO "user_settings" (
    "id", "userId",
    "defaultToUserDevices", "defaultToUserSocs",
    "notifyOnNewListings", "showNsfw", "lastUsedDeviceId",
    "createdAt", "updatedAt"
)
SELECT
    gen_random_uuid(), "id",
    "defaultToUserDevices", "defaultToUserSocs",
    "notifyOnNewListings", "showNsfw", "lastUsedDeviceId",
    NOW(), NOW()
FROM "User";

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
