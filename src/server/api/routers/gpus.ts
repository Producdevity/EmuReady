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
  moderatorProcedure,
} from '@/server/api/trpc'
import type { Prisma } from '@orm'

export const gpusRouter = createTRPCRouter({
  get: publicProcedure.input(GetGpusSchema).query(async ({ ctx, input }) => {
    const {
      search,
      brandId,
      limit = 20,
      offset = 0,
      page,
      sortField,
      sortDirection,
    } = input ?? {}

    // Calculate actual offset based on page or use provided offset
    const actualOffset = page ? (page - 1) * limit : offset

    // Build where clause for filtering
    const where: Prisma.GpuWhereInput = {
      ...(brandId ? { brandId } : {}),
      ...(search
        ? {
            OR: [
              // Exact match for model name (highest priority)
              { modelName: { equals: search, mode: 'insensitive' } },
              // Exact match for brand name
              { brand: { name: { equals: search, mode: 'insensitive' } } },
              // Contains match for model name
              { modelName: { contains: search, mode: 'insensitive' } },
              // Contains match for brand name
              { brand: { name: { contains: search, mode: 'insensitive' } } },
              // Brand + Model combination search (e.g., "NVIDIA RTX 4090")
              ...(search.includes(' ')
                ? [
                    {
                      AND: [
                        {
                          brand: {
                            name: {
                              contains: search.split(' ')[0],
                              mode: 'insensitive' as const,
                            },
                          },
                        },
                        {
                          modelName: {
                            contains: search.split(' ').slice(1).join(' '),
                            mode: 'insensitive' as const,
                          },
                        },
                      ],
                    },
                  ]
                : []),
            ],
          }
        : {}),
    }

    // Build orderBy based on sortField and sortDirection
    const orderBy: Prisma.GpuOrderByWithRelationInput[] = []

    if (sortField && sortDirection) {
      switch (sortField) {
        case 'brand':
          orderBy.push({ brand: { name: sortDirection } })
          break
        case 'modelName':
          orderBy.push({ modelName: sortDirection })
          break
      }
    }

    // Default ordering if no sort specified - prioritize exact matches when searching
    if (!orderBy.length) {
      orderBy.push({ brand: { name: 'asc' } }, { modelName: 'asc' })
    }

    const total = await ctx.prisma.gpu.count({ where })

    // Get GPUs with pagination
    const gpus = await ctx.prisma.gpu.findMany({
      where,
      include: {
        brand: true,
        _count: { select: { pcListings: true } },
      },
      orderBy,
      skip: actualOffset,
      take: limit,
    })

    return {
      gpus,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: page ?? Math.floor(actualOffset / limit) + 1,
        offset: actualOffset,
        limit: limit,
      },
    }
  }),

  byId: publicProcedure
    .input(GetGpuByIdSchema)
    .query(async ({ ctx, input }) => {
      const gpu = await ctx.prisma.gpu.findUnique({
        where: { id: input.id },
        include: {
          brand: true,
          _count: { select: { pcListings: true } },
        },
      })

      return gpu ?? ResourceError.gpu.notFound()
    }),

  create: moderatorProcedure
    .input(CreateGpuSchema)
    .mutation(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) return ResourceError.deviceBrand.notFound()

      const existingGpu = await ctx.prisma.gpu.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
        },
      })

      if (existingGpu) {
        return ResourceError.gpu.alreadyExists(input.modelName)
      }

      return ctx.prisma.gpu.create({
        data: input,
        include: {
          brand: true,
          _count: { select: { pcListings: true } },
        },
      })
    }),

  update: moderatorProcedure
    .input(UpdateGpuSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const gpu = await ctx.prisma.gpu.findUnique({
        where: { id },
      })

      if (!gpu) return ResourceError.gpu.notFound()

      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) return ResourceError.deviceBrand.notFound()

      const existingGpu = await ctx.prisma.gpu.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
          id: { not: id },
        },
      })

      if (existingGpu) {
        return ResourceError.gpu.alreadyExists(input.modelName)
      }

      return ctx.prisma.gpu.update({
        where: { id },
        data,
        include: {
          brand: true,
          _count: { select: { pcListings: true } },
        },
      })
    }),

  delete: moderatorProcedure
    .input(DeleteGpuSchema)
    .mutation(async ({ ctx, input }) => {
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

      return ctx.prisma.gpu.delete({ where: { id: input.id } })
    }),

  stats: moderatorProcedure.query(async ({ ctx }) => {
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
