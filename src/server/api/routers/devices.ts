import { ResourceError } from '@/lib/errors'
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
  adminProcedure,
} from '@/server/api/trpc'
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
    const actualOffset = page ? (page - 1) * limit : offset
    const effectiveLimit = Math.min(limit, 100) // Cap at 100 items per page

    // Build where clause for filtering
    const where: Prisma.DeviceWhereInput = {
      ...(brandId ? { brandId } : {}),
      ...(socId ? { socId } : {}),
      ...(search
        ? {
            OR: [
              { modelName: { contains: search, mode: 'insensitive' } },
              { brand: { name: { contains: search, mode: 'insensitive' } } },
              { soc: { name: { contains: search, mode: 'insensitive' } } },
              {
                soc: {
                  manufacturer: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    }

    // Build orderBy based on sortField and sortDirection
    const orderBy: Prisma.DeviceOrderByWithRelationInput[] = []

    if (sortField && sortDirection) {
      switch (sortField) {
        case 'brand':
          orderBy.push({ brand: { name: sortDirection } })
          break
        case 'modelName':
          orderBy.push({ modelName: sortDirection })
          break
        case 'soc':
          orderBy.push({ soc: { name: sortDirection } })
          break
      }
    }

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ brand: { name: 'asc' } }, { modelName: 'asc' })
    }

    const total = await ctx.prisma.device.count({ where })

    // Get devices with pagination
    const devices = await ctx.prisma.device.findMany({
      where,
      include: { brand: true, soc: true },
      orderBy,
      skip: actualOffset,
      take: effectiveLimit,
    })

    return {
      devices,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: page ?? Math.floor(actualOffset / limit) + 1,
        offset: actualOffset,
        limit: effectiveLimit,
      },
    }
  }),

  byId: publicProcedure
    .input(GetDeviceByIdSchema)
    .query(async ({ ctx, input }) => {
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.id },
        include: { brand: true, soc: true },
      })

      return device ?? ResourceError.device.notFound()
    }),

  create: adminProcedure
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

        if (!soc) {
          throw new Error('SoC not found')
        }
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
        },
      })
    }),

  update: adminProcedure
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

        if (!soc) {
          throw new Error('SoC not found')
        }
      }

      const existingDevice = await ctx.prisma.device.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
          id: { not: id },
        },
      })

      if (existingDevice)
        return ResourceError.device.alreadyExists(input.modelName)

      return ctx.prisma.device.update({
        where: { id },
        data,
        include: { brand: true, soc: true },
      })
    }),

  delete: adminProcedure
    .input(DeleteDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if device is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { deviceId: input.id },
      })

      if (listingsCount > 0) return ResourceError.device.inUse(listingsCount)

      return ctx.prisma.device.delete({ where: { id: input.id } })
    }),
})
