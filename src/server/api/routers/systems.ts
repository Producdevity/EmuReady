import { ResourceError } from '@/lib/errors'
import {
  GetSystemsSchema,
  GetSystemByIdSchema,
  CreateSystemSchema,
  UpdateSystemSchema,
  DeleteSystemSchema,
} from '@/schemas/system'
import { createTRPCRouter, publicProcedure, permissionProcedure } from '@/server/api/trpc'
import { SystemsRepository } from '@/server/repositories/systems.repository'
import { PERMISSIONS } from '@/utils/permission-system'

export const systemsRouter = createTRPCRouter({
  get: publicProcedure.input(GetSystemsSchema).query(async ({ ctx, input }) => {
    const repository = new SystemsRepository(ctx.prisma)
    return repository.get(input ?? {})
  }),

  byId: publicProcedure.input(GetSystemByIdSchema).query(async ({ ctx, input }) => {
    const repository = new SystemsRepository(ctx.prisma)
    const system = await repository.byId(input.id)
    return system ?? ResourceError.system.notFound()
  }),

  create: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(CreateSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new SystemsRepository(ctx.prisma)
      const existing = await repository.byName(input.name)
      if (existing) return ResourceError.system.alreadyExists(input.name)
      return repository.create(input)
    }),

  update: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(UpdateSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, name } = input
      const repository = new SystemsRepository(ctx.prisma)

      const system = await repository.byId(id)
      if (!system) return ResourceError.system.notFound()

      if (name !== system.name) {
        const existing = await repository.byName(name)
        if (existing) return ResourceError.system.alreadyExists(name)
      }

      return repository.update(id, { name, key: input.key })
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(DeleteSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new SystemsRepository(ctx.prisma)
      // Check if system has games
      const gamesCount = await ctx.prisma.game.count({ where: { systemId: input.id } })

      if (gamesCount > 0) return ResourceError.system.hasGames(gamesCount)

      return repository.delete(input.id)
    }),

  stats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const repository = new SystemsRepository(ctx.prisma)
    return repository.getStats()
  }),
})
