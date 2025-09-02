-- Normalize index definitions to match Prisma schema expectations (no explicit DESC)

-- Listing indexes
DROP INDEX IF EXISTS "Listing_successRate_voteCount_idx";
CREATE INDEX "Listing_successRate_voteCount_idx" ON "Listing" ("successRate", "voteCount");

DROP INDEX IF EXISTS "Listing_voteCount_idx";
CREATE INDEX "Listing_voteCount_idx" ON "Listing" ("voteCount");

-- pc_listings indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pc_listings') THEN
    DROP INDEX IF EXISTS "pc_listings_successRate_voteCount_idx";
    CREATE INDEX "pc_listings_successRate_voteCount_idx" ON "pc_listings" ("successRate", "voteCount");

    DROP INDEX IF EXISTS "pc_listings_voteCount_idx";
    CREATE INDEX "pc_listings_voteCount_idx" ON "pc_listings" ("voteCount");
  END IF;
END$$;

