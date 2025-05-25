import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { prisma } from '@/server/db'
import { TRPCError } from '@trpc/server'
import { CustomFieldType, Prisma, Role } from '@orm'
import {
  CreateCustomFieldDefinitionSchema,
  GetCustomFieldDefinitionsByEmulatorSchema,
  GetCustomFieldDefinitionByIdSchema,
  UpdateCustomFieldDefinitionSchema,
  DeleteCustomFieldDefinitionSchema,
  UpdateCustomFieldDefinitionOrderSchema,
} from '@/schemas/customFieldDefinition'
import { hasPermission } from '@/utils/permissions'

type CustomFieldOptionArray = {
  value: string
  label: string
}[]

export const customFieldDefinitionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only Super Admins can create custom fields.',
        })
      }

      if (input.type === CustomFieldType.SELECT) {
        if (!input.options || input.options.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Options are required for SELECT type custom fields.',
          })
        }
      } else if (input.options && input.options.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Options can only be provided for SELECT type custom fields.',
        })
      }

      const existingField = await prisma.customFieldDefinition.findUnique({
        where: {
          emulatorId_name: { emulatorId: input.emulatorId, name: input.name },
        },
      })

      if (existingField) {
        throw new TRPCError({
          code: 'CONFLICT',
          message:
            'A custom field with this name already exists for this emulator.',
        })
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
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only Super Admins can fetch custom field details by ID.',
        })
      }
      const field = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })
      if (!field) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Custom field not found.',
        })
      }
      return field
    }),

  update: protectedProcedure
    .input(UpdateCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only Super Admins can update custom fields.',
        })
      }

      const fieldToUpdate = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })

      if (!fieldToUpdate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Custom field not found.',
        })
      }

      const newType = input.type ?? fieldToUpdate.type
      let optionsToSave: Prisma.JsonValue | typeof Prisma.DbNull =
        fieldToUpdate.options

      if (newType === CustomFieldType.SELECT) {
        if (input.hasOwnProperty('options')) {
          if (input.options && input.options.length > 0) {
            optionsToSave = input.options as Prisma.JsonArray
          } else if (input.options && input.options.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Options list cannot be empty for SELECT type. Provide at least one option.',
            })
          } else {
            optionsToSave = Prisma.DbNull
          }
        } else {
          const currentOptions =
            fieldToUpdate.options as CustomFieldOptionArray | null
          if (!Array.isArray(currentOptions) || currentOptions.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message:
                'Existing options are invalid or empty for SELECT type. Please provide new options if changing type to SELECT or updating options.',
            })
          }
          optionsToSave = currentOptions
        }
      } else {
        if (
          input.hasOwnProperty('options') &&
          input.options &&
          input.options.length > 0
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
              'Options can only be provided for SELECT type custom fields.',
          })
        }
        optionsToSave = Prisma.DbNull
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
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'A custom field with this name already exists for this emulator.',
          })
        }
      }

      return prisma.customFieldDefinition.update({
        where: { id: input.id },
        data: {
          name: input.name,
          label: input.label,
          type: input.type,
          options: optionsToSave,
          isRequired: input.isRequired,
          displayOrder: input.displayOrder,
        },
      })
    }),

  delete: protectedProcedure
    .input(DeleteCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only Super Admins can delete custom fields.',
        })
      }

      const fieldToDelete = await prisma.customFieldDefinition.findUnique({
        where: { id: input.id },
      })

      if (!fieldToDelete) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Custom field not found.',
        })
      }

      return prisma.customFieldDefinition.delete({
        where: { id: input.id },
      })
    }),

  updateOrder: protectedProcedure
    .input(UpdateCustomFieldDefinitionOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session.user.role, Role.SUPER_ADMIN)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only Super Admins can reorder custom fields.',
        })
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
