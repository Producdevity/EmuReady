import { TRPCError } from '@trpc/server'

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
  superAdminProcedure,
} from '@/server/api/trpc'
import {
  GetEmulatorsSchema,
  GetEmulatorByIdSchema,
  CreateEmulatorSchema,
  UpdateEmulatorSchema,
  DeleteEmulatorSchema,
  UpdateSupportedSystemsSchema,
} from '@/schemas/emulator'

export const emulatorsRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetEmulatorsSchema)
    .query(async ({ ctx, input }) => {
      const { search } = input ?? {}

      return ctx.prisma.emulator.findMany({
        where: search
          ? {
              name: { contains: search },
            }
          : undefined,
        include: {
          _count: {
            select: { listings: true },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })
    }),

  byId: publicProcedure
    .input(GetEmulatorByIdSchema)
    .query(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: input.id },
        include: {
          systems: true,
          customFieldDefinitions: {
            orderBy: {
              displayOrder: 'asc',
            },
          },
          _count: {
            select: { listings: true },
          },
        },
      })

      if (!emulator) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Emulator not found',
        })
      }

      return emulator
    }),

  create: adminProcedure
    .input(CreateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if emulator already exists
      const existing = await ctx.prisma.emulator.findUnique({
        where: { name: input.name },
      })

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Emulator with this name already exists',
        })
      }

      return ctx.prisma.emulator.create({
        data: input,
      })
    }),

  update: adminProcedure
    .input(UpdateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, name } = input

      // Check if emulator exists
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id },
      })

      if (!emulator) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Emulator not found',
        })
      }

      // Check if name is already taken by another emulator
      if (name !== emulator.name) {
        const existing = await ctx.prisma.emulator.findUnique({
          where: { name },
        })

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Emulator with this name already exists',
          })
        }
      }

      return ctx.prisma.emulator.update({
        where: { id },
        data: { name },
      })
    }),

  delete: adminProcedure
    .input(DeleteEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if emulator is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { emulatorId: input.id },
      })

      if (listingsCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete emulator that is used in ${listingsCount} listings`,
        })
      }

      return ctx.prisma.emulator.delete({
        where: { id: input.id },
      })
    }),

  updateSupportedSystems: superAdminProcedure
    .input(UpdateSupportedSystemsSchema)
    .mutation(async ({ ctx, input }) => {
      const { emulatorId, systemIds } = input

      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: emulatorId },
      })

      if (!emulator) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Emulator not found.',
        })
      }

      const systems = await ctx.prisma.system.findMany({
        where: { id: { in: systemIds } },
        select: { id: true },
      })

      if (systems.length !== systemIds.length) {
        const foundSystemIds = new Set(systems.map((s) => s.id))
        const invalidIds = systemIds.filter((id) => !foundSystemIds.has(id))
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `One or more system IDs are invalid: ${invalidIds.join(', ')}.`,
        })
      }

      await ctx.prisma.emulator.update({
        where: { id: emulatorId },
        data: {
          systems: {
            set: systemIds.map((id) => ({ id })),
          },
        },
      })

      return {
        success: true,
        message: 'Supported systems updated successfully.',
      }
    }),
})
