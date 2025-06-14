-- AlterTable
ALTER TABLE "CustomFieldDefinition" ADD COLUMN     "defaultValue" JSONB;

-- AlterTable
ALTER TABLE "CustomFieldTemplateField" ADD COLUMN     "defaultValue" JSONB;
