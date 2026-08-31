import { ResourceError } from '@/lib/errors'
import {
  CreateSoCSchema,
  DeleteSoCSchema,
  GetSoCByIdSchema,
  GetSoCOptionsSchema,
  GetSoCsSchema,
  UpdateSoCSchema,
  GetSoCsByIdsSchema,
} from '@/schemas/soc'
import {
  createTRPCRouter,
  manageDevicesProcedure,
  publicProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { SoCsRepository } from '@/server/repositories/socs.repository'

export const socsRouter = createTRPCRouter({
  get: publicProcedure.input(GetSoCsSchema).query(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    return repository.list(input ?? {})
  }),

  options: publicProcedure.input(GetSoCOptionsSchema).query(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    return repository.options(input ?? {})
  }),

  byId: publicProcedure.input(GetSoCByIdSchema).query(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    const soc = await repository.byId(input.id)
    return soc ?? ResourceError.soc.notFound()
  }),

  getByIds: publicProcedure.input(GetSoCsByIdsSchema).query(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    return await repository.listByIds(input.ids)
  }),

  create: manageDevicesProcedure.input(CreateSoCSchema).mutation(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    return repository.create(input)
  }),

  update: manageDevicesProcedure.input(UpdateSoCSchema).mutation(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    const { id, ...updateData } = input
    return repository.update(id, updateData)
  }),

  delete: manageDevicesProcedure.input(DeleteSoCSchema).mutation(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    await repository.delete(input.id)
    return { success: true }
  }),

  getManufacturers: publicProcedure.query(async ({ ctx }) => {
    const repository = new SoCsRepository(ctx.prisma)
    return repository.listManufacturers()
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [withDevices, withoutDevices] = await Promise.all([
      ctx.prisma.soC.count({ where: { devices: { some: {} } } }),
      ctx.prisma.soC.count({ where: { devices: { none: {} } } }),
    ])

    return {
      total: withDevices + withoutDevices,
      withDevices,
      withoutDevices,
    }
  }),
})
