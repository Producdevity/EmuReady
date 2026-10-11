-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_authorId_fkey";

-- DropForeignKey
ALTER TABLE "badges" DROP CONSTRAINT "badges_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "pc_listings" DROP CONSTRAINT "pc_listings_authorId_fkey";

-- DropForeignKey
ALTER TABLE "user_badges" DROP CONSTRAINT "user_badges_assignedBy_fkey";

-- DropForeignKey
ALTER TABLE "user_bans" DROP CONSTRAINT "user_bans_bannedById_fkey";

-- DropForeignKey
ALTER TABLE "verified_developers" DROP CONSTRAINT "verified_developers_verifiedBy_fkey";

-- AlterTable
ALTER TABLE "Listing" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "badges" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pc_listings" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_badges" ALTER COLUMN "assignedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_bans" ALTER COLUMN "bannedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "verified_developers" ALTER COLUMN "verifiedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verified_developers" ADD CONSTRAINT "verified_developers_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
