import { ResourceError } from '@/lib/errors'
import { GetDeviceBrandsSchema, GetDeviceBrandByIdSchema } from '@/schemas/deviceBrand'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { DeviceBrandsRepository } from '@/server/repositories/device-brands.repository'

export const mobileDeviceBrandsRouter = createMobileTRPCRouter({
  /**
   * Get device brands with search and sorting
   */
  get: mobilePublicProcedure.input(GetDeviceBrandsSchema).query(async ({ ctx, input }) => {
    const repository = new DeviceBrandsRepository(ctx.prisma)
    return repository.list(input ?? {}, { defaultLimit: undefined })
  }),

  /**
   * Get device brand by ID
   */
  getById: mobilePublicProcedure.input(GetDeviceBrandByIdSchema).query(async ({ ctx, input }) => {
    const brand = await ctx.prisma.deviceBrand.findUnique({
      where: { id: input.id },
      include: { _count: { select: { devices: true } } },
    })

    return brand || ResourceError.deviceBrand.notFound()
  }),
})
