import { z } from 'zod'
import { TRPCError } from '@trpc/server'

import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from '@/server/api/trpc'

export const devicesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          brandId: z.string().optional(),
          limit: z.number().default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { search, brandId, limit } = input ?? {}

      return ctx.prisma.device.findMany({
        where: {
          ...(brandId ? { brandId } : {}),
          ...(search
            ? {
                OR: [
                  { modelName: { contains: search, mode: 'insensitive' } },
                  {
                    brand: { name: { contains: search, mode: 'insensitive' } },
                  },
                ],
              }
            : {}),
        },
        include: {
          brand: true,
        },
        take: limit,
        orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
      })
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.id },
        include: {
          brand: true,
        },
      })

      if (!device) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device not found',
        })
      }

      return device
    }),

  create: adminProcedure
    .input(
      z.object({
        brandId: z.string().uuid(),
        modelName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device brand not found',
        })
      }

      // Check if a device with the same brand and model already exists
      const existingDevice = await ctx.prisma.device.findFirst({
        where: {
          brandId: input.brandId,
          modelName: {
            equals: input.modelName,
            mode: 'insensitive',
          },
        },
      })

      if (existingDevice) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `A device with model name "${input.modelName}" already exists for this brand`,
        })
      }

      return ctx.prisma.device.create({
        data: input,
        include: {
          brand: true,
        },
      })
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        brandId: z.string(),
        modelName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const device = await ctx.prisma.device.findUnique({
        where: { id },
      })

      if (!device) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device not found',
        })
      }

      // Check if the brand exists
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device brand not found',
        })
      }

      // Check if another device with the same brand and model already exists
      const existingDevice = await ctx.prisma.device.findFirst({
        where: {
          brandId: input.brandId,
          modelName: {
            equals: input.modelName,
            mode: 'insensitive',
          },
          id: { not: id },
        },
      })

      if (existingDevice) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `A device with model name "${input.modelName}" already exists for this brand`,
        })
      }

      return ctx.prisma.device.update({
        where: { id },
        data,
        include: {
          brand: true,
        },
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if device is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { deviceId: input.id },
      })

      if (listingsCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete device that is used in ${listingsCount} listings`,
        })
      }

      return ctx.prisma.device.delete({
        where: { id: input.id },
      })
    }),
})
