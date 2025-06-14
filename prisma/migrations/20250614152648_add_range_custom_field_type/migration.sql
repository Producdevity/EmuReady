-- AlterEnum
ALTER TYPE "CustomFieldType" ADD VALUE 'RANGE';

-- AlterTable
ALTER TABLE "CustomFieldDefinition" ADD COLUMN     "placeholder" TEXT,
ADD COLUMN     "rangeDecimals" INTEGER,
ADD COLUMN     "rangeMax" DOUBLE PRECISION,
ADD COLUMN     "rangeMin" DOUBLE PRECISION,
ADD COLUMN     "rangeUnit" TEXT;

-- AlterTable
ALTER TABLE "CustomFieldTemplateField" ADD COLUMN     "placeholder" TEXT,
ADD COLUMN     "rangeDecimals" INTEGER,
ADD COLUMN     "rangeMax" DOUBLE PRECISION,
ADD COLUMN     "rangeMin" DOUBLE PRECISION,
ADD COLUMN     "rangeUnit" TEXT;
