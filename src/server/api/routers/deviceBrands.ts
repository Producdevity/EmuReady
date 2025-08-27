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
  manageDevicesProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { DeviceBrandsRepository } from '@/server/repositories/device-brands.repository'

export const deviceBrandsRouter = createTRPCRouter({
  get: publicProcedure.input(GetDeviceBrandsSchema).query(async ({ ctx, input }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    return repository.list(input ?? {})
  }),

  byId: publicProcedure.input(GetDeviceBrandByIdSchema).query(async ({ ctx, input }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    const brand = await repository.byId(input.id)
    return brand || ResourceError.deviceBrand.notFound()
  }),

  create: manageDevicesProcedure.input(CreateDeviceBrandSchema).mutation(async ({ ctx, input }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    return repository.create(input)
  }),

  update: manageDevicesProcedure.input(UpdateDeviceBrandSchema).mutation(async ({ ctx, input }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    const { id, ...data } = input
    return repository.update(id, data)
  }),

  delete: manageDevicesProcedure.input(DeleteDeviceBrandSchema).mutation(async ({ ctx, input }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    await repository.delete(input.id)
    return { success: true }
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    return repository.stats()
  }),
})
