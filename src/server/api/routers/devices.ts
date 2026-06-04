import { ResourceError } from '@/lib/errors'
import {
  CreateDeviceSchema,
  DeleteDeviceSchema,
  GetDeviceByIdSchema,
  GetDeviceOptionsSchema,
  GetDevicesByIdsSchema,
  GetDevicesSchema,
  GetTrendingDevicesSummarySchema,
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

  options: publicProcedure.input(GetDeviceOptionsSchema).query(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return repository.options(input ?? {})
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
    return repository.create(input)
  }),

  update: manageDevicesProcedure.input(UpdateDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)
    const { id, ...data } = input

    // Repository handles all validation (device exists, brand exists, SoC exists, no duplicates)
    return repository.update(id, data)
  }),

  delete: manageDevicesProcedure.input(DeleteDeviceSchema).mutation(async ({ ctx, input }) => {
    const repository = new DevicesRepository(ctx.prisma)

    // Repository handles validation (device exists, not in use)
    return repository.delete(input.id)
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return repository.stats()
  }),

  trending: publicProcedure.query(async ({ ctx }) => {
    const repository = new DevicesRepository(ctx.prisma)
    return repository.getTrendingDevices()
  }),

  trendingSummary: publicProcedure
    .input(GetTrendingDevicesSummarySchema)
    .query(async ({ ctx, input }) => {
      const repository = new DevicesRepository(ctx.prisma)
      return repository.getTrendingDevicesSummary(input.limit)
    }),
})
