import { randomUUID } from 'node:crypto'
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
      if (isPrismaError(error, PRISMA_ERROR_CODES.TRANSACTION_FAILED)) {
        return AppError.conflict('The configuration changed while saving. Reload it and try again.')
      }
      if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
        return AppError.badRequest('A field or category name conflicts with another existing item.')
      }
      if (isPrismaError(error, PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION)) {
        return ResourceError.emulator.notFound()
      }
      return AppError.databaseError('apply custom field configuration')
    }
  }

  async stageRenames(emulatorId: string, categoryIds: string[], fieldIds: string[]) {
    for (const id of categoryIds) {
      await this.prisma.customFieldCategory.update({
        where: { id, emulatorId },
        data: { name: `__config_${randomUUID()}` },
        select: { id: true },
      })
    }
    for (const id of fieldIds) {
      await this.prisma.customFieldDefinition.update({
        where: { id, emulatorId },
        data: { name: `__config_${randomUUID()}` },
        select: { id: true },
      })
    }
  }

  async saveCategory(
    emulatorId: string,
    category: CustomFieldConfig['categories'][number],
    existingId?: string,
  ) {
    const data = { name: category.name, displayOrder: category.displayOrder }
    return existingId
      ? this.prisma.customFieldCategory.update({
          where: { id: existingId, emulatorId },
          data,
          select: { id: true },
        })
      : this.prisma.customFieldCategory.create({
          data: { emulatorId, ...data },
          select: { id: true },
        })
  }

  saveField(
    emulatorId: string,
    field: ConfigField,
    categoryId: string | null,
    existingId?: string,
  ) {
    const data = {
      name: field.name,
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

    return existingId
      ? this.prisma.customFieldDefinition.update({
          where: { id: existingId, emulatorId },
          data,
          select: { id: true },
        })
      : this.prisma.customFieldDefinition.create({
          data: { emulatorId, ...data },
          select: { id: true },
        })
  }

  async removeFields(emulatorId: string, ids: string[]) {
    if (ids.length > 0)
      await this.prisma.customFieldDefinition.deleteMany({ where: { emulatorId, id: { in: ids } } })
  }

  async removeCategories(emulatorId: string, ids: string[]) {
    if (ids.length > 0)
      await this.prisma.customFieldCategory.deleteMany({ where: { emulatorId, id: { in: ids } } })
  }
}
