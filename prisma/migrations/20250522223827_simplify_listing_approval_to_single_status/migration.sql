/*
  Warnings:

  - You are about to drop the `ListingApproval` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommentVote" DROP CONSTRAINT "CommentVote_commentId_fkey";

-- DropForeignKey
ALTER TABLE "CommentVote" DROP CONSTRAINT "CommentVote_userId_fkey";

-- DropForeignKey
ALTER TABLE "ListingApproval" DROP CONSTRAINT "ListingApproval_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "ListingApproval" DROP CONSTRAINT "ListingApproval_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processedByUserId" TEXT,
ADD COLUMN     "processedNotes" TEXT,
ADD COLUMN     "status" "ListingApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "ListingApproval";

-- CreateIndex
CREATE INDEX "Listing_processedByUserId_idx" ON "Listing"("processedByUserId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
