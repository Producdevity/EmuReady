import { ResourceError, AppError } from '@/lib/errors'
import {
  GetDevicesSchema,
  GetDeviceByIdSchema,
  CreateDeviceSchema,
  UpdateDeviceSchema,
  DeleteDeviceSchema,
} from '@/schemas/device'
import {
  createTRPCRouter,
  publicProcedure,
  manageDevicesProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import {
  calculateOffset,
  createPaginationResult,
  buildOrderBy,
} from '@/server/utils/pagination'
import type { Prisma } from '@orm'

export const devicesRouter = createTRPCRouter({
  get: publicProcedure.input(GetDevicesSchema).query(async ({ ctx, input }) => {
    const {
      search,
      brandId,
      socId,
      limit = 20,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = input ?? {}

    // Calculate actual offset based on page or use provided offset
    const actualOffset = calculateOffset({ page, offset }, limit)

    // Build where clause for filtering
    const where: Prisma.DeviceWhereInput = {
      ...(brandId ? { brandId } : {}),
      ...(socId ? { socId } : {}),
      ...(search
        ? {
            OR: [
              // Exact match for model name (highest priority)
              { modelName: { equals: search, mode: 'insensitive' } },
              // Exact match for brand name
              { brand: { name: { equals: search, mode: 'insensitive' } } },
              // Contains match for model name
              { modelName: { contains: search, mode: 'insensitive' } },
              // Contains match for brand name
              { brand: { name: { contains: search, mode: 'insensitive' } } },
              // SoC name search
              { soc: { name: { contains: search, mode: 'insensitive' } } },
              // SoC manufacturer search
              {
                soc: {
                  manufacturer: { contains: search, mode: 'insensitive' },
                },
              },
              // Brand + Model combination search (e.g., "Retroid Pocket 5")
              ...(search.includes(' ')
                ? [
                    {
                      AND: [
                        {
                          brand: {
                            name: {
                              contains: search.split(' ')[0],
                              mode: 'insensitive' as const,
                            },
                          },
                        },
                        {
                          modelName: {
                            contains: search.split(' ').slice(1).join(' '),
                            mode: 'insensitive' as const,
                          },
                        },
                      ],
                    },
                  ]
                : []),
            ],
          }
        : {}),
    }

    const sortConfig = {
      brand: (dir: 'asc' | 'desc') => ({ brand: { name: dir } }),
      modelName: (dir: 'asc' | 'desc') => ({ modelName: dir }),
      soc: (dir: 'asc' | 'desc') => ({ soc: { name: dir } }),
      listings: (dir: 'asc' | 'desc') => ({ listings: { _count: dir } }),
    }

    const orderBy = buildOrderBy<Prisma.DeviceOrderByWithRelationInput>(
      sortConfig,
      sortField,
      sortDirection,
      [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
    )

    const total = await ctx.prisma.device.count({ where })

    // Get devices with pagination
    const devices = await ctx.prisma.device.findMany({
      where,
      include: {
        brand: true,
        soc: true,
        _count: { select: { listings: true } },
      },
      orderBy,
      skip: actualOffset,
      take: limit,
    })

    return {
      devices,
      pagination: createPaginationResult(
        total,
        { page, offset },
        limit,
        actualOffset,
      ),
    }
  }),

  byId: publicProcedure
    .input(GetDeviceByIdSchema)
    .query(async ({ ctx, input }) => {
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.id },
        include: {
          brand: true,
          soc: true,
          _count: { select: { listings: true } },
        },
      })

      return device ?? ResourceError.device.notFound()
    }),

  create: manageDevicesProcedure
    .input(CreateDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) return ResourceError.deviceBrand.notFound()

      // Validate SoC if provided
      if (input.socId) {
        const soc = await ctx.prisma.soC.findUnique({
          where: { id: input.socId },
        })

        if (!soc) return AppError.notFound('SoC')
      }

      const existingDevice = await ctx.prisma.device.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
        },
      })

      if (existingDevice) {
        return ResourceError.device.alreadyExists(input.modelName)
      }

      return ctx.prisma.device.create({
        data: input,
        include: {
          brand: true,
          soc: true,
          _count: { select: { listings: true } },
        },
      })
    }),

  update: manageDevicesProcedure
    .input(UpdateDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const device = await ctx.prisma.device.findUnique({
        where: { id },
      })

      if (!device) return ResourceError.device.notFound()

      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) return ResourceError.deviceBrand.notFound()

      // Validate SoC if provided
      if (input.socId) {
        const soc = await ctx.prisma.soC.findUnique({
          where: { id: input.socId },
        })

        if (!soc) return AppError.notFound('SoC')
      }

      const existingDevice = await ctx.prisma.device.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
          id: { not: id },
        },
      })

      if (existingDevice) {
        return ResourceError.device.alreadyExists(input.modelName)
      }

      return ctx.prisma.device.update({
        where: { id },
        data,
        include: {
          brand: true,
          soc: true,
          _count: { select: { listings: true } },
        },
      })
    }),

  delete: manageDevicesProcedure
    .input(DeleteDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      const existingDevice = await ctx.prisma.device.findUnique({
        where: { id: input.id },
        include: { _count: { select: { listings: true } } },
      })

      if (!existingDevice) return ResourceError.device.notFound()

      if (existingDevice._count.listings > 0) {
        return AppError.conflict(
          `Cannot delete device "${existingDevice.modelName}" because it has ${existingDevice._count.listings} active listing(s). Please remove all listings for this device first.`,
        )
      }

      return ctx.prisma.device.delete({ where: { id: input.id } })
    }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [total, withListings, withoutListings] = await Promise.all([
      ctx.prisma.device.count(),
      ctx.prisma.device.count({ where: { listings: { some: {} } } }),
      ctx.prisma.device.count({ where: { listings: { none: {} } } }),
    ])

    return {
      total,
      withListings,
      withoutListings,
    }
  }),
})
