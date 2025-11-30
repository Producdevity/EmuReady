-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "normalizedTitle" TEXT;

-- CreateIndex
CREATE INDEX "Game_normalizedTitle_idx" ON "Game"("normalizedTitle");
