-- AlterTable
ALTER TABLE "CustomFieldDefinition" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "categoryOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CustomFieldTemplateField" ADD COLUMN     "categoryName" TEXT,
ADD COLUMN     "categoryOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CustomFieldCategory" (
    "id" TEXT NOT NULL,
    "emulatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomFieldCategory_emulatorId_idx" ON "CustomFieldCategory"("emulatorId");

-- CreateIndex
CREATE INDEX "CustomFieldCategory_emulatorId_displayOrder_idx" ON "CustomFieldCategory"("emulatorId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldCategory_emulatorId_name_key" ON "CustomFieldCategory"("emulatorId", "name");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_categoryId_idx" ON "CustomFieldDefinition"("categoryId");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_emulatorId_categoryId_categoryOrder_idx" ON "CustomFieldDefinition"("emulatorId", "categoryId", "categoryOrder");

-- AddForeignKey
ALTER TABLE "CustomFieldCategory" ADD CONSTRAINT "CustomFieldCategory_emulatorId_fkey" FOREIGN KEY ("emulatorId") REFERENCES "Emulator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CustomFieldCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
