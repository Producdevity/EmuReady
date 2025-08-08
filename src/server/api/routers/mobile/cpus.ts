import { ResourceError } from '@/lib/errors'
import { GetCpusSchema, GetCpuByIdSchema } from '@/schemas/cpu'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { Prisma } from '@orm'

export const mobileCpusRouter = createMobileTRPCRouter({
  /**
   * Get CPUs with search, filtering, and pagination
   */
  get: mobilePublicProcedure.input(GetCpusSchema).query(async ({ ctx, input }) => {
    const { search, brandId, limit = 20, offset = 0, page, sortField, sortDirection } = input ?? {}

    // Calculate actual offset based on page or use provided offset
    const actualOffset = page ? (page - 1) * limit : offset
    const mode = Prisma.QueryMode.insensitive

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

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ brand: { name: 'asc' } }, { modelName: 'asc' })
    }

    const [cpus, total] = await Promise.all([
      ctx.prisma.cpu.findMany({
        where,
        include: { brand: { select: { id: true, name: true } } },
        orderBy,
        skip: actualOffset,
        take: limit,
      }),
      ctx.prisma.cpu.count({ where }),
    ])

    const pages = Math.ceil(total / limit)

    return {
      cpus,
      pagination: {
        page: page ?? Math.floor(actualOffset / limit) + 1,
        limit,
        total,
        pages,
      },
    }
  }),

  /**
   * Get CPU by ID
   */
  getById: mobilePublicProcedure.input(GetCpuByIdSchema).query(async ({ ctx, input }) => {
    const cpu = await ctx.prisma.cpu.findUnique({
      where: { id: input.id },
      include: { brand: { select: { id: true, name: true } } },
    })

    return cpu || ResourceError.cpu.notFound()
  }),
})
