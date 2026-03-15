-- AlterTable
ALTER TABLE "user_bans" ADD COLUMN     "votesNullified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CommentVote_userId_idx" ON "CommentVote"("userId");
