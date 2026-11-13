import { ResourceError } from '@/lib/errors'
import {
  GetPerformanceScalesSchema,
  GetPerformanceScaleByIdSchema,
  CreatePerformanceScaleSchema,
  UpdatePerformanceScaleSchema,
  DeletePerformanceScaleSchema,
} from '@/schemas/performanceScale'
import {
  createTRPCRouter,
  publicProcedure,
  manageSystemsProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { PerformanceScalesRepository } from '@/server/repositories/performance-scales.repository'

export const performanceScalesRouter = createTRPCRouter({
  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    return repository.stats()
  }),

  get: publicProcedure.input(GetPerformanceScalesSchema).query(async ({ ctx, input }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    return repository.list(input ?? {})
  }),

  getWithCounts: publicProcedure.input(GetPerformanceScalesSchema).query(async ({ ctx, input }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    return repository.listWithCounts(input ?? {})
  }),

  byId: publicProcedure.input(GetPerformanceScaleByIdSchema).query(async ({ ctx, input }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    const scale = await repository.byNumericId(input.id)
    return scale ? scale : ResourceError.performanceScale.notFound()
  }),

  create: manageSystemsProcedure
    .input(CreatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PerformanceScalesRepository(ctx.prisma)
      return repository.create(input)
    }),

  update: manageSystemsProcedure
    .input(UpdatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PerformanceScalesRepository(ctx.prisma)
      const { id, ...data } = input
      return repository.updateByNumericId(id, data)
    }),

  delete: manageSystemsProcedure
    .input(DeletePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PerformanceScalesRepository(ctx.prisma)
      await repository.deleteByNumericIdWithReplacement(input.id, input.replacementId)
      return { success: true }
    }),
})
