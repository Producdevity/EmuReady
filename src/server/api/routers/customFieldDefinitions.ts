import { AppError, ResourceError, ValidationError } from '@/lib/errors'
import {
  CreateCustomFieldDefinitionSchema,
  GetCustomFieldDefinitionsByEmulatorSchema,
  GetCustomFieldDefinitionByIdSchema,
  UpdateCustomFieldDefinitionSchema,
  DeleteCustomFieldDefinitionSchema,
  UpdateCustomFieldDefinitionOrderSchema,
} from '@/schemas/customFieldDefinition'
import { createTRPCRouter, protectedProcedure, permissionProcedure } from '@/server/api/trpc'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { CustomFieldType, type Prisma, Role } from '@orm'

type CustomFieldOptionArray = {
  value: string
  label: string
}[]

const manageCustomFieldsProcedure = permissionProcedure(PERMISSIONS.MANAGE_CUSTOM_FIELDS)

export const customFieldDefinitionRouter = createTRPCRouter({
  create: manageCustomFieldsProcedure
    .input(CreateCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      // For developers, verify they can manage this emulator
      if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: { userId: ctx.session.user.id, emulatorId: input.emulatorId },
          },
        })

        if (!verifiedDeveloper) {
          return ResourceError.customField.canOnlyManageVerified()
        }
      }

      if (input.type === CustomFieldType.SELECT) {
        if (!input.options || input.options.length === 0) {
          return ValidationError.requiresOptions(CustomFieldType.SELECT)
        }
      } else if (input.options && input.options.length > 0) {
        return ValidationError.optionsNotAllowed(input.type)
      }

      if (input.type === CustomFieldType.RANGE) {
        if (input.rangeMin === undefined || input.rangeMax === undefined) {
          return ResourceError.customField.rangeMinMaxRequired()
        }
        if (input.rangeMin! >= input.rangeMax!) {
          return ResourceError.customField.rangeMinLessThanMax()
        }
      }

      const existingField = await prisma.customFieldDefinition.findUnique({
        where: {
          emulatorId_name: { emulatorId: input.emulatorId, name: input.name },
        },
      })

      if (existingField) return ResourceError.customField.alreadyExists(input.name)

      // Auto-assign displayOrder based on existing field count for this emulator
      const existingFieldCount = await prisma.customFieldDefinition.count({
        where: { emulatorId: input.emulatorId },
      })

      return prisma.customFieldDefinition.create({
        data: {
          emulatorId: input.emulatorId,
          categoryId: input.categoryId ?? null,
          name: input.name,
          label: input.label,
          type: input.type,
          options:
            input.type === CustomFieldType.SELECT && input.options
              ? input.options
              : (null as unknown as Prisma.InputJsonValue),
          defaultValue: (input.defaultValue ?? null) as Prisma.InputJsonValue,
          placeholder: input.placeholder ?? null,
          rangeMin: input.rangeMin ?? null,
          rangeMax: input.rangeMax ?? null,
          rangeUnit: input.rangeUnit ?? null,
          rangeDecimals: input.rangeDecimals ?? null,
          isRequired: input.isRequired,
          displayOrder: existingFieldCount,
          categoryOrder: input.categoryOrder ?? 0,
        },
      })
    }),

  getByEmulator: protectedProcedure
    .input(GetCustomFieldDefinitionsByEmulatorSchema)
    .query(async ({ input }) => {
      const fields = await prisma.customFieldDefinition.findMany({
        where: { emulatorId: input.emulatorId },
        include: { emulator: true, category: true },
      })

      // Sort by category displayOrder (nulls last), then categoryOrder, then displayOrder
      return fields.sort((a, b) => {
        const aDisplayOrder = a.category?.displayOrder ?? Number.MAX_SAFE_INTEGER
        const bDisplayOrder = b.category?.displayOrder ?? Number.MAX_SAFE_INTEGER

        if (aDisplayOrder !== bDisplayOrder) {
          return aDisplayOrder - bDisplayOrder
        }

        const aCategoryOrder = a.categoryOrder ?? 0
        const bCategoryOrder = b.categoryOrder ?? 0

        if (aCategoryOrder !== bCategoryOrder) {
          return aCategoryOrder - bCategoryOrder
        }

        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      })
    }),

  byId: protectedProcedure
    .input(GetCustomFieldDefinitionByIdSchema)
    .query(async ({ ctx, input }) => {
      if (!hasRolePermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        return AppError.insufficientRole(Role.SUPER_ADMIN)
      }
      const field = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })
      if (!field) return ResourceError.customField.notFound()
      return field
    }),

  update: manageCustomFieldsProcedure
    .input(UpdateCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      const fieldToUpdate = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })

      if (!fieldToUpdate) return ResourceError.customField.notFound()

      // For developers, verify they can manage this emulator
      if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: {
              userId: ctx.session.user.id,
              emulatorId: fieldToUpdate.emulatorId,
            },
          },
        })

        if (!verifiedDeveloper) return ResourceError.customField.canOnlyManageVerified()
      }

      const newType = input.type ?? fieldToUpdate.type
      let optionsToSave: Prisma.InputJsonValue = (fieldToUpdate.options ??
        null) as Prisma.InputJsonValue

      if (newType === CustomFieldType.SELECT) {
        if (input.hasOwnProperty('options')) {
          if (input.options && input.options.length > 0) {
            optionsToSave = input.options
          } else if (input.options && input.options.length === 0) {
            return ValidationError.emptyOptions(CustomFieldType.SELECT)
          } else {
            optionsToSave = null as unknown as Prisma.InputJsonValue
          }
        } else {
          const currentOptions = fieldToUpdate.options as CustomFieldOptionArray | null
          if (!Array.isArray(currentOptions) || currentOptions.length === 0) {
            return ValidationError.invalidOptions(CustomFieldType.SELECT)
          }
          optionsToSave = currentOptions
        }
      } else {
        if (input.hasOwnProperty('options') && input.options && input.options.length > 0) {
          return ValidationError.optionsNotAllowed(newType)
        }
        optionsToSave = null as unknown as Prisma.InputJsonValue
      }

      if (newType === CustomFieldType.RANGE) {
        const rangeMin = input.rangeMin ?? fieldToUpdate.rangeMin
        const rangeMax = input.rangeMax ?? fieldToUpdate.rangeMax
        if (rangeMin !== null && rangeMax !== null && rangeMin >= rangeMax) {
          return ResourceError.customField.rangeMinLessThanMax()
        }
      }

      if (input.name && input.name !== fieldToUpdate.name) {
        const existingField = await prisma.customFieldDefinition.findUnique({
          where: { emulatorId_name: { emulatorId: fieldToUpdate.emulatorId, name: input.name } },
        })
        if (existingField) return ResourceError.customField.alreadyExists(input.name)
      }

      return prisma.customFieldDefinition.update({
        where: { id: input.id },
        data: {
          categoryId: input.hasOwnProperty('categoryId') ? input.categoryId : undefined,
          name: input.name,
          label: input.label,
          type: input.type,
          options: optionsToSave,
          defaultValue:
            input.defaultValue !== undefined
              ? (input.defaultValue as Prisma.InputJsonValue)
              : undefined,
          placeholder: input.placeholder ?? undefined,
          rangeMin: input.rangeMin ?? undefined,
          rangeMax: input.rangeMax ?? undefined,
          rangeUnit: input.rangeUnit ?? undefined,
          rangeDecimals: input.rangeDecimals ?? undefined,
          isRequired: input.isRequired,
          categoryOrder: input.categoryOrder ?? undefined,
        },
      })
    }),

  delete: manageCustomFieldsProcedure
    .input(DeleteCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      const fieldToDelete = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })

      if (!fieldToDelete) return ResourceError.customField.notFound()

      // For developers, verify they can manage this emulator
      if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: {
              userId: ctx.session.user.id,
              emulatorId: fieldToDelete.emulatorId,
            },
          },
        })

        if (!verifiedDeveloper) return ResourceError.customField.canOnlyManageVerified()
      }

      return prisma.customFieldDefinition.delete({ where: { id: input.id } })
    }),

  updateOrder: protectedProcedure
    .input(UpdateCustomFieldDefinitionOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasRolePermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        return AppError.insufficientRole(Role.SUPER_ADMIN)
      }

      return ctx.prisma.$transaction(
        input.map((fieldOrder) =>
          ctx.prisma.customFieldDefinition.update({
            where: { id: fieldOrder.id },
            data: { displayOrder: fieldOrder.displayOrder },
          }),
        ),
      )
    }),
})
