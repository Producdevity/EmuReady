import { AppError, ResourceError, ValidationError } from '@/lib/errors'
import {
  CreateCustomFieldDefinitionSchema,
  GetCustomFieldDefinitionsByEmulatorSchema,
  GetCustomFieldDefinitionByIdSchema,
  UpdateCustomFieldDefinitionSchema,
  DeleteCustomFieldDefinitionSchema,
  UpdateCustomFieldDefinitionOrderSchema,
} from '@/schemas/customFieldDefinition'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { prisma } from '@/server/db'
import { hasPermission } from '@/utils/permissions'
import { CustomFieldType, Prisma, Role } from '@orm'

type CustomFieldOptionArray = {
  value: string
  label: string
}[]

export const customFieldDefinitionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      if (input.type === CustomFieldType.SELECT) {
        if (!input.options || input.options.length === 0) {
          ValidationError.requiresOptions('SELECT')
        }
      } else if (input.options && input.options.length > 0) {
        ValidationError.optionsNotAllowed(input.type)
      }

      if (input.type === CustomFieldType.RANGE) {
        if (input.rangeMin === undefined || input.rangeMax === undefined) {
          AppError.badRequest(
            'Range minimum and maximum are required for RANGE type fields',
          )
        }
        if (input.rangeMin >= input.rangeMax) {
          AppError.badRequest('Range minimum must be less than maximum')
        }
      }

      const existingField = await prisma.customFieldDefinition.findUnique({
        where: {
          emulatorId_name: { emulatorId: input.emulatorId, name: input.name },
        },
      })

      if (existingField) {
        ResourceError.customField.alreadyExists(input.name)
      }

      return prisma.customFieldDefinition.create({
        data: {
          emulatorId: input.emulatorId,
          name: input.name,
          label: input.label,
          type: input.type,
          options:
            input.type === CustomFieldType.SELECT && input.options
              ? input.options
              : Prisma.DbNull,
          defaultValue: input.defaultValue ?? Prisma.DbNull,
          placeholder: input.placeholder ?? null,
          rangeMin: input.rangeMin ?? null,
          rangeMax: input.rangeMax ?? null,
          rangeUnit: input.rangeUnit ?? null,
          rangeDecimals: input.rangeDecimals ?? null,
          isRequired: input.isRequired,
          displayOrder: input.displayOrder,
        },
      })
    }),

  getByEmulator: protectedProcedure
    .input(GetCustomFieldDefinitionsByEmulatorSchema)
    .query(async ({ input }) => {
      return prisma.customFieldDefinition.findMany({
        where: { emulatorId: input.emulatorId },
        orderBy: { displayOrder: 'asc' },
        include: {
          emulator: true,
        },
      })
    }),

  byId: protectedProcedure
    .input(GetCustomFieldDefinitionByIdSchema)
    .query(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }
      const field = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })
      if (!field) {
        ResourceError.customField.notFound()
      }
      return field
    }),

  update: protectedProcedure
    .input(UpdateCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      const fieldToUpdate = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })

      if (!fieldToUpdate) {
        ResourceError.customField.notFound()
        return // This will never execute, but helps TypeScript understand
      }

      const newType = input.type ?? fieldToUpdate.type
      let optionsToSave: Prisma.JsonValue | typeof Prisma.DbNull =
        fieldToUpdate.options

      if (newType === CustomFieldType.SELECT) {
        if (input.hasOwnProperty('options')) {
          if (input.options && input.options.length > 0) {
            optionsToSave = input.options as Prisma.JsonArray
          } else if (input.options && input.options.length === 0) {
            ValidationError.emptyOptions('SELECT')
          } else {
            optionsToSave = Prisma.DbNull
          }
        } else {
          const currentOptions =
            fieldToUpdate.options as CustomFieldOptionArray | null
          if (!Array.isArray(currentOptions) || currentOptions.length === 0) {
            ValidationError.invalidOptions('SELECT')
          }
          optionsToSave = currentOptions
        }
      } else {
        if (
          input.hasOwnProperty('options') &&
          input.options &&
          input.options.length > 0
        ) {
          ValidationError.optionsNotAllowed(newType)
        }
        optionsToSave = Prisma.DbNull
      }

      if (newType === CustomFieldType.RANGE) {
        const rangeMin = input.rangeMin ?? fieldToUpdate.rangeMin
        const rangeMax = input.rangeMax ?? fieldToUpdate.rangeMax
        if (rangeMin !== null && rangeMax !== null && rangeMin >= rangeMax) {
          AppError.badRequest('Range minimum must be less than maximum')
        }
      }

      if (input.name && input.name !== fieldToUpdate.name) {
        const existingField = await prisma.customFieldDefinition.findUnique({
          where: {
            emulatorId_name: {
              emulatorId: fieldToUpdate.emulatorId,
              name: input.name,
            },
          },
        })
        if (existingField) {
          ResourceError.customField.alreadyExists(input.name)
        }
      }

      return prisma.customFieldDefinition.update({
        where: { id: input.id },
        data: {
          name: input.name,
          label: input.label,
          type: input.type,
          options: optionsToSave,
          defaultValue: input.defaultValue ?? Prisma.DbNull,
          placeholder: input.placeholder ?? undefined,
          rangeMin: input.rangeMin ?? undefined,
          rangeMax: input.rangeMax ?? undefined,
          rangeUnit: input.rangeUnit ?? undefined,
          rangeDecimals: input.rangeDecimals ?? undefined,
          isRequired: input.isRequired,
          displayOrder: input.displayOrder,
        },
      })
    }),

  delete: protectedProcedure
    .input(DeleteCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
      }

      const fieldToDelete = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })

      if (!fieldToDelete) return ResourceError.customField.notFound()

      return prisma.customFieldDefinition.delete({
        where: { id: input.id },
      })
    }),

  updateOrder: protectedProcedure
    .input(UpdateCustomFieldDefinitionOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        AppError.insufficientPermissions(Role.SUPER_ADMIN)
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
