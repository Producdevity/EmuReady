import { TRPCError } from '@trpc/server'
import { type z } from 'zod'
import { AppError, ResourceError } from '@/lib/errors'
import { PrismaWriteRepository } from '@/server/persistence/prisma.repository'
import { isPrismaError, PRISMA_ERROR_CODES } from '@/server/utils/prisma-errors'
import { withRetryTransaction } from '@/server/utils/transactions'
import { Prisma } from '@orm'
import { type PrismaClient } from '@orm/client'
import { TEMPLATE_SELECT, TEMPLATE_TARGET_SELECT } from './persistence/template.prisma'
import { toFieldAttributes, toTemplateFieldData } from './template.mapper'
import {
  type CreateCustomFieldTemplateSchema,
  type UpdateCustomFieldTemplateSchema,
  type TemplateFieldSchema,
} from '../shared/template.schemas'

type WriteContext = {
  action: 'create' | 'update' | 'delete' | 'apply' | 'duplicate'
  name?: string
}

export class CustomFieldTemplateRepository extends PrismaWriteRepository<WriteContext> {
  constructor(
    private readonly owner: PrismaClient,
    private readonly transactionClient: Prisma.TransactionClient | null = null,
  ) {
    super(transactionClient ?? owner)
  }

  get(id: string) {
    return this.prisma.customFieldTemplate.findUnique({ where: { id }, select: TEMPLATE_SELECT })
  }

  list() {
    return this.prisma.customFieldTemplate.findMany({
      select: TEMPLATE_SELECT,
      orderBy: { name: Prisma.SortOrder.asc },
    })
  }

  listByIds(ids: string[]) {
    return this.prisma.customFieldTemplate.findMany({
      where: { id: { in: ids } },
      select: TEMPLATE_SELECT,
    })
  }

  syncCatalogTemplate(input: z.output<typeof CreateCustomFieldTemplateSchema>) {
    const fields = input.fields.map(toTemplateFieldData)
    return this.executeWrite(
      () =>
        this.prisma.customFieldTemplate.upsert({
          where: { name: input.name },
          create: { name: input.name, description: input.description, fields: { create: fields } },
          update: { fields: { deleteMany: {}, create: fields } },
          select: { id: true },
        }),
      { action: 'update', name: input.name },
    )
  }

  create(input: z.output<typeof CreateCustomFieldTemplateSchema>) {
    return this.executeWrite(
      () =>
        this.prisma.customFieldTemplate.create({
          data: {
            name: input.name,
            description: input.description,
            fields: { create: input.fields.map(toTemplateFieldData) },
          },
          select: { id: true },
        }),
      { action: 'create', name: input.name },
    )
  }

  update(input: z.output<typeof UpdateCustomFieldTemplateSchema>) {
    return this.executeWrite(
      () =>
        this.prisma.customFieldTemplate.update({
          where: { id: input.id },
          data: {
            name: input.name,
            description: input.description,
            fields: input.fields
              ? { deleteMany: {}, create: input.fields.map(toTemplateFieldData) }
              : undefined,
          },
          select: { id: true },
        }),
      { action: 'update', name: input.name },
    )
  }

  delete(id: string) {
    return this.executeWrite(
      () => this.prisma.customFieldTemplate.delete({ where: { id }, select: { id: true } }),
      { action: 'delete' },
    )
  }

  getTarget(emulatorId: string) {
    return this.prisma.emulator.findUnique({
      where: { id: emulatorId },
      select: TEMPLATE_TARGET_SELECT,
    })
  }

  createCategory(emulatorId: string, name: string, displayOrder: number) {
    return this.prisma.customFieldCategory.create({
      data: { emulatorId, name, displayOrder },
      select: { id: true },
    })
  }

  createField(
    emulatorId: string,
    field: z.output<typeof TemplateFieldSchema>,
    categoryId: string | null,
    displayOrder: number,
  ) {
    return this.prisma.customFieldDefinition.create({
      data: {
        ...toFieldAttributes(field),
        emulatorId,
        categoryId,
        categoryOrder: field.categoryOrder,
        displayOrder,
      },
      select: { id: true },
    })
  }

  transaction<T>(
    operation: (repository: CustomFieldTemplateRepository) => Promise<T>,
    action: 'apply' | 'duplicate',
  ) {
    if (this.transactionClient !== null) return operation(this)
    return this.executeWrite(
      () =>
        withRetryTransaction(
          this.owner,
          (tx) => operation(new CustomFieldTemplateRepository(this.owner, tx)),
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        ),
      { action },
    )
  }

  protected translateWriteError(error: unknown, context: WriteContext): never {
    if (error instanceof TRPCError) throw error
    if (isPrismaError(error, PRISMA_ERROR_CODES.TRANSACTION_FAILED)) {
      if (this.transactionClient !== null) throw error
      return AppError.conflict('Template data changed. Retry the operation.')
    }
    if (isPrismaError(error, PRISMA_ERROR_CODES.RECORD_NOT_FOUND))
      return ResourceError.customFieldTemplate.notFound()
    if (isPrismaError(error, PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION))
      return ResourceError.emulator.notFound()
    if (isPrismaError(error, PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION)) {
      if (context.action === 'apply')
        return AppError.conflict(
          'Custom fields changed while applying templates. Retry the operation.',
        )
      return ResourceError.customFieldTemplate.alreadyExists(context.name ?? 'this name')
    }
    return AppError.databaseError(
      `template ${context.action}`,
      error instanceof Error ? error : undefined,
    )
  }
}
