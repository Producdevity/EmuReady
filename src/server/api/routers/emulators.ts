import { AppError, ResourceError } from '@/lib/errors'
import {
  CreateEmulatorSchema,
  DeleteEmulatorSchema,
  GetEmulatorByIdSchema,
  GetEmulatorsSchema,
  GetVerifiedDevelopersForEmulatorSchema,
  UpdateEmulatorSchema,
  UpdateSupportedSystemsSchema,
} from '@/schemas/emulator'
import {
  createTRPCRouter,
  manageEmulatorsProcedure,
  protectedProcedure,
  publicProcedure,
  superAdminProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import {
  calculateOffset,
  createPaginationResult,
} from '@/server/utils/pagination'
import { buildSearchFilter } from '@/server/utils/query-builders'
import { batchQueries } from '@/server/utils/query-performance'
import { hasPermission } from '@/utils/permissions'
import { type Prisma, Role } from '@orm'

export const emulatorsRouter = createTRPCRouter({
  getStats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [total, withListings, withSystems] = await batchQueries([
      ctx.prisma.emulator.count(),
      ctx.prisma.emulator.count({ where: { listings: { some: {} } } }),
      ctx.prisma.emulator.count({ where: { systems: { some: {} } } }),
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

      const actualOffset = calculateOffset({ page: input?.page, offset }, limit)

      // Build where clause for filtering
      const searchConditions = buildSearchFilter(input?.search, ['name'])
      const where: Prisma.EmulatorWhereInput | undefined = searchConditions
        ? { OR: searchConditions }
        : undefined

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
        pagination: createPaginationResult(
          total,
          { page: input?.page, offset },
          limit,
          actualOffset,
        ),
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

  getVerifiedDeveloper: protectedProcedure
    .input(GetVerifiedDevelopersForEmulatorSchema)
    .query(
      async ({ ctx, input }) =>
        await ctx.prisma.verifiedDeveloper.findUnique({
          where: {
            userId_emulatorId: {
              userId: ctx.session.user.id,
              emulatorId: input.emulatorId,
            },
          },
          include: {
            user: { select: { id: true, name: true, profileImage: true } },
            emulator: { select: { id: true, name: true } },
          },
        }),
    ),

  create: manageEmulatorsProcedure
    .input(CreateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      const emulator = await ctx.prisma.emulator.findUnique({
        where: { name: input.name },
      })

      if (emulator) return ResourceError.emulator.alreadyExists(input.name)

      return ctx.prisma.emulator.create({ data: input })
    }),

  update: manageEmulatorsProcedure
    .input(UpdateEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      // For developers, verify they can manage this emulator
      if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique(
          {
            where: {
              userId_emulatorId: {
                userId: ctx.session.user.id,
                emulatorId: input.id,
              },
            },
          },
        )

        if (!verifiedDeveloper) {
          return AppError.forbidden(
            'You can only manage emulators you are verified for',
          )
        }
      }

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

  delete: manageEmulatorsProcedure
    .input(DeleteEmulatorSchema)
    .mutation(async ({ ctx, input }) => {
      // For developers, verify they can manage this emulator
      if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
        const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique(
          {
            where: {
              userId_emulatorId: {
                userId: ctx.session.user.id,
                emulatorId: input.id,
              },
            },
          },
        )

        if (!verifiedDeveloper) {
          return AppError.forbidden(
            'You can only manage emulators you are verified for',
          )
        }
      }

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
