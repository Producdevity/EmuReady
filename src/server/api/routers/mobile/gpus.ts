import { ResourceError } from '@/lib/errors'
import { GetGpusSchema, GetGpuByIdSchema } from '@/schemas/gpu'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import type { Prisma } from '@orm'

export const mobileGpusRouter = createMobileTRPCRouter({
  /**
   * Get GPUs with search, filtering, and pagination
   */
  get: mobilePublicProcedure
    .input(GetGpusSchema)
    .query(async ({ ctx, input }) => {
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

      // Default ordering if no sort specified
      if (!orderBy.length) {
        orderBy.push({ brand: { name: 'asc' } }, { modelName: 'asc' })
      }

      const [gpus, total] = await Promise.all([
        ctx.prisma.gpu.findMany({
          where,
          include: { brand: { select: { id: true, name: true } } },
          orderBy,
          skip: actualOffset,
          take: limit,
        }),
        ctx.prisma.gpu.count({ where }),
      ])

      const pages = Math.ceil(total / limit)

      return {
        gpus,
        pagination: {
          page: page ?? Math.floor(actualOffset / limit) + 1,
          limit,
          total,
          pages,
        },
      }
    }),

  /**
   * Get GPU by ID
   */
  getById: mobilePublicProcedure
    .input(GetGpuByIdSchema)
    .query(async ({ ctx, input }) => {
      const gpu = await ctx.prisma.gpu.findUnique({
        where: { id: input.id },
        include: { brand: { select: { id: true, name: true } } },
      })

      return gpu || ResourceError.gpu.notFound()
    }),
})
