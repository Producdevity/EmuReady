import { AppError, ResourceError, ValidationError } from '@/lib/errors'
import {
  CreateCustomFieldTemplateSchema,
  UpdateCustomFieldTemplateSchema,
  GetCustomFieldTemplateByIdSchema,
  DeleteCustomFieldTemplateSchema,
  ApplyCustomFieldTemplateSchema,
} from '@/schemas/customFieldTemplate'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { hasRolePermission } from '@/utils/permissions'
import { CustomFieldType, Prisma, Role } from '@orm'
import type { TRPCContext } from '@/server/api/trpc'

const FIELDS_INCLUDE = {
  fields: {
    orderBy: { displayOrder: 'asc' as const },
  },
} as const

type TemplateField = {
  name: string
  label: string
  type: CustomFieldType
  options?: { value: string; label: string }[]
  defaultValue?: string | boolean | null
  isRequired?: boolean
  displayOrder?: number
}

function validateTemplateFields(fields: TemplateField[]) {
  fields.forEach((field) => {
    if (field.type === CustomFieldType.SELECT) {
      if (!field.options || field.options.length === 0) {
        ValidationError.requiresOptions(field.type)
      }
    } else if (field.options && field.options.length > 0) {
      ValidationError.optionsNotAllowed(field.type)
    }
  })

  const fieldNames = fields.map((field) => field.name)
  const uniqueFieldNames = new Set(fieldNames)
  if (fieldNames.length !== uniqueFieldNames.size) {
    AppError.badRequest('Field names must be unique within a template')
  }
}

function createFieldData(field: TemplateField, index: number) {
  return {
    name: field.name,
    label: field.label,
    type: field.type,
    options:
      field.type === CustomFieldType.SELECT ? (field.options ?? Prisma.DbNull) : Prisma.DbNull,
    defaultValue: field.defaultValue ?? Prisma.DbNull,
    isRequired: field.isRequired ?? false,
    displayOrder: field.displayOrder ?? index,
  }
}

async function requireSuperAdminPermission(ctx: TRPCContext) {
  if (!ctx.session?.user?.role || !hasRolePermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
    AppError.insufficientRole(Role.SUPER_ADMIN)
  }
}

async function requireAdminPermission(ctx: TRPCContext) {
  if (!ctx.session?.user?.role || !hasRolePermission(ctx.session.user.role, Role.ADMIN)) {
    AppError.insufficientRole(Role.ADMIN)
  }
}

async function findTemplateOrThrow(ctx: TRPCContext, id: string) {
  const template = await ctx.prisma.customFieldTemplate.findUnique({
    where: { id },
    include: { fields: true },
  })

  if (!template) {
    ResourceError.customFieldTemplate.notFound()
  }

  return template
}

