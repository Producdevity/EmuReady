-- AlterTable: Convert category from text to PermissionCategory enum
-- This migration safely converts existing string values to the enum type
-- It checks if the table exists to handle CI environments with fresh databases

DO $$
BEGIN
  -- Check if permissions table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'permissions') THEN
    -- Check if category column exists and is text type (not already converted)
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      AND column_name = 'category'
      AND data_type = 'text'
    ) THEN
      -- Step 1: Create a temporary column with the enum type
      ALTER TABLE "permissions" ADD COLUMN "category_new" "PermissionCategory";
      
      -- Step 2: Copy and convert existing data
      UPDATE "permissions" 
      SET "category_new" = 
        CASE 
          WHEN "category" = 'CONTENT' THEN 'CONTENT'::"PermissionCategory"
          WHEN "category" = 'MODERATION' THEN 'MODERATION'::"PermissionCategory"
          WHEN "category" = 'USER_MANAGEMENT' THEN 'USER_MANAGEMENT'::"PermissionCategory"
          WHEN "category" = 'SYSTEM' THEN 'SYSTEM'::"PermissionCategory"
          ELSE NULL
        END
      WHERE "category" IS NOT NULL;
      
      -- Step 3: Drop the old column
      ALTER TABLE "permissions" DROP COLUMN "category";
      
      -- Step 4: Rename the new column to the original name
      ALTER TABLE "permissions" RENAME COLUMN "category_new" TO "category";
    END IF;
  END IF;
END $$;