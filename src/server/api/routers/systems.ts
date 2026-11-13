import { ResourceError } from '@/lib/errors'
import {
  GetSystemsSchema,
  GetSystemByIdSchema,
  CreateSystemSchema,
  UpdateSystemSchema,
  DeleteSystemSchema,
} from '@/schemas/system'
import {
  createTRPCRouter,
  publicProcedure,
  manageSystemsProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { SystemsRepository } from '@/server/repositories/systems.repository'

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

  create: manageSystemsProcedure.input(CreateSystemSchema).mutation(async ({ ctx, input }) => {
    const repository = new SystemsRepository(ctx.prisma)
    return repository.create(input)
  }),

  update: manageSystemsProcedure.input(UpdateSystemSchema).mutation(async ({ ctx, input }) => {
    const repository = new SystemsRepository(ctx.prisma)
    const { id, ...data } = input
    return repository.update(id, data)
  }),

  delete: manageSystemsProcedure.input(DeleteSystemSchema).mutation(async ({ ctx, input }) => {
    const repository = new SystemsRepository(ctx.prisma)
    await repository.delete(input.id)
    return { success: true }
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const repository = new SystemsRepository(ctx.prisma)
    return repository.stats()
  }),
})
