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
    return repository.getStats()
  }),

  get: publicProcedure.input(GetPerformanceScalesSchema).query(async ({ ctx, input }) => {
    const repository = new PerformanceScalesRepository(ctx.prisma)
    return repository.get(input ?? {})
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

      const existingByLabel = await repository.byLabel(input.label)
      if (existingByLabel) return ResourceError.performanceScale.labelExists(input.label)

      const existingByRank = await repository.byRank(input.rank)
      if (existingByRank) return ResourceError.performanceScale.rankExists(input.rank)

      return repository.create(input)
    }),

  update: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(UpdatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const repository = new PerformanceScalesRepository(ctx.prisma)

      const scale = await repository.byNumericId(id)
      if (!scale) return ResourceError.performanceScale.notFound()

      if (input.label && input.label !== scale.label) {
        const existingByLabel = await repository.byLabel(input.label)
        if (existingByLabel && existingByLabel.id !== id) {
          return ResourceError.performanceScale.labelExists(input.label)
        }
      }

      if (input.rank && input.rank !== scale.rank) {
        const existingByRank = await repository.byRank(input.rank)
        if (existingByRank && existingByRank.id !== id) {
          return ResourceError.performanceScale.rankExists(input.rank)
        }
      }

      return repository.updateByNumericId(id, data)
    }),

  delete: permissionProcedure(PERMISSIONS.MANAGE_SYSTEMS)
    .input(DeletePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const repository = new PerformanceScalesRepository(ctx.prisma)

      const [listingsCount, pcListingsCount] = await Promise.all([
        ctx.prisma.listing.count({ where: { performanceId: input.id } }),
        ctx.prisma.pcListing.count({ where: { performanceId: input.id } }),
      ])

      const totalCount = listingsCount + pcListingsCount
      if (totalCount > 0) return ResourceError.performanceScale.inUse(totalCount)

      await repository.deleteByNumericId(input.id)
      return { success: true }
    }),
})
