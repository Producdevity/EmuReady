import { ResourceError } from '@/lib/errors'
import {
  CreateDeviceSchema,
  DeleteDeviceSchema,
  GetDeviceByIdSchema,
  GetDevicesByIdsSchema,
  GetDevicesSchema,
  UpdateDeviceSchema,
} from '@/schemas/device'
import {
  createTRPCRouter,
  manageDevicesProcedure,
  publicProcedure,
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

  getByIds: publicProcedure.input(GetDevicesByIdsSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return await repository.listByIds(input.ids)
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
