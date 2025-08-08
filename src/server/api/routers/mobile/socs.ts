import { ResourceError } from '@/lib/errors'
import { GetSoCsSchema, GetSoCByIdSchema } from '@/schemas/soc'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import type { Prisma } from '@orm'

export const mobileSocsRouter = createMobileTRPCRouter({
  /**
   * Get SoCs with search, filtering, and pagination
   */
  get: mobilePublicProcedure.input(GetSoCsSchema).query(async ({ ctx, input }) => {
    const { search, limit = 20, offset = 0, page, sortField, sortDirection } = input ?? {}

    // Calculate actual offset based on page or use provided offset
    const actualOffset = page ? (page - 1) * limit : offset

    // Build where clause for filtering with more restrictive search
    const where: Prisma.SoCWhereInput = search
      ? {
          OR: [
            // Exact name match (highest priority)
            { name: { equals: search, mode: 'insensitive' as const } },
            // Exact manufacturer match
            {
              manufacturer: { equals: search, mode: 'insensitive' as const },
            },
            // Name starts with search term
            { name: { startsWith: search, mode: 'insensitive' as const } },
            // Manufacturer starts with search term
            {
              manufacturer: {
                startsWith: search,
                mode: 'insensitive' as const,
              },
            },
            // Only allow contains search for longer terms (3+ characters)
            ...(search.length >= 3
              ? [
                  {
                    name: { contains: search, mode: 'insensitive' as const },
                  },
                  {
                    manufacturer: {
                      contains: search,
                      mode: 'insensitive' as const,
                    },
                  },
                ]
              : []),
          ],
        }
      : {}

    const orderBy: Prisma.SoCOrderByWithRelationInput[] = []

    if (sortField && sortDirection) {
      switch (sortField) {
        case 'name':
          orderBy.push({ name: sortDirection })
          break
        case 'manufacturer':
          orderBy.push({ manufacturer: sortDirection })
          break
      }
    }

    // Default ordering if no sort specified
    if (!orderBy.length) {
      orderBy.push({ manufacturer: 'asc' }, { name: 'asc' })
    }

    const [socs, total] = await Promise.all([
      ctx.prisma.soC.findMany({
        where,
        orderBy,
        skip: actualOffset,
        take: limit,
      }),
      ctx.prisma.soC.count({ where }),
    ])

    const pages = Math.ceil(total / limit)

    return {
      socs,
      pagination: {
        page: page ?? Math.floor(actualOffset / limit) + 1,
        limit,
        total,
        pages,
      },
    }
  }),

  /**
   * Get SoC by ID
   */
  getById: mobilePublicProcedure.input(GetSoCByIdSchema).query(async ({ ctx, input }) => {
    const soc = await ctx.prisma.soC.findUnique({ where: { id: input.id } })

    return soc || ResourceError.soc.notFound()
  }),
})
