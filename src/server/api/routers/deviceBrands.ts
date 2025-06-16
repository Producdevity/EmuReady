import { ResourceError } from '@/lib/errors'
import {
  GetDeviceBrandsSchema,
  GetDeviceBrandByIdSchema,
  CreateDeviceBrandSchema,
  UpdateDeviceBrandSchema,
  DeleteDeviceBrandSchema,
} from '@/schemas/deviceBrand'
import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from '@/server/api/trpc'
import type { Prisma } from '@orm'

export const deviceBrandsRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetDeviceBrandsSchema)
    .query(async ({ ctx, input }) => {
      const { search, limit, sortField, sortDirection } = input ?? {}

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.DeviceBrandOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'name':
            orderBy.push({ name: sortDirection })
            break
          case 'devicesCount':
            orderBy.push({ devices: { _count: sortDirection } })
            break
        }
      }

      // Default ordering if no sort specified
      if (!orderBy.length) {
        orderBy.push({ name: 'asc' })
      }

      return ctx.prisma.deviceBrand.findMany({
        where: search
          ? { name: { contains: search, mode: 'insensitive' } }
          : undefined,
        include: {
          _count: {
            select: {
              devices: true,
            },
          },
        },
        take: limit,
        orderBy,
      })
    }),

  byId: publicProcedure
    .input(GetDeviceBrandByIdSchema)
    .query(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.id },
      })

      if (!brand) {
        ResourceError.deviceBrand.notFound()
      }

      return brand
    }),

  create: adminProcedure
    .input(CreateDeviceBrandSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if brand with the same name already exists
      const existingBrand = await ctx.prisma.deviceBrand.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
        },
      })

      if (existingBrand) {
        ResourceError.deviceBrand.alreadyExists(input.name)
      }

      return ctx.prisma.deviceBrand.create({
        data: input,
      })
    }),

  update: adminProcedure
    .input(UpdateDeviceBrandSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id },
      })

      if (!brand) {
        ResourceError.deviceBrand.notFound()
      }

      // Check if another brand with the same name already exists
      const existingBrand = await ctx.prisma.deviceBrand.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          id: { not: id },
        },
      })

      if (existingBrand) {
        ResourceError.deviceBrand.alreadyExists(input.name)
      }

      return ctx.prisma.deviceBrand.update({
        where: { id },
        data,
      })
    }),

  delete: adminProcedure
    .input(DeleteDeviceBrandSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if brand is used in any devices
      const devicesCount = await ctx.prisma.device.count({
        where: { brandId: input.id },
      })

      if (devicesCount > 0) {
        ResourceError.deviceBrand.inUse(devicesCount)
      }

      return ctx.prisma.deviceBrand.delete({
        where: { id: input.id },
      })
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const [total, withDevices, withoutDevices] = await Promise.all([
      ctx.prisma.deviceBrand.count(),
      ctx.prisma.deviceBrand.count({
        where: {
          devices: {
            some: {},
          },
        },
      }),
      ctx.prisma.deviceBrand.count({
        where: {
          devices: {
            none: {},
          },
        },
      }),
    ])

    return {
      total,
      withDevices,
      withoutDevices,
    }
  }),
})
