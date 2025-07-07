import { ResourceError } from '@/lib/errors'
import {
  GetDeviceBrandsSchema,
  GetDeviceBrandByIdSchema,
} from '@/schemas/deviceBrand'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import type { Prisma } from '@orm'

export const mobileDeviceBrandsRouter = createMobileTRPCRouter({
  /**
   * Get device brands with search and sorting
   */
  get: mobilePublicProcedure
    .input(GetDeviceBrandsSchema)
    .query(async ({ ctx, input }) => {
      const { search, limit, sortField, sortDirection } = input ?? {}

      // Build orderBy based on sortField and sortDirection
      const orderBy: Prisma.DeviceBrandOrderByWithRelationInput[] = []

      if (sortField && sortDirection) {
        switch (sortField) {
          case 'name':
            orderBy.push({ name: sortDirection })
            break
          case 'devicesCount':
            orderBy.push({ devices: { _count: sortDirection } })
            break
        }
      }

      // Default ordering if no sort specified
      if (!orderBy.length) {
        orderBy.push({ name: 'asc' })
      }

      return ctx.prisma.deviceBrand.findMany({
        where: search
          ? { name: { contains: search, mode: 'insensitive' } }
          : undefined,
        include: { _count: { select: { devices: true } } },
        orderBy,
        take: limit,
      })
    }),

  /**
   * Get device brand by ID
   */
  getById: mobilePublicProcedure
    .input(GetDeviceBrandByIdSchema)
    .query(async ({ ctx, input }) => {
      const brand = await ctx.prisma.deviceBrand.findUnique({
        where: { id: input.id },
        include: { _count: { select: { devices: true } } },
      })

      return brand || ResourceError.deviceBrand.notFound()
    }),
})
