-- Create the new unified ApprovalStatus enum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- For Game table: Migrate from GameApprovalStatus to ApprovalStatus
-- Add new column with ApprovalStatus type
ALTER TABLE "Game" ADD COLUMN "status_new" "ApprovalStatus";

-- Copy data from old column to new column
UPDATE "Game" SET "status_new" = 
  CASE 
    WHEN "status" = 'PENDING' THEN 'PENDING'::"ApprovalStatus"
    WHEN "status" = 'APPROVED' THEN 'APPROVED'::"ApprovalStatus"
    WHEN "status" = 'REJECTED' THEN 'REJECTED'::"ApprovalStatus"
  END;

-- Set NOT NULL constraint and default
UPDATE "Game" SET "status_new" = 'APPROVED'::"ApprovalStatus" WHERE "status_new" IS NULL;
ALTER TABLE "Game" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Game" ALTER COLUMN "status_new" SET DEFAULT 'APPROVED'::"ApprovalStatus";

-- Drop old column and rename new column
ALTER TABLE "Game" DROP COLUMN "status";
ALTER TABLE "Game" RENAME COLUMN "status_new" TO "status";

-- For Listing table: Migrate from ListingApprovalStatus to ApprovalStatus  
-- Add new column with ApprovalStatus type
ALTER TABLE "Listing" ADD COLUMN "status_new" "ApprovalStatus";

-- Copy data from old column to new column
UPDATE "Listing" SET "status_new" = 
  CASE 
    WHEN "status" = 'PENDING' THEN 'PENDING'::"ApprovalStatus"
    WHEN "status" = 'APPROVED' THEN 'APPROVED'::"ApprovalStatus"
    WHEN "status" = 'REJECTED' THEN 'REJECTED'::"ApprovalStatus"
  END;

-- Set NOT NULL constraint and default
UPDATE "Listing" SET "status_new" = 'PENDING'::"ApprovalStatus" WHERE "status_new" IS NULL;
ALTER TABLE "Listing" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Listing" ALTER COLUMN "status_new" SET DEFAULT 'PENDING'::"ApprovalStatus";

-- Drop old column and rename new column
ALTER TABLE "Listing" DROP COLUMN "status";
ALTER TABLE "Listing" RENAME COLUMN "status_new" TO "status";

-- Drop the old enum types
DROP TYPE "GameApprovalStatus";
DROP TYPE "ListingApprovalStatus";

-- Recreate indexes that were on the status columns
CREATE INDEX "Game_status_idx" ON "Game"("status");
CREATE INDEX "Game_status_submittedAt_idx" ON "Game"("status", "submittedAt");
CREATE INDEX "Game_systemId_status_idx" ON "Game"("systemId", "status"); 