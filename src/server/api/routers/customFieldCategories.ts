import { AppError, ResourceError } from '@/lib/errors'
import {
  CreateCustomFieldCategorySchema,
  GetCustomFieldCategoriesByEmulatorSchema,
  GetCustomFieldCategoryByIdSchema,
  UpdateCustomFieldCategorySchema,
  DeleteCustomFieldCategorySchema,
  UpdateCustomFieldCategoryOrderSchema,
} from '@/schemas/customFieldCategory'
import { createTRPCRouter, protectedProcedure, permissionProcedure } from '@/server/api/trpc'
import { prisma } from '@/server/db'
import { PERMISSIONS } from '@/utils/permission-system'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

const manageCustomFieldsProcedure = permissionProcedure(PERMISSIONS.MANAGE_CUSTOM_FIELDS)

export const customFieldCategoryRouter = createTRPCRouter({
  create: manageCustomFieldsProcedure
    .input(CreateCustomFieldCategorySchema)
    .mutation(async ({ ctx, input }) => {
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

      const existingCategory = await prisma.customFieldCategory.findUnique({
        where: {
          emulatorId_name: { emulatorId: input.emulatorId, name: input.name },
        },
      })

      if (existingCategory) {
        return AppError.alreadyExists('Category', `name "${input.name}"`)
      }

      const maxDisplayOrder = await prisma.customFieldCategory.aggregate({
        where: { emulatorId: input.emulatorId },
        _max: { displayOrder: true },
      })

      return prisma.customFieldCategory.create({
        data: {
          emulatorId: input.emulatorId,
          name: input.name,
          displayOrder: input.displayOrder ?? (maxDisplayOrder._max.displayOrder ?? -1) + 1,
        },
      })
    }),

  getByEmulator: protectedProcedure
    .input(GetCustomFieldCategoriesByEmulatorSchema)
    .query(async ({ input }) => {
      return prisma.customFieldCategory.findMany({
        where: { emulatorId: input.emulatorId },
        orderBy: { displayOrder: 'asc' },
        include: {
          fields: {
            orderBy: { categoryOrder: 'asc' },
          },
        },
      })
    }),

  byId: protectedProcedure.input(GetCustomFieldCategoryByIdSchema).query(async ({ input }) => {
    const category = await prisma.customFieldCategory.findUnique({
      where: { id: input.id },
      include: {
        fields: {
          orderBy: { categoryOrder: 'asc' },
        },
      },
    })

    if (!category) {
      return AppError.notFound('Category')
    }

    return category
  }),

  update: manageCustomFieldsProcedure
    .input(UpdateCustomFieldCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const categoryToUpdate = await prisma.customFieldCategory.findUnique({
        where: { id: input.id },
      })

      if (!categoryToUpdate) {
        return AppError.notFound('Category')
      }

      if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: {
              userId: ctx.session.user.id,
              emulatorId: categoryToUpdate.emulatorId,
            },
          },
        })

        if (!verifiedDeveloper) return ResourceError.customField.canOnlyManageVerified()
      }

      if (input.name) {
        const existingCategory = await prisma.customFieldCategory.findUnique({
          where: {
            emulatorId_name: {
              emulatorId: categoryToUpdate.emulatorId,
              name: input.name,
            },
          },
        })

        if (existingCategory && existingCategory.id !== input.id) {
          return AppError.alreadyExists('Category', `name "${input.name}"`)
        }
      }

      return prisma.customFieldCategory.update({
        where: { id: input.id },
        data: {
          name: input.name,
          displayOrder: input.displayOrder,
        },
      })
    }),

  delete: manageCustomFieldsProcedure
    .input(DeleteCustomFieldCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const categoryToDelete = await prisma.customFieldCategory.findUnique({
        where: { id: input.id },
        include: { fields: { select: { id: true } } },
      })

      if (!categoryToDelete) {
        return AppError.notFound('Category')
      }

      if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: {
              userId: ctx.session.user.id,
              emulatorId: categoryToDelete.emulatorId,
            },
          },
        })

        if (!verifiedDeveloper) return ResourceError.customField.canOnlyManageVerified()
      }

      if (categoryToDelete.fields.length > 0) {
        await prisma.customFieldDefinition.updateMany({
          where: { categoryId: input.id },
          data: { categoryId: null },
        })
      }

      return prisma.customFieldCategory.delete({
        where: { id: input.id },
      })
    }),

  updateOrder: manageCustomFieldsProcedure
    .input(UpdateCustomFieldCategoryOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input || input.length === 0) {
        return AppError.badRequest('No categories provided for reordering')
      }

      const firstCategory = await prisma.customFieldCategory.findUnique({
        where: { id: input[0]?.id },
      })

      if (!firstCategory) {
        return AppError.notFound('Category')
      }

      if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: {
              userId: ctx.session.user.id,
              emulatorId: firstCategory.emulatorId,
            },
          },
        })

        if (!verifiedDeveloper) return ResourceError.customField.canOnlyManageVerified()
      }

      await prisma.$transaction(
        input.map((category) =>
          prisma.customFieldCategory.update({
            where: { id: category.id },
            data: { displayOrder: category.displayOrder },
          }),
        ),
      )

      return { success: true }
    }),
})
