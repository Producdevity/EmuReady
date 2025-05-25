import {
  createTRPCRouter,
  publicProcedure,
  adminProcedure,
} from '@/server/api/trpc'
import { ResourceError } from '@/lib/errors'
import {
  GetDevicesSchema,
  GetDeviceByIdSchema,
  CreateDeviceSchema,
  UpdateDeviceSchema,
  DeleteDeviceSchema,
} from '@/schemas/device'

export const devicesRouter = createTRPCRouter({
  get: publicProcedure.input(GetDevicesSchema).query(async ({ ctx, input }) => {
    const { search, brandId, limit } = input ?? {}

    return ctx.prisma.device.findMany({
      where: {
        ...(brandId ? { brandId } : {}),
        ...(search
          ? {
              OR: [
                { modelName: { contains: search, mode: 'insensitive' } },
                { brand: { name: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      include: { brand: true },
      take: limit,
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
    })
  }),

  byId: publicProcedure
    .input(GetDeviceByIdSchema)
    .query(async ({ ctx, input }) => {
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.id },
        include: {
          brand: true,
        },
      })

      if (!device) {
        ResourceError.device.notFound()
      }

      return device
    }),

  create: adminProcedure
    .input(CreateDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) ResourceError.deviceBrand.notFound()

      const existingDevice = await ctx.prisma.device.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
        },
      })

      if (existingDevice) ResourceError.device.alreadyExists(input.modelName)

      return ctx.prisma.device.create({ data: input, include: { brand: true } })
    }),

  update: adminProcedure
    .input(UpdateDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const device = await ctx.prisma.device.findUnique({
        where: { id },
      })

      if (!device) ResourceError.device.notFound()

      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) ResourceError.deviceBrand.notFound()

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

      if (existingDevice) ResourceError.device.alreadyExists(input.modelName)

      return ctx.prisma.device.update({
        where: { id },
        data,
        include: { brand: true },
      })
    }),

  delete: adminProcedure
    .input(DeleteDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if device is used in any listings
      const listingsCount = await ctx.prisma.listing.count({
        where: { deviceId: input.id },
      })

      if (listingsCount > 0) ResourceError.device.inUse(listingsCount)

      return ctx.prisma.device.delete({ where: { id: input.id } })
    }),
})
