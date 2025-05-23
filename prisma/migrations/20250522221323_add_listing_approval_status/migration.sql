/*
  Warnings:

  - The `status` column on the `ListingApproval` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ListingApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "approvalStatus" "ListingApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ListingApproval" DROP COLUMN "status",
ADD COLUMN     "status" "ListingApprovalStatus" NOT NULL DEFAULT 'PENDING';
