import { ResourceError } from '@/lib/errors'
import {
  GetPerformanceScalesSchema,
  GetPerformanceScaleByIdSchema,
  CreatePerformanceScaleSchema,
  UpdatePerformanceScaleSchema,
  DeletePerformanceScaleSchema,
} from '@/schemas/performanceScale'
import { createTRPCRouter, publicProcedure, permissionProcedure } from '@/server/api/trpc'
import { PerformanceScalesRepository } from '@/server/repositories/performance-scales.repository'
import { PERMISSIONS } from '@/utils/permission-system'

export const performanceScalesRouter = createTRPCRouter({
  getStats: permissionProcedure(PERMISSIONS.VIEW_STATISTICS).query(async ({ ctx }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    return repository.stats()
  }),

  get: publicProcedure.input(GetPerformanceScalesSchema).query(async ({ ctx, input }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    return repository.list(input ?? {})
  }),

  byId: publicProcedure.input(GetPerformanceScaleByIdSchema).query(async ({ ctx, input }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    const scale = await repository.byNumericId(input.id)
    return scale ? scale : ResourceError.performanceScale.notFound()
  }),

  create: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(CreatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PerformanceScalesRepository(ctx.prisma)
      return repository.create(input)
    }),

  update: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(UpdatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PerformanceScalesRepository(ctx.prisma)
      const { id, ...data } = input
      return repository.updateByNumericId(id, data)
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(DeletePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PerformanceScalesRepository(ctx.prisma)
      await repository.deleteByNumericId(input.id)
      return { success: true }
    }),
})
