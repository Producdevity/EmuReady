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
  manageDevicesProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { DevicesRepository } from '@/server/repositories/devices.repository'

export const devicesRouter = createTRPCRouter({
  get: publicProcedure.input(GetDevicesSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return repository.list(input ?? {})
  }),

  byId: publicProcedure.input(GetDeviceByIdSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    const device = await repository.byIdWithCounts(input.id)
    return device ?? ResourceError.device.notFound()
  }),

  create: manageDevicesProcedure.input(CreateDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)

    // Repository handles all validation (brand exists, SoC exists, no duplicates)
    const created = await repository.create(input)
    return repository.byIdWithCounts(created.id)
  }),

  update: manageDevicesProcedure.input(UpdateDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    const { id, ...data } = input

    // Repository handles all validation (device exists, brand exists, SoC exists, no duplicates)
    const updated = await repository.update(id, data)
    return repository.byIdWithCounts(updated.id)
  }),

  delete: manageDevicesProcedure.input(DeleteDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)

    // Get device before deletion to return it
    const existingDevice = await repository.byIdWithCounts(input.id)
    if (!existingDevice) return ResourceError.device.notFound()

    // Repository handles validation (device exists, not in use)
    await repository.delete(input.id)
    return existingDevice // Return the deleted device
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return repository.stats()
  }),
})
