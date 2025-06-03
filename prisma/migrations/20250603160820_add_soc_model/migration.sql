-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "socId" TEXT;

-- CreateTable
CREATE TABLE "SoC" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "architecture" TEXT,
    "processNode" TEXT,
    "cpuCores" INTEGER,
    "gpuModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoC_name_key" ON "SoC"("name");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_socId_fkey" FOREIGN KEY ("socId") REFERENCES "SoC"("id") ON DELETE SET NULL ON UPDATE CASCADE;
