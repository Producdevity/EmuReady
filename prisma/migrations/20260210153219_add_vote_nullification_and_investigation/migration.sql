-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "audit_action" ADD VALUE 'NULLIFY_VOTES';
ALTER TYPE "audit_action" ADD VALUE 'RESTORE_VOTES';

-- AlterEnum
ALTER TYPE "audit_entity_type" ADD VALUE 'VOTE';

-- AlterEnum
ALTER TYPE "trust_action" ADD VALUE 'VOTE_NULLIFICATION_REVERSAL';

-- AlterTable
ALTER TABLE "CommentVote" ADD COLUMN     "nullifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nullifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pc_listing_comment_votes" ADD COLUMN     "nullifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pc_listing_votes" ADD COLUMN     "nullifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- CreateIndex
CREATE INDEX "Vote_listingId_idx" ON "Vote"("listingId");
