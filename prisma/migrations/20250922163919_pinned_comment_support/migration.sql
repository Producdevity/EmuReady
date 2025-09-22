/*
  Warnings:

  - A unique constraint covering the columns `[pinnedCommentId]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pinnedCommentId]` on the table `pc_listings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."audit_action" ADD VALUE 'PIN';
ALTER TYPE "public"."audit_action" ADD VALUE 'UNPIN';

-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "pinnedAt" TIMESTAMP(3),
ADD COLUMN     "pinnedByUserId" TEXT,
ADD COLUMN     "pinnedCommentId" TEXT;

-- AlterTable
ALTER TABLE "public"."pc_listings" ADD COLUMN     "pinnedAt" TIMESTAMP(3),
ADD COLUMN     "pinnedByUserId" TEXT,
ADD COLUMN     "pinnedCommentId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_listingId_idx" ON "public"."Comment"("listingId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "public"."Comment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_pinnedCommentId_key" ON "public"."Listing"("pinnedCommentId");

-- CreateIndex
CREATE INDEX "Listing_pinnedCommentId_idx" ON "public"."Listing"("pinnedCommentId");

-- CreateIndex
CREATE INDEX "Listing_pinnedByUserId_idx" ON "public"."Listing"("pinnedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listings_pinnedCommentId_key" ON "public"."pc_listings"("pinnedCommentId");

-- CreateIndex
CREATE INDEX "pc_listings_pinnedCommentId_idx" ON "public"."pc_listings"("pinnedCommentId");

-- CreateIndex
CREATE INDEX "pc_listings_pinnedByUserId_idx" ON "public"."pc_listings"("pinnedByUserId");

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_pinnedCommentId_fkey" FOREIGN KEY ("pinnedCommentId") REFERENCES "public"."Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Listing" ADD CONSTRAINT "Listing_pinnedByUserId_fkey" FOREIGN KEY ("pinnedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pc_listings" ADD CONSTRAINT "pc_listings_pinnedCommentId_fkey" FOREIGN KEY ("pinnedCommentId") REFERENCES "public"."pc_listing_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pc_listings" ADD CONSTRAINT "pc_listings_pinnedByUserId_fkey" FOREIGN KEY ("pinnedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
