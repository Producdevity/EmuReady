-- CreateEnum
CREATE TYPE "GameApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "GameApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedBy" TEXT;

-- CreateTable
CREATE TABLE "CustomFieldTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldTemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldTemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldTemplate_name_key" ON "CustomFieldTemplate"("name");

-- CreateIndex
CREATE INDEX "CustomFieldTemplateField_templateId_idx" ON "CustomFieldTemplateField"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldTemplateField_templateId_name_key" ON "CustomFieldTemplateField"("templateId", "name");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_submittedBy_idx" ON "Game"("submittedBy");

-- CreateIndex
CREATE INDEX "Game_submittedAt_idx" ON "Game"("submittedAt");

-- CreateIndex
CREATE INDEX "Game_status_submittedAt_idx" ON "Game"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Game_systemId_status_idx" ON "Game"("systemId", "status");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldTemplateField" ADD CONSTRAINT "CustomFieldTemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CustomFieldTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
