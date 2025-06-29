import { ResourceError, AppError } from '@/lib/errors'
import {
  GetEmulatorsSchema,
  GetEmulatorByIdSchema,
  CreateEmulatorSchema,
  UpdateEmulatorSchema,
  DeleteEmulatorSchema,
  UpdateSupportedSystemsSchema,
} from '@/schemas/emulator'
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
  superAdminProcedure,
} from '@/server/api/trpc'
import type { Prisma } from '@orm'

export const emulatorsRouter = createTRPCRouter({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [total, withListings, withSystems] = await Promise.all([
      ctx.prisma.emulator.count(),
      ctx.prisma.emulator.count({
        where: { listings: { some: {} } },
      }),
      ctx.prisma.emulator.count({
        where: { systems: { some: {} } },
      }),
    ])

    return {
      total,
      withListings,
      withSystems,
      withoutListings: total - withListings,
    }
  }),

  get: publicProcedure
    .input(GetEmulatorsSchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20
      const offset = input?.offset ?? 0

      // Calculate actual offset based on page or use provided offset
      const actualOffset = input?.page ? (input.page - 1) * limit : offset

      // Build where clause for filtering
      const where: Prisma.EmulatorWhereInput | undefined = input?.search
        ? { name: { contains: input.search, mode: 'insensitive' } }
        : undefined

      // Build orderBy based on sortField and sortDirection
      let orderBy: Prisma.EmulatorOrderByWithRelationInput = { name: 'asc' }

      if (input?.sortField && input?.sortDirection) {
        switch (input.sortField) {
          case 'name':
            orderBy = { name: input.sortDirection }
            break
          case 'systemCount':
            orderBy = { systems: { _count: input.sortDirection } }
            break
          case 'listingCount':
            orderBy = { listings: { _count: input.sortDirection } }
            break
        }
      }

      // Always run count query for consistent pagination
      const total = await ctx.prisma.emulator.count({ where })

      // Get emulators with pagination and include systems data
      const emulators = await ctx.prisma.emulator.findMany({
        where,
        include: {
          systems: { select: { id: true, name: true, key: true } },
          verifiedDevelopers: {
            include: {
              user: { select: { id: true, name: true, profileImage: true } },
            },
          },
          _count: { select: { listings: true, systems: true } },
        },
        orderBy,
        skip: actualOffset,
        take: limit,
      })

      return {
        emulators,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: input?.page ?? Math.floor(actualOffset / limit) + 1,
          offset: actualOffset,
          limit: limit,
        },
      }
    }),

  byId: publicProcedure
    .input(GetEmulatorByIdSchema)
    .query(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: input.id },
        include: {
          systems: { select: { id: true, name: true, key: true } },
          verifiedDevelopers: {
            include: {
              user: { select: { id: true, name: true, profileImage: true } },
            },
          },
          customFieldDefinitions: { orderBy: { displayOrder: 'asc' } },
          _count: { select: { listings: true } },
        },
      })

      return emulator ?? ResourceError.emulator.notFound()
    }),

  create: adminProcedure
    .input(CreateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { name: input.name },
      })

      if (emulator) return ResourceError.emulator.alreadyExists(input.name)

      return ctx.prisma.emulator.create({ data: input })
    }),

  update: adminProcedure
    .input(UpdateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { id: input.id },
      })

      if (!emulator) return ResourceError.emulator.notFound()

      if (input.name !== emulator.name) {
        const existing = await ctx.prisma.emulator.findUnique({
          where: { name: input.name },
        })

        if (existing) return ResourceError.emulator.alreadyExists(input.name)
      }

      return ctx.prisma.emulator.update({
        where: { id: input.id },
        data: {
          name: input.name,
          logo: input.logo || null,
          description: input.description || null,
          repositoryUrl: input.repositoryUrl || null,
          officialUrl: input.officialUrl || null,
        },
      })
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
        return AppError.badRequest(
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
