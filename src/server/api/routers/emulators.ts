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
import { EmulatorsRepository } from '@/server/repositories/emulators.repository'
import { calculateOffset, createPaginationResult } from '@/server/utils/pagination'
import { buildSearchFilter } from '@/server/utils/query-builders'
import { hasPermission } from '@/utils/permissions'
import { type Prisma, Role } from '@orm'

export const emulatorsRouter = createTRPCRouter({
  getStats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    return repository.getStats()
  }),

  get: publicProcedure.input(GetEmulatorsSchema).query(async ({ ctx, input }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    return repository.getPaginated({
      search: input?.search,
      limit: input?.limit,
      offset: input?.offset,
      page: input?.page,
      sortField: input?.sortField,
      sortDirection: input?.sortDirection,
    })
  }),

  byId: publicProcedure.input(GetEmulatorByIdSchema).query(async ({ ctx, input }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    const emulator = await repository.getById(input.id)

    return emulator ?? ResourceError.emulator.notFound()
  }),

  // Get emulators for admin dashboard - filters for developers
  getForAdmin: protectedProcedure.input(GetEmulatorsSchema).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 20
    const offset = input?.offset ?? 0

    const actualOffset = calculateOffset({ page: input?.page, offset }, limit)

    // Build where clause for filtering
    const searchConditions = buildSearchFilter(input?.search, ['name'])
    let where: Prisma.EmulatorWhereInput | undefined = searchConditions
      ? { OR: searchConditions }
      : undefined

    // If user is a developer (not moderator+), only show their assigned emulators
    if (
      ctx.session.user.role === Role.DEVELOPER &&
      !hasPermission(ctx.session.user.role, Role.MODERATOR)
    ) {
      const developerFilter: Prisma.EmulatorWhereInput = {
        verifiedDevelopers: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      }

      where = where ? { AND: [where, developerFilter] } : developerFilter
    }

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
      pagination: createPaginationResult(total, { page: input?.page, offset }, limit, actualOffset),
    }
  }),

  getVerifiedDeveloper: protectedProcedure.input(GetVerifiedDevelopersForEmulatorSchema).query(
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

  create: manageEmulatorsProcedure.input(CreateEmulatorSchema).mutation(async ({ ctx, input }) => {
    const repository = new EmulatorsRepository(ctx.prisma)

    const exists = await repository.existsByName(input.name)
    if (exists) return ResourceError.emulator.alreadyExists(input.name)

    return repository.create(input)
  }),

  update: manageEmulatorsProcedure.input(UpdateEmulatorSchema).mutation(async ({ ctx, input }) => {
    // For developers, verify they can manage this emulator
    if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
      const verifiedDeveloper = await ctx.prisma.verifiedDeveloper.findUnique({
        where: {
          userId_emulatorId: {
            userId: ctx.session.user.id,
            emulatorId: input.id,
          },
        },
      })

      if (!verifiedDeveloper) {
        return ResourceError.emulator.canOnlyManageVerified()
      }
    }

    const repository = new EmulatorsRepository(ctx.prisma)

    const emulator = await repository.getById(input.id)
    if (!emulator) return ResourceError.emulator.notFound()

    if (input.name !== emulator.name) {
      const exists = await repository.existsByName(input.name, input.id)
      if (exists) return ResourceError.emulator.alreadyExists(input.name)
    }

    return repository.update(input.id, {
      name: input.name,
      logo: input.logo || null,
      description: input.description || null,
      repositoryUrl: input.repositoryUrl || null,
      officialUrl: input.officialUrl || null,
    })
  }),

  delete: manageEmulatorsProcedure.input(DeleteEmulatorSchema).mutation(async ({ ctx, input }) => {
    // Developers can NEVER delete emulators
    if (!hasPermission(ctx.session.user.role, Role.MODERATOR)) {
      return ResourceError.emulator.requiresPermissionToDelete()
    }

    const repository = new EmulatorsRepository(ctx.prisma)

    // Check if emulator is used in any listings
    const listingsCount = await ctx.prisma.listing.count({
      where: { emulatorId: input.id },
    })

    if (listingsCount > 0) return ResourceError.emulator.inUse(listingsCount)

    await repository.delete(input.id)
    return { success: true }
  }),

  updateSupportedSystems: superAdminProcedure
    .input(UpdateSupportedSystemsSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new EmulatorsRepository(ctx.prisma)

      const emulator = await repository.getById(input.emulatorId)
      if (!emulator) return ResourceError.emulator.notFound()

      const systems = await ctx.prisma.system.findMany({
        where: { id: { in: input.systemIds } },
        select: { id: true },
      })

      if (systems.length !== input.systemIds.length) {
        const foundSystemIds = new Set(systems.map((system) => system.id))
        const invalidIds = input.systemIds.filter((id) => !foundSystemIds.has(id))
        return AppError.badRequest(`One or more system IDs are invalid: ${invalidIds.join(', ')}.`)
      }

      await repository.updateSupportedSystems(input.emulatorId, input.systemIds)

      return {
        success: true,
        message: 'Supported systems updated successfully.',
      }
    }),
})
