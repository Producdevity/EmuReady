-- CreateEnum
CREATE TYPE "relationship_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "relationship_type" AS ENUM ('FRIEND');

-- AlterEnum
ALTER TYPE "notification_category" ADD VALUE 'SOCIAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_type" ADD VALUE 'NEW_FOLLOWER';
ALTER TYPE "notification_type" ADD VALUE 'FRIEND_REQUEST_RECEIVED';
ALTER TYPE "notification_type" ADD VALUE 'FRIEND_REQUEST_ACCEPTED';
ALTER TYPE "notification_type" ADD VALUE 'FOLLOWED_USER_NEW_LISTING';
ALTER TYPE "notification_type" ADD VALUE 'FOLLOWED_USER_NEW_PC_LISTING';

-- CreateTable
CREATE TABLE "user_follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_relationships" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "type" "relationship_type" NOT NULL DEFAULT 'FRIEND',
    "status" "relationship_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_follows_followerId_idx" ON "user_follows"("followerId");

-- CreateIndex
CREATE INDEX "user_follows_followingId_idx" ON "user_follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_followerId_followingId_key" ON "user_follows"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "user_relationships_senderId_idx" ON "user_relationships"("senderId");

-- CreateIndex
CREATE INDEX "user_relationships_receiverId_idx" ON "user_relationships"("receiverId");

-- CreateIndex
CREATE INDEX "user_relationships_status_idx" ON "user_relationships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationships_senderId_receiverId_type_key" ON "user_relationships"("senderId", "receiverId", "type");

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
