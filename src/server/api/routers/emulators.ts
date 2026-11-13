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
  accessAdminPanelProcedure,
  manageEmulatorsProcedure,
  protectedProcedure,
  publicProcedure,
  superAdminProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { EmulatorsRepository } from '@/server/repositories/emulators.repository'
import { hasRolePermission } from '@/utils/permissions'
import { Role } from '@orm'

export const emulatorsRouter = createTRPCRouter({
  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    return repository.stats()
  }),

  trending: publicProcedure.query(async ({ ctx }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    return repository.getTrending(8)
  }),

  get: publicProcedure.input(GetEmulatorsSchema).query(async ({ ctx, input }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    return repository.list({
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
    const emulator = await repository.byId(input.id)

    return emulator ?? ResourceError.emulator.notFound()
  }),

  getForAdmin: accessAdminPanelProcedure.input(GetEmulatorsSchema).query(async ({ ctx, input }) => {
    const repository = new EmulatorsRepository(ctx.prisma)
    return repository.list({
      search: input?.search,
      limit: input?.limit,
      offset: input?.offset,
      page: input?.page,
      sortField: input?.sortField && input.sortDirection ? input.sortField : undefined,
      sortDirection: input?.sortDirection,
      verifiedDeveloperId:
        ctx.session.user.role === Role.DEVELOPER ? ctx.session.user.id : undefined,
    })
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
    if (!hasRolePermission(ctx.session.user.role, Role.MODERATOR)) {
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

    const emulator = await repository.byId(input.id)
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
      androidGithubRepoUrl: input.androidGithubRepoUrl || null,
    })
  }),

  delete: manageEmulatorsProcedure.input(DeleteEmulatorSchema).mutation(async ({ ctx, input }) => {
    // Developers or Moderators can NEVER delete emulators
    if (!hasRolePermission(ctx.session.user.role, Role.ADMIN)) {
      return ResourceError.emulator.requiresPermissionToDelete()
    }

    const repository = new EmulatorsRepository(ctx.prisma)

    // Check if emulator is used in any listings
    const listingsCount = await ctx.prisma.listing.count({ where: { emulatorId: input.id } })

    if (listingsCount > 0) return ResourceError.emulator.inUse(listingsCount)

    await repository.delete(input.id)
    return { success: true }
  }),

  updateSupportedSystems: superAdminProcedure
    .input(UpdateSupportedSystemsSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new EmulatorsRepository(ctx.prisma)

      const emulator = await repository.byId(input.emulatorId)
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
