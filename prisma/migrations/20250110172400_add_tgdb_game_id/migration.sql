-- Add tgdbGameId column to Game table
ALTER TABLE "Game" ADD COLUMN "tgdbGameId" INTEGER;

-- Create index for faster lookups
CREATE INDEX "Game_tgdbGameId_idx" ON "Game"("tgdbGameId"); 