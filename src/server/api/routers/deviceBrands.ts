import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from '@/server/api/trpc'

export const deviceBrandsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          limit: z.number().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { search, limit } = input ?? {}

      return ctx.prisma.deviceBrand.findMany({
        where: search
          ? {
              name: { contains: search, mode: 'insensitive' },
            }
          : undefined,
        take: limit,
        orderBy: [{ name: 'asc' }],
      })
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.id },
      })

      if (!brand) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device brand not found',
        })
      }

      return brand
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if brand with the same name already exists
      const existingBrand = await ctx.prisma.deviceBrand.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
        },
      })

      if (existingBrand) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Brand "${input.name}" already exists`,
        })
      }

      return ctx.prisma.deviceBrand.create({
        data: input,
      })
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id },
      })

      if (!brand) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device brand not found',
        })
      }

      // Check if another brand with the same name already exists
      const existingBrand = await ctx.prisma.deviceBrand.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          id: { not: id },
        },
      })

      if (existingBrand) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Brand "${input.name}" already exists`,
        })
      }

      return ctx.prisma.deviceBrand.update({
        where: { id },
        data,
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if brand is used in any devices
      const devicesCount = await ctx.prisma.device.count({
        where: { brandId: input.id },
      })

      if (devicesCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete brand that is used by ${devicesCount} devices`,
        })
      }

      return ctx.prisma.deviceBrand.delete({
        where: { id: input.id },
      })
    }),
})
