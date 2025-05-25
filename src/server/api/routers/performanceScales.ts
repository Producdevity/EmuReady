import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from '@/server/api/trpc'
import { ResourceError } from '@/lib/errors'
import {
  GetPerformanceScaleByIdSchema,
  CreatePerformanceScaleSchema,
  UpdatePerformanceScaleSchema,
  DeletePerformanceScaleSchema,
} from '@/schemas/performanceScale'

export const performanceScalesRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.performanceScale.findMany({ orderBy: { rank: 'desc' } })
  }),

  byId: publicProcedure
    .input(GetPerformanceScaleByIdSchema)
    .query(async ({ ctx, input }) => {
      const scale = await ctx.prisma.performanceScale.findUnique({
        where: { id: input.id },
      })

      if (!scale) ResourceError.performanceScale.notFound()

      return scale
    }),

  create: adminProcedure
    .input(CreatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const existingScale = await ctx.prisma.performanceScale.findFirst({
        where: {
          OR: [
            { label: { equals: input.label, mode: 'insensitive' } },
            { rank: input.rank },
          ],
        },
      })

      if (existingScale) {
        if (existingScale.label.toLowerCase() === input.label.toLowerCase()) {
          ResourceError.performanceScale.labelExists(input.label)
        }
        if (existingScale.rank === input.rank) {
          ResourceError.performanceScale.rankExists(input.rank)
        }
      }

      return ctx.prisma.performanceScale.create({ data: input })
    }),

  update: adminProcedure
    .input(UpdatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const scale = await ctx.prisma.performanceScale.findUnique({
        where: { id },
      })

      if (!scale) ResourceError.performanceScale.notFound()

      const existingScale = await ctx.prisma.performanceScale.findFirst({
        where: {
          OR: [
            { label: { equals: input.label, mode: 'insensitive' } },
            { rank: input.rank },
          ],
          id: { not: id },
        },
      })

      if (existingScale) {
        if (existingScale.label.toLowerCase() === input.label.toLowerCase()) {
          ResourceError.performanceScale.labelExists(input.label)
        }
        if (existingScale.rank === input.rank) {
          ResourceError.performanceScale.rankExists(input.rank)
        }
      }

      return ctx.prisma.performanceScale.update({ where: { id }, data })
    }),

  delete: adminProcedure
    .input(DeletePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const listingsCount = await ctx.prisma.listing.count({
        where: { performanceId: input.id },
      })

      if (listingsCount > 0) ResourceError.performanceScale.inUse(listingsCount)

      return ctx.prisma.performanceScale.delete({ where: { id: input.id } })
    }),
})
