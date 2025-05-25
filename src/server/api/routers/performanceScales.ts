import { TRPCError } from '@trpc/server'

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from '@/server/api/trpc'
import {
  GetPerformanceScaleByIdSchema,
  CreatePerformanceScaleSchema,
  UpdatePerformanceScaleSchema,
  DeletePerformanceScaleSchema,
} from '@/schemas/performanceScale'

export const performanceScalesRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.performanceScale.findMany({
      orderBy: { rank: 'desc' },
    })
  }),

  byId: publicProcedure
    .input(GetPerformanceScaleByIdSchema)
    .query(async ({ ctx, input }) => {
      const scale = await ctx.prisma.performanceScale.findUnique({
        where: { id: input.id },
      })

      if (!scale) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Performance scale not found',
        })
      }

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
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A performance scale with label "${input.label}" already exists`,
          })
        }
        if (existingScale.rank === input.rank) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A performance scale with rank ${input.rank} already exists`,
          })
        }
      }

      return ctx.prisma.performanceScale.create({
        data: input,
      })
    }),

  update: adminProcedure
    .input(UpdatePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const scale = await ctx.prisma.performanceScale.findUnique({
        where: { id },
      })

      if (!scale) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Performance scale not found',
        })
      }

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
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A performance scale with label "${input.label}" already exists`,
          })
        }
        if (existingScale.rank === input.rank) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `A performance scale with rank ${input.rank} already exists`,
          })
        }
      }

      return ctx.prisma.performanceScale.update({
        where: { id },
        data,
      })
    }),

  delete: adminProcedure
    .input(DeletePerformanceScaleSchema)
    .mutation(async ({ ctx, input }) => {
      const listingsCount = await ctx.prisma.listing.count({
        where: { performanceId: input.id },
      })

      if (listingsCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete performance scale that is used in ${listingsCount} listings`,
        })
      }

      return ctx.prisma.performanceScale.delete({
        where: { id: input.id },
      })
    }),
})
