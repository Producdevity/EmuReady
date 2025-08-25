-- Add vote count columns to Listing table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Listing' AND column_name = 'upvoteCount') THEN
        ALTER TABLE "Listing" ADD COLUMN "upvoteCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Listing' AND column_name = 'downvoteCount') THEN
        ALTER TABLE "Listing" ADD COLUMN "downvoteCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Listing' AND column_name = 'voteCount') THEN
        ALTER TABLE "Listing" ADD COLUMN "voteCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Listing' AND column_name = 'successRate') THEN
        ALTER TABLE "Listing" ADD COLUMN "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
    END IF;
END$$;

-- Add vote count columns to pc_listings table
DO $$ 
BEGIN
    -- Check if pc_listings table exists before trying to alter it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pc_listings') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_listings' AND column_name = 'upvoteCount') THEN
            ALTER TABLE "pc_listings" ADD COLUMN "upvoteCount" INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_listings' AND column_name = 'downvoteCount') THEN
            ALTER TABLE "pc_listings" ADD COLUMN "downvoteCount" INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_listings' AND column_name = 'voteCount') THEN
            ALTER TABLE "pc_listings" ADD COLUMN "voteCount" INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_listings' AND column_name = 'successRate') THEN
            ALTER TABLE "pc_listings" ADD COLUMN "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
        END IF;
    END IF;
END$$;

-- Add indexes for Listing
CREATE INDEX IF NOT EXISTS "Listing_successRate_voteCount_idx" ON "Listing"("successRate" DESC, "voteCount" DESC);
CREATE INDEX IF NOT EXISTS "Listing_voteCount_idx" ON "Listing"("voteCount" DESC);

-- Add indexes for pc_listings
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pc_listings') THEN
        CREATE INDEX IF NOT EXISTS "pc_listings_successRate_voteCount_idx" ON "pc_listings"("successRate" DESC, "voteCount" DESC);
        CREATE INDEX IF NOT EXISTS "pc_listings_voteCount_idx" ON "pc_listings"("voteCount" DESC);
    END IF;
END$$;
