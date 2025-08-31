import { ResourceError } from '@/lib/errors'
import {
  GetSoCsSchema,
  GetSoCByIdSchema,
  CreateSoCSchema,
  UpdateSoCSchema,
  DeleteSoCSchema,
} from '@/schemas/soc'
import {
  createTRPCRouter,
  publicProcedure,
  manageDevicesProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { SoCsRepository } from '@/server/repositories/socs.repository'
import { paginate } from '@/server/utils/pagination'
import { batchQueries } from '@/server/utils/query-performance'

export const socsRouter = createTRPCRouter({
  get: publicProcedure.input(GetSoCsSchema).query(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    const { limit = 20, offset = 0, page } = input ?? {}

    // Calculate actual offset based on page or use provided offset
    const actualOffset = page ? (page - 1) * limit : (offset ?? 0)

    const [total, socs] = await Promise.all([
      repository.count(input ?? {}),
      repository.list({ ...input, limit, offset: actualOffset }),
    ])

    const pagination = paginate({
      total: total,
      page: page ?? Math.floor(actualOffset / limit) + 1,
      limit: limit,
    })

    return {
      socs,
      pagination,
    }
  }),

  byId: publicProcedure.input(GetSoCByIdSchema).query(async ({ ctx, input }) => {
    const repository = new SoCsRepository(ctx.prisma)
    const soc = await repository.byId(input.id)
    return soc ?? ResourceError.soc.notFound()
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
    const [withDevices, withoutDevices] = await batchQueries([
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
