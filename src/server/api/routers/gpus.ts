import { ResourceError, AppError } from '@/lib/errors'
import {
  GetGpusSchema,
  GetGpuByIdSchema,
  CreateGpuSchema,
  UpdateGpuSchema,
  DeleteGpuSchema,
} from '@/schemas/gpu'
import {
  createTRPCRouter,
  publicProcedure,
  manageDevicesProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { GpusRepository } from '@/server/repositories/gpus.repository'

export const gpusRouter = createTRPCRouter({
  get: publicProcedure.input(GetGpusSchema).query(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)

    // For web, we need counts - use getWithListingCounts for pcListings sort
    if (input?.sortField === 'pcListings' && (input?.limit || 20) <= 100) {
      const gpus = await repository.getWithListingCounts(input.limit || 20)
      const total = await repository.count({ search: input.search, brandId: input.brandId })

      return {
        gpus,
        pagination: {
          total,
          pages: Math.ceil(total / (input.limit || 20)),
          page: input.page || 1,
          offset: input.offset || 0,
          limit: input.limit || 20,
        },
      }
    }

    // Regular paginated query
    return repository.getPaginated(input ?? {})
  }),

  byId: publicProcedure.input(GetGpuByIdSchema).query(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    const gpu = await repository.byIdWithCounts(input.id)
    return gpu ?? ResourceError.gpu.notFound()
  }),

  create: manageDevicesProcedure.input(CreateGpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)

    const brand = await ctx.prisma.deviceBrand.findUnique({
      where: { id: input.brandId },
    })

    if (!brand) return ResourceError.deviceBrand.notFound()

    const exists = await repository.existsByModelName(input.modelName)
    if (exists) {
      return ResourceError.gpu.alreadyExists(input.modelName)
    }

    // Create and then fetch with counts for web
    const created = await repository.create(input)
    return repository.byIdWithCounts(created.id)
  }),

  update: manageDevicesProcedure.input(UpdateGpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)
    const { id, ...data } = input

    const gpu = await repository.byId(id)
    if (!gpu) return ResourceError.gpu.notFound()

    const brand = await ctx.prisma.deviceBrand.findUnique({
      where: { id: input.brandId },
    })

    if (!brand) return ResourceError.deviceBrand.notFound()

    const exists = await repository.existsByModelName(input.modelName, id)
    if (exists) {
      return ResourceError.gpu.alreadyExists(input.modelName)
    }

    // Update and then fetch with counts for web
    const updated = await repository.update(id, data)
    return repository.byIdWithCounts(updated.id)
  }),

  delete: manageDevicesProcedure.input(DeleteGpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new GpusRepository(ctx.prisma)

    const existingGpu = await ctx.prisma.gpu.findUnique({
      where: { id: input.id },
      include: { _count: { select: { pcListings: true } } },
    })

    if (!existingGpu) return ResourceError.gpu.notFound()

    if (existingGpu._count.pcListings > 0) {
      return AppError.conflict(
        `Cannot delete GPU "${existingGpu.modelName}" because it has ${existingGpu._count.pcListings} active PC listing(s). Please remove all PC listings for this GPU first.`,
      )
    }

    await repository.delete(input.id)
    return existingGpu // Return the deleted GPU
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [total, withListings, withoutListings] = await Promise.all([
      ctx.prisma.gpu.count(),
      ctx.prisma.gpu.count({ where: { pcListings: { some: {} } } }),
      ctx.prisma.gpu.count({ where: { pcListings: { none: {} } } }),
    ])

    return {
      total,
      withListings,
      withoutListings,
    }
  }),
})
