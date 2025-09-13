import { ResourceError } from '@/lib/errors'
import {
  CreateCpuSchema,
  DeleteCpuSchema,
  GetCpuByIdSchema,
  GetCpusByIdsSchema,
  GetCpusSchema,
  UpdateCpuSchema,
} from '@/schemas/cpu'
import {
  createTRPCRouter,
  manageDevicesProcedure,
  publicProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { CpusRepository } from '@/server/repositories/cpus.repository'

export const cpusRouter = createTRPCRouter({
  get: publicProcedure.input(GetCpusSchema).query(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    return repository.list(input ?? {})
  }),

  byId: publicProcedure.input(GetCpuByIdSchema).query(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    const cpu = await repository.byIdWithCounts(input.id)
    return cpu ?? ResourceError.cpu.notFound()
  }),

  getByIds: publicProcedure.input(GetCpusByIdsSchema).query(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    return await repository.listByIds(input.ids)
  }),

  create: manageDevicesProcedure.input(CreateCpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    const created = await repository.create(input)
    return repository.byIdWithCounts(created.id)
  }),

  update: manageDevicesProcedure.input(UpdateCpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    const { id, ...data } = input

    const updated = await repository.update(id, data)
    return repository.byIdWithCounts(updated.id)
  }),

  delete: manageDevicesProcedure.input(DeleteCpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    await repository.delete(input.id)
    return { success: true }
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [withListings, withoutListings] = await Promise.all([
      ctx.prisma.cpu.count({ where: { pcListings: { some: {} } } }),
      ctx.prisma.cpu.count({ where: { pcListings: { none: {} } } }),
    ])

    return {
      total: withListings + withoutListings,
      withListings,
      withoutListings,
    }
  }),
})
