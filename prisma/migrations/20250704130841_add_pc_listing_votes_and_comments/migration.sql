-- CreateTable
CREATE TABLE "pc_listing_votes" (
    "id" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "pcListingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pc_listing_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listing_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pcListingId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pc_listing_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pc_listing_comment_votes" (
    "id" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pc_listing_comment_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pc_listing_votes_pcListingId_idx" ON "pc_listing_votes"("pcListingId");

-- CreateIndex
CREATE INDEX "pc_listing_votes_userId_idx" ON "pc_listing_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listing_votes_userId_pcListingId_key" ON "pc_listing_votes"("userId", "pcListingId");

-- CreateIndex
CREATE INDEX "pc_listing_comments_pcListingId_idx" ON "pc_listing_comments"("pcListingId");

-- CreateIndex
CREATE INDEX "pc_listing_comments_userId_idx" ON "pc_listing_comments"("userId");

-- CreateIndex
CREATE INDEX "pc_listing_comments_parentId_idx" ON "pc_listing_comments"("parentId");

-- CreateIndex
CREATE INDEX "pc_listing_comments_createdAt_idx" ON "pc_listing_comments"("createdAt");

-- CreateIndex
CREATE INDEX "pc_listing_comment_votes_commentId_idx" ON "pc_listing_comment_votes"("commentId");

-- CreateIndex
CREATE INDEX "pc_listing_comment_votes_userId_idx" ON "pc_listing_comment_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pc_listing_comment_votes_userId_commentId_key" ON "pc_listing_comment_votes"("userId", "commentId");

-- AddForeignKey
ALTER TABLE "pc_listing_votes" ADD CONSTRAINT "pc_listing_votes_pcListingId_fkey" FOREIGN KEY ("pcListingId") REFERENCES "pc_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_votes" ADD CONSTRAINT "pc_listing_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_comments" ADD CONSTRAINT "pc_listing_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "pc_listing_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_comments" ADD CONSTRAINT "pc_listing_comments_pcListingId_fkey" FOREIGN KEY ("pcListingId") REFERENCES "pc_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_comments" ADD CONSTRAINT "pc_listing_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_comment_votes" ADD CONSTRAINT "pc_listing_comment_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listing_comment_votes" ADD CONSTRAINT "pc_listing_comment_votes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "pc_listing_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
