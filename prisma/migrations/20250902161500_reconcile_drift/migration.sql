-- Reconcile drift: ensure vote columns and indexes exist, and fix permissions.category type

-- 1) Ensure pc_listings vote columns exist
DO $$
BEGIN
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

-- 2) Ensure indexes on Listing exist
CREATE INDEX IF NOT EXISTS "Listing_successRate_voteCount_idx" ON "Listing" ("successRate" DESC, "voteCount" DESC);
CREATE INDEX IF NOT EXISTS "Listing_voteCount_idx" ON "Listing" ("voteCount" DESC);

-- 3) Ensure indexes on pc_listings exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pc_listings') THEN
    CREATE INDEX IF NOT EXISTS "pc_listings_successRate_voteCount_idx" ON "pc_listings" ("successRate" DESC, "voteCount" DESC);
    CREATE INDEX IF NOT EXISTS "pc_listings_voteCount_idx" ON "pc_listings" ("voteCount" DESC);
  END IF;
END$$;

-- 4) Convert permissions.category to enum if still text
DO $$
DECLARE
  col_type text;
  has_enum boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'permissions' AND column_name = 'category';

    IF col_type = 'text' THEN
      -- Ensure enum exists
      SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'PermissionCategory') INTO has_enum;
      IF NOT has_enum THEN
        EXECUTE 'CREATE TYPE "PermissionCategory" AS ENUM (''CONTENT'', ''MODERATION'', ''USER_MANAGEMENT'', ''SYSTEM'')';
      END IF;

      -- Migrate data via temp column
      ALTER TABLE "permissions" ADD COLUMN "category_new" "PermissionCategory";
      UPDATE "permissions"
      SET "category_new" = CASE
        WHEN "category" = 'CONTENT' THEN 'CONTENT'::"PermissionCategory"
        WHEN "category" = 'MODERATION' THEN 'MODERATION'::"PermissionCategory"
        WHEN "category" = 'USER_MANAGEMENT' THEN 'USER_MANAGEMENT'::"PermissionCategory"
        WHEN "category" = 'SYSTEM' THEN 'SYSTEM'::"PermissionCategory"
        ELSE NULL
      END
      WHERE "category" IS NOT NULL;
      ALTER TABLE "permissions" DROP COLUMN "category";
      ALTER TABLE "permissions" RENAME COLUMN "category_new" TO "category";
    END IF;
  END IF;
END$$;

-- 5) Ensure index on permissions.category exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
    CREATE INDEX IF NOT EXISTS "permissions_category_idx" ON "permissions" ("category");
  END IF;
END$$;
