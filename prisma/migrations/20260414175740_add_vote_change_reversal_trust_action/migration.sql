-- AlterEnum
ALTER TYPE "trust_action" ADD VALUE 'VOTE_CHANGE_REVERSAL';

-- CreateIndex
CREATE INDEX "CommentVote_userId_nullifiedAt_idx" ON "CommentVote"("userId", "nullifiedAt");

-- CreateIndex
CREATE INDEX "Vote_userId_nullifiedAt_idx" ON "Vote"("userId", "nullifiedAt");

-- CreateIndex
CREATE INDEX "pc_listing_comment_votes_userId_nullifiedAt_idx" ON "pc_listing_comment_votes"("userId", "nullifiedAt");

-- CreateIndex
CREATE INDEX "pc_listing_votes_userId_nullifiedAt_idx" ON "pc_listing_votes"("userId", "nullifiedAt");
