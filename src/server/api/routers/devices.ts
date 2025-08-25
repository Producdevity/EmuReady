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
import { DevicesRepository } from '@/server/repositories/devices.repository'

export const devicesRouter = createTRPCRouter({
  get: publicProcedure.input(GetDevicesSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return repository.getPaginated(input ?? {})
  }),

  byId: publicProcedure.input(GetDeviceByIdSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    const device = await repository.byIdWithCounts(input.id)
    return device ?? ResourceError.device.notFound()
  }),

  create: manageDevicesProcedure.input(CreateDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)

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

    const exists = await repository.existsByModelAndBrand(input.modelName, input.brandId)
    if (exists) {
      return ResourceError.device.alreadyExists(input.modelName)
    }

    // Create and then fetch with counts for web
    const created = await repository.create(input)
    return repository.byIdWithCounts(created.id)
  }),

  update: manageDevicesProcedure.input(UpdateDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    const { id, ...data } = input

    const device = await repository.byId(id)
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

    const exists = await repository.existsByModelAndBrand(input.modelName, input.brandId)
    if (exists) {
      return ResourceError.device.alreadyExists(input.modelName)
    }

    // Update and then fetch with counts for web
    const updated = await repository.update(id, data)
    return repository.byIdWithCounts(updated.id)
  }),

  delete: manageDevicesProcedure.input(DeleteDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)

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

    await repository.delete(input.id)
    return existingDevice // Return the deleted device
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
