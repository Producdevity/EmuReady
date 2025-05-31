import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
  superAdminProcedure,
} from '@/server/api/trpc'
import { ResourceError, AppError } from '@/lib/errors'
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
          ? { name: { contains: search, mode: 'insensitive' } }
          : undefined,
        include: {
          _count: { select: { listings: true } },
        },
        orderBy: { name: 'asc' },
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
          _count: { select: { listings: true } },
        },
      })

      if (!emulator) ResourceError.emulator.notFound()

      return emulator
    }),

  create: adminProcedure
    .input(CreateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { name: input.name },
      })

      if (emulator) ResourceError.emulator.alreadyExists(input.name)

      return ctx.prisma.emulator.create({ data: input })
    }),

  update: adminProcedure
    .input(UpdateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, name } = input

      const emulator = await ctx.prisma.emulator.findUnique({ where: { id } })

      if (!emulator) return ResourceError.emulator.notFound()

      if (name !== emulator.name) {
        const existing = await ctx.prisma.emulator.findUnique({
          where: { name },
        })

        if (existing) ResourceError.emulator.alreadyExists(name)
      }

      return ctx.prisma.emulator.update({ where: { id }, data: { name } })
    }),

  delete: adminProcedure
    .input(DeleteEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if emulator is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { emulatorId: input.id },
      })

      if (listingsCount > 0) ResourceError.emulator.inUse(listingsCount)

      return ctx.prisma.emulator.delete({ where: { id: input.id } })
    }),

  updateSupportedSystems: superAdminProcedure
    .input(UpdateSupportedSystemsSchema)
    .mutation(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: input.emulatorId },
      })

      if (!emulator) ResourceError.emulator.notFound()

      const systems = await ctx.prisma.system.findMany({
        where: { id: { in: input.systemIds } },
        select: { id: true },
      })

      if (systems.length !== input.systemIds.length) {
        const foundSystemIds = new Set(systems.map((system) => system.id))
        const invalidIds = input.systemIds.filter(
          (id) => !foundSystemIds.has(id),
        )
        AppError.badRequest(
          `One or more system IDs are invalid: ${invalidIds.join(', ')}.`,
        )
      }

      await ctx.prisma.emulator.update({
        where: { id: input.emulatorId },
        data: { systems: { set: input.systemIds.map((id) => ({ id })) } },
      })

      return {
        success: true,
        message: 'Supported systems updated successfully.',
      }
    }),
})
