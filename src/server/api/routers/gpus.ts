import { ResourceError } from '@/lib/errors'
import {
  CreateGpuSchema,
  DeleteGpuSchema,
  GetGpuByIdSchema,
  GetGpusByIdsSchema,
  GetGpusSchema,
  UpdateGpuSchema,
} from '@/schemas/gpu'
import {
  createTRPCRouter,
  manageDevicesProcedure,
  publicProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { GpusRepository } from '@/server/repositories/gpus.repository'

export const gpusRouter = createTRPCRouter({
  get: publicProcedure.input(GetGpusSchema).query(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    return repository.list(input ?? {})
  }),

  byId: publicProcedure.input(GetGpuByIdSchema).query(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    const gpu = await repository.byIdWithCounts(input.id)
    return gpu ?? ResourceError.gpu.notFound()
  }),

  getByIds: publicProcedure.input(GetGpusByIdsSchema).query(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    return await repository.listByIds(input.ids)
  }),

  create: manageDevicesProcedure.input(CreateGpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)

    const created = await repository.create(input)
    return repository.byIdWithCounts(created.id)
  }),

  update: manageDevicesProcedure.input(UpdateGpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    const { id, ...data } = input

    const updated = await repository.update(id, data)
    return repository.byIdWithCounts(updated.id)
  }),

  delete: manageDevicesProcedure.input(DeleteGpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    await repository.delete(input.id)
    return { success: true }
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [total, withListings, withoutListings] = await Promise.all([
      ctx.prisma.gpu.count(),
      ctx.prisma.gpu.count({ where: { pcListings: { some: {} } } }),
      ctx.prisma.gpu.count({ where: { pcListings: { none: {} } } }),
    ])

    return {
      total,
      withListings,
      withoutListings,
    }
  }),
})
