import { ResourceError, AppError } from '@/lib/errors'
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
  moderatorProcedure,
  adminProcedure,
} from '@/server/api/trpc'
import type { Prisma } from '@orm'

export const cpusRouter = createTRPCRouter({
  get: publicProcedure.input(GetCpusSchema).query(async ({ ctx, input }) => {
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
    const mode: Prisma.QueryMode = 'insensitive'

    // Build where clause for filtering
    const where: Prisma.CpuWhereInput = {
      ...(brandId ? { brandId } : {}),
      ...(search
        ? {
            OR: [
              // Exact match for model name (highest priority)
              { modelName: { equals: search, mode } },
              // Exact match for brand name
              { brand: { name: { equals: search, mode } } },
              // Contains match for model name
              { modelName: { contains: search, mode } },
              // Contains match for brand name
              { brand: { name: { contains: search, mode } } },
              // Brand + Model combination search (e.g., "Intel Core i7")
              ...(search.includes(' ')
                ? [
                    {
                      AND: [
                        {
                          brand: {
                            name: {
                              contains: search.split(' ')[0],
                              mode,
                            },
                          },
                        },
                        {
                          modelName: {
                            contains: search.split(' ').slice(1).join(' '),
                            mode,
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
    const orderBy: Prisma.CpuOrderByWithRelationInput[] = []

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

    const total = await ctx.prisma.cpu.count({ where })

    // Get CPUs with pagination
    const cpus = await ctx.prisma.cpu.findMany({
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
      cpus,
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
    .input(GetCpuByIdSchema)
    .query(async ({ ctx, input }) => {
      const cpu = await ctx.prisma.cpu.findUnique({
        where: { id: input.id },
        include: { brand: true, _count: { select: { pcListings: true } } },
      })

      return cpu ?? ResourceError.cpu.notFound()
    }),

  create: moderatorProcedure
    .input(CreateCpuSchema)
    .mutation(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) return ResourceError.deviceBrand.notFound()

      const existingCpu = await ctx.prisma.cpu.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
        },
      })

      if (existingCpu) return ResourceError.cpu.alreadyExists(input.modelName)

      return ctx.prisma.cpu.create({
        data: input,
        include: { brand: true, _count: { select: { pcListings: true } } },
      })
    }),

  update: moderatorProcedure
    .input(UpdateCpuSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input

      const cpu = await ctx.prisma.cpu.findUnique({ where: { id } })

      if (!cpu) return ResourceError.cpu.notFound()

      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.brandId },
      })

      if (!brand) return ResourceError.deviceBrand.notFound()

      const existingCpu = await ctx.prisma.cpu.findFirst({
        where: {
          brandId: input.brandId,
          modelName: { equals: input.modelName, mode: 'insensitive' },
          id: { not: id },
        },
      })

      if (existingCpu) return ResourceError.cpu.alreadyExists(input.modelName)

      return ctx.prisma.cpu.update({
        where: { id },
        data,
        include: { brand: true, _count: { select: { pcListings: true } } },
      })
    }),

  delete: adminProcedure
    .input(DeleteCpuSchema)
    .mutation(async ({ ctx, input }) => {
      const existingCpu = await ctx.prisma.cpu.findUnique({
        where: { id: input.id },
        include: { _count: { select: { pcListings: true } } },
      })

      if (!existingCpu) return ResourceError.cpu.notFound()

      if (existingCpu._count.pcListings > 0) {
        return AppError.conflict(
          `Cannot delete CPU "${existingCpu.modelName}" because it has ${existingCpu._count.pcListings} active PC listing(s). Please remove all PC listings for this CPU first.`,
        )
      }

      return ctx.prisma.cpu.delete({ where: { id: input.id } })
    }),

  stats: moderatorProcedure.query(async ({ ctx }) => {
    const [total, withListings, withoutListings] = await Promise.all([
      ctx.prisma.cpu.count(),
      ctx.prisma.cpu.count({ where: { pcListings: { some: {} } } }),
      ctx.prisma.cpu.count({ where: { pcListings: { none: {} } } }),
    ])

    return {
      total,
      withListings,
      withoutListings,
    }
  }),
})