export const customFieldTemplateRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateCustomFieldTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSuperAdminPermission(ctx)

      validateTemplateFields(input.fields)

      return ctx.prisma.customFieldTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          fields: {
            create: input.fields.map(createFieldData),
          },
        },
        include: FIELDS_INCLUDE,
      })
    }),

  get: protectedProcedure.query(async ({ ctx }) => {
    await requireAdminPermission(ctx)

    return ctx.prisma.customFieldTemplate.findMany({
      include: FIELDS_INCLUDE,
      orderBy: { name: 'asc' },
    })
  }),

  byId: protectedProcedure.input(GetCustomFieldTemplateByIdSchema).query(async ({ ctx, input }) => {
    await requireAdminPermission(ctx)

    return ctx.prisma.customFieldTemplate.findUnique({
      where: { id: input.id },
      include: FIELDS_INCLUDE,
    })
  }),

  update: protectedProcedure
    .input(UpdateCustomFieldTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSuperAdminPermission(ctx)
      await findTemplateOrThrow(ctx, input.id)

      if (input.fields) {
        validateTemplateFields(input.fields)
      }

      return ctx.prisma.customFieldTemplate.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          fields: input.fields
            ? {
                deleteMany: {},
                create: input.fields.map(createFieldData),
              }
            : undefined,
        },
        include: FIELDS_INCLUDE,
      })
    }),

  delete: protectedProcedure
    .input(DeleteCustomFieldTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSuperAdminPermission(ctx)
      await findTemplateOrThrow(ctx, input.id)

      return ctx.prisma.customFieldTemplate.delete({
        where: { id: input.id },
      })
    }),

  duplicate: protectedProcedure
    .input(GetCustomFieldTemplateByIdSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSuperAdminPermission(ctx)

      const originalTemplate = await findTemplateOrThrow(ctx, input.id)

      if (!originalTemplate) return ResourceError.customFieldTemplate.notFound()

      // Create a new template with "Copy of" prefix
      const newName = `Copy of ${originalTemplate.name}`

      return ctx.prisma.customFieldTemplate.create({
        data: {
          name: newName,
          description: originalTemplate.description,
          fields: {
            create: originalTemplate.fields.map((field) => ({
              name: field.name,
              label: field.label,
              type: field.type,
              options: field.options ?? Prisma.DbNull,
              defaultValue: field.defaultValue ?? Prisma.DbNull,
              isRequired: field.isRequired,
              displayOrder: field.displayOrder,
            })),
          },
        },
        include: FIELDS_INCLUDE,
      })
    }),

  applyToEmulator: protectedProcedure
    .input(ApplyCustomFieldTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await requireSuperAdminPermission(ctx)

      const templates = await ctx.prisma.customFieldTemplate.findMany({
        where: { id: { in: input.templateIds } },
        include: FIELDS_INCLUDE,
      })

      if (templates.length !== input.templateIds.length) {
        AppError.notFound('One or more templates')
      }

      const existingFields = await ctx.prisma.customFieldDefinition.findMany({
        where: { emulatorId: input.emulatorId },
      })

      const existingFieldNames = new Set(existingFields.map((f) => f.name))
      const allTemplateFields = templates.flatMap((template) => template.fields)

      const templateFieldNames = allTemplateFields.map((field) => field.name)
      const uniqueTemplateFieldNames = new Set(templateFieldNames)
      if (templateFieldNames.length !== uniqueTemplateFieldNames.size) {
        AppError.badRequest('Templates contain duplicate field names')
      }

      const fieldsToCreate = allTemplateFields.filter(
        (field) => !existingFieldNames.has(field.name),
      )

      if (fieldsToCreate.length === 0) {
        AppError.badRequest(
          'All fields from the selected templates already exist for this emulator',
        )
      }

      const existingCategories = await ctx.prisma.customFieldCategory.findMany({
        where: { emulatorId: input.emulatorId },
      })

      const categoryMap = new Map<string, string>()
      existingCategories.forEach((cat) => categoryMap.set(cat.name, cat.id))

      const uniqueCategoryNames = new Set(
        fieldsToCreate.map((f) => f.categoryName).filter((name): name is string => !!name),
      )

      const maxCategoryOrder = existingCategories.reduce(
        (max, cat) => Math.max(max, cat.displayOrder),
        -1,
      )

      let categoryOrderCounter = maxCategoryOrder + 1
      for (const categoryName of uniqueCategoryNames) {
        if (!categoryMap.has(categoryName)) {
          const newCategory = await ctx.prisma.customFieldCategory.create({
            data: {
              emulatorId: input.emulatorId,
              name: categoryName,
              displayOrder: categoryOrderCounter++,
            },
          })
          categoryMap.set(categoryName, newCategory.id)
        }
      }

      const maxDisplayOrder = existingFields.reduce(
        (max, field) => Math.max(max, field.displayOrder),
        -1,
      )

      const createdFields = await Promise.all(
        fieldsToCreate.map((field, index) =>
          ctx.prisma.customFieldDefinition.create({
            data: {
              emulatorId: input.emulatorId,
              categoryId: field.categoryName ? (categoryMap.get(field.categoryName) ?? null) : null,
              name: field.name,
              label: field.label,
              type: field.type,
              options:
                field.type === CustomFieldType.SELECT
                  ? (field.options ?? Prisma.DbNull)
                  : Prisma.DbNull,
              defaultValue: field.defaultValue ?? Prisma.DbNull,
              isRequired: field.isRequired,
              displayOrder: maxDisplayOrder + index + 1,
              categoryOrder: field.categoryOrder ?? 0,
            },
          }),
        ),
      )

      return {
        createdFields: createdFields.length,
        skippedFields: allTemplateFields.length - fieldsToCreate.length,
        templateNames: templates.map((t) => t.name),
      }
    }),
})
