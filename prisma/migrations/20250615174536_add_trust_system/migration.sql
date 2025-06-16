-- CreateEnum
CREATE TYPE "trust_action" AS ENUM ('UPVOTE', 'DOWNVOTE', 'LISTING_CREATED', 'LISTING_APPROVED', 'LISTING_REJECTED', 'MONTHLY_ACTIVE_BONUS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "trust_action_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "trust_action" NOT NULL,
    "weight" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trust_action_logs_userId_idx" ON "trust_action_logs"("userId");

-- CreateIndex
CREATE INDEX "trust_action_logs_action_idx" ON "trust_action_logs"("action");

-- CreateIndex
CREATE INDEX "trust_action_logs_createdAt_idx" ON "trust_action_logs"("createdAt");

-- CreateIndex
CREATE INDEX "trust_action_logs_userId_createdAt_idx" ON "trust_action_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "trust_action_logs" ADD CONSTRAINT "trust_action_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
