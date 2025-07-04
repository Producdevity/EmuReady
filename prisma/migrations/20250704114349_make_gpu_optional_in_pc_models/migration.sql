-- DropForeignKey
ALTER TABLE "pc_listings" DROP CONSTRAINT "pc_listings_gpuId_fkey";

-- DropForeignKey
ALTER TABLE "user_pc_presets" DROP CONSTRAINT "user_pc_presets_gpuId_fkey";

-- AlterTable
ALTER TABLE "pc_listings" ALTER COLUMN "gpuId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_pc_presets" ALTER COLUMN "gpuId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user_pc_presets" ADD CONSTRAINT "user_pc_presets_gpuId_fkey" FOREIGN KEY ("gpuId") REFERENCES "gpus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_listings" ADD CONSTRAINT "pc_listings_gpuId_fkey" FOREIGN KEY ("gpuId") REFERENCES "gpus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
