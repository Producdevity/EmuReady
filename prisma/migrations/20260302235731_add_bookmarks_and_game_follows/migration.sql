-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_type" ADD VALUE 'FOLLOWED_GAME_NEW_LISTING';
ALTER TYPE "notification_type" ADD VALUE 'FOLLOWED_GAME_NEW_PC_LISTING';

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "bookmarksVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "followedGamesVisible" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "listing_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listing_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pcListingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pc_listing_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_follows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_bookmarks_userId_idx" ON "listing_bookmarks"("userId");

-- CreateIndex
CREATE INDEX "listing_bookmarks_listingId_idx" ON "listing_bookmarks"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_bookmarks_userId_listingId_key" ON "listing_bookmarks"("userId", "listingId");

-- CreateIndex
CREATE INDEX "pc_listing_bookmarks_userId_idx" ON "pc_listing_bookmarks"("userId");

-- CreateIndex
CREATE INDEX "pc_listing_bookmarks_pcListingId_idx" ON "pc_listing_bookmarks"("pcListingId");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listing_bookmarks_userId_pcListingId_key" ON "pc_listing_bookmarks"("userId", "pcListingId");

-- CreateIndex
CREATE INDEX "game_follows_userId_idx" ON "game_follows"("userId");

-- CreateIndex
CREATE INDEX "game_follows_gameId_idx" ON "game_follows"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "game_follows_userId_gameId_key" ON "game_follows"("userId", "gameId");

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_bookmarks" ADD CONSTRAINT "listing_bookmarks_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_bookmarks" ADD CONSTRAINT "pc_listing_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_bookmarks" ADD CONSTRAINT "pc_listing_bookmarks_pcListingId_fkey" FOREIGN KEY ("pcListingId") REFERENCES "pc_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_follows" ADD CONSTRAINT "game_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_follows" ADD CONSTRAINT "game_follows_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
