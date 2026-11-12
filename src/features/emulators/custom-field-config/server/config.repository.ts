import { TRPCError } from '@trpc/server'
import { AppError, ResourceError } from '@/lib/errors'
import {
  PrismaRepository,
  type PrismaRepositoryClient,
} from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { CustomFieldType, Prisma } from '@orm/client'
import { CONFIG_EMULATOR_SELECT } from './persistence/config.prisma'
import { type ConfigField, type CustomFieldConfig } from '../shared/config.schemas'

export class CustomFieldConfigRepository extends PrismaRepository {
  constructor(prisma: PrismaRepositoryClient) {
    super(prisma)
  }

  getEmulator(emulatorId: string) {
    return this.prisma.emulator.findUnique({
      where: { id: emulatorId },
      select: CONFIG_EMULATOR_SELECT,
    })
  }

  sources() {
    return this.prisma.emulator.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }

  async transaction<T>(
    operation: (repository: CustomFieldConfigRepository) => Promise<T>,
  ): Promise<T> {
    if (!('$transaction' in this.prisma)) return operation(this)
    try {
      return await this.prisma.$transaction(
        (tx) => operation(new CustomFieldConfigRepository(tx)),
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 30_000,
        },
      )
    } catch (error) {
      if (error instanceof TRPCError) throw error
      if (
        isPrismaError(error, PRISMA_ERROR_CODES.TRANSACTION_FAILED) ||
        isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)
      ) {
        return AppError.conflict('The configuration changed while saving. Reload it and try again.')
      }
      if (isPrismaError(error, PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION)) {
        return ResourceError.emulator.notFound()
      }
      return AppError.databaseError('apply custom field configuration')
    }
  }

  saveCategory(emulatorId: string, category: CustomFieldConfig['categories'][number]) {
    return this.prisma.customFieldCategory.upsert({
      where: { emulatorId_name: { emulatorId, name: category.name } },
      create: { emulatorId, ...category },
      update: { displayOrder: category.displayOrder },
      select: { id: true },
    })
  }

  saveField(emulatorId: string, field: ConfigField, categoryId: string | null) {
    const data = {
      label: field.label,
      type: field.type,
      categoryId,
      options: field.type === CustomFieldType.SELECT ? field.options : Prisma.DbNull,
      defaultValue: field.defaultValue === null ? Prisma.DbNull : field.defaultValue,
      placeholder: field.placeholder,
      rangeMin: field.rangeMin,
      rangeMax: field.rangeMax,
      rangeUnit: field.rangeUnit,
      rangeDecimals: field.rangeDecimals,
      isRequired: field.isRequired,
      displayOrder: field.displayOrder,
      categoryOrder: field.categoryOrder,
    } satisfies Prisma.CustomFieldDefinitionUncheckedUpdateInput

    return this.prisma.customFieldDefinition.upsert({
      where: { emulatorId_name: { emulatorId, name: field.name } },
      create: { emulatorId, name: field.name, ...data },
      update: data,
      select: { id: true },
    })
  }
}
