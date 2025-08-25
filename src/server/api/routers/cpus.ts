import { ResourceError } from '@/lib/errors'
import {
  GetCpusSchema,
  GetCpuByIdSchema,
  CreateCpuSchema,
  UpdateCpuSchema,
  DeleteCpuSchema,
} from '@/schemas/cpu'
import {
  createTRPCRouter,
  publicProcedure,
  manageDevicesProcedure,
  viewStatisticsProcedure,
} from '@/server/api/trpc'
import { CpusRepository } from '@/server/repositories/cpus.repository'
import { DeviceBrandsRepository } from '@/server/repositories/device-brands.repository'

export const cpusRouter = createTRPCRouter({
  get: publicProcedure.input(GetCpusSchema).query(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    return repository.getPaginated(input ?? {})
  }),

  byId: publicProcedure.input(GetCpuByIdSchema).query(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)
    const cpu = await repository.byIdWithCounts(input.id)
    return cpu ?? ResourceError.cpu.notFound()
  }),

  create: manageDevicesProcedure.input(CreateCpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)

    const brand = await ctx.prisma.deviceBrand.findUnique({
      where: { id: input.brandId },
    })

    if (!brand) return ResourceError.deviceBrand.notFound()

    const exists = await repository.existsByModelName(input.modelName)
    if (exists) return ResourceError.cpu.alreadyExists(input.modelName)

    // Create and then fetch with counts for web
    const created = await repository.create(input)
    return repository.byIdWithCounts(created.id)
  }),

  update: manageDevicesProcedure.input(UpdateCpuSchema).mutation(async ({ ctx, input }) => {
    const cpusRepository = new CpusRepository(ctx.prisma)
    const deviceBrandsRepository = new DeviceBrandsRepository(ctx.prisma)
    const { id, ...data } = input

    const cpu = await cpusRepository.byId(id)
    if (!cpu) return ResourceError.cpu.notFound()

    const brand = await deviceBrandsRepository.byId(input.brandId)

    if (!brand) return ResourceError.deviceBrand.notFound()

    const exists = await cpusRepository.existsByModelName(input.modelName, id)
    if (exists) return ResourceError.cpu.alreadyExists(input.modelName)

    const updated = await cpusRepository.update(id, data)
    return cpusRepository.byIdWithCounts(updated.id)
  }),

  delete: manageDevicesProcedure.input(DeleteCpuSchema).mutation(async ({ ctx, input }) => {
    const repository = new CpusRepository(ctx.prisma)

    const existingCpu = await ctx.prisma.cpu.findUnique({
      where: { id: input.id },
      include: { _count: { select: { pcListings: true } } },
    })

    if (!existingCpu) return ResourceError.cpu.notFound()

    if (existingCpu._count.pcListings > 0) {
      return ResourceError.cpu.inUse(existingCpu._count.pcListings)
    }

    await repository.delete(input.id)
    return existingCpu // Return the deleted CPU
  }),

  stats: viewStatisticsProcedure.query(async ({ ctx }) => {
    const [withListings, withoutListings] = await Promise.all([
      ctx.prisma.cpu.count({ where: { pcListings: { some: {} } } }),
      ctx.prisma.cpu.count({ where: { pcListings: { none: {} } } }),
    ])

    return {
      total: withListings + withoutListings,
      withListings,
      withoutListings,
    }
  }),
})
