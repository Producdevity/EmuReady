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
    return repository.list(input ?? {})
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
      return repository.create(input)
    }),

  update: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(UpdateSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new SystemsRepository(ctx.prisma)
      const { id, ...data } = input
      return repository.update(id, data)
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(DeleteSystemSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new SystemsRepository(ctx.prisma)
      await repository.delete(input.id)
      return { success: true }
    }),

  stats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const repository = new SystemsRepository(ctx.prisma)
    return repository.stats()
  }),
})
