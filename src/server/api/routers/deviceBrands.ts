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
  moderatorProcedure,
} from '@/server/api/trpc'
import { buildSearchFilter } from '@/server/utils/query-builders'
import type { Prisma } from '@orm'

export const deviceBrandsRouter = createTRPCRouter({
  get: publicProcedure
    .input(GetDeviceBrandsSchema)
    .query(async ({ ctx, input }) => {
      const { search, limit, sortField, sortDirection } = input ?? {}

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

      const searchConditions = buildSearchFilter(search, ['name'])
      const where = searchConditions ? { OR: searchConditions } : undefined

      return ctx.prisma.deviceBrand.findMany({
        where,
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

      return brand || ResourceError.deviceBrand.notFound()
    }),

  create: moderatorProcedure
    .input(CreateDeviceBrandSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if brand with the same name already exists
      const existingBrand = await ctx.prisma.deviceBrand.findFirst({
        where: { name: { equals: input.name, mode: 'insensitive' } },
      })

      return existingBrand
        ? ResourceError.deviceBrand.alreadyExists(input.name)
        : ctx.prisma.deviceBrand.create({ data: input })
    }),

  update: moderatorProcedure
    .input(UpdateDeviceBrandSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const brand = await ctx.prisma.deviceBrand.findUnique({ where: { id } })

      if (!brand) return ResourceError.deviceBrand.notFound()

      // Check if another brand with the same name already exists
      const existingBrand = await ctx.prisma.deviceBrand.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          id: { not: id },
        },
      })

      return existingBrand
        ? ResourceError.deviceBrand.alreadyExists(input.name)
        : ctx.prisma.deviceBrand.update({ where: { id }, data })
    }),

  delete: adminProcedure
    .input(DeleteDeviceBrandSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if brand is used in any devices
      const devicesCount = await ctx.prisma.device.count({
        where: { brandId: input.id },
      })

      return devicesCount > 0
        ? ResourceError.deviceBrand.inUse(devicesCount)
        : ctx.prisma.deviceBrand.delete({ where: { id: input.id } })
    }),

  stats: moderatorProcedure.query(async ({ ctx }) => {
    const [withDevices, withoutDevices] = await Promise.all([
      ctx.prisma.deviceBrand.count({ where: { devices: { some: {} } } }),
      ctx.prisma.deviceBrand.count({ where: { devices: { none: {} } } }),
    ])

    return {
      total: withDevices + withoutDevices,
      withDevices,
      withoutDevices,
    }
  }),
})
