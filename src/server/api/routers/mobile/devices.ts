import { GetDevicesSchema } from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { ApprovalStatus } from '@orm'

export const mobileDevicesRouter = createMobileTRPCRouter({
  /**
   * Get devices with search and filtering
   */
  getDevices: mobilePublicProcedure
    .input(GetDevicesSchema)
    .query(async ({ ctx, input }) => {
      const baseWhere: Record<string, unknown> = {}
      if (input.brandId) baseWhere.brandId = input.brandId

      // Add search filtering at database level
      if (input.search) {
        baseWhere.OR = [
          { modelName: { contains: input.search, mode: 'insensitive' } },
          { brand: { name: { contains: input.search, mode: 'insensitive' } } },
        ]
      }

      return await ctx.prisma.device.findMany({
        where: baseWhere,
        include: {
          brand: { select: { id: true, name: true } },
          soc: { select: { id: true, name: true, manufacturer: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
        take: input.limit,
      })
    }),

  /**
   * Get device brands
   */
  getDeviceBrands: mobilePublicProcedure.query(
    async ({ ctx }) =>
      await ctx.prisma.deviceBrand.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
  ),

  /**
   * Get SOCs (System on Chips)
   */
  getSocs: mobilePublicProcedure.query(
    async ({ ctx }) =>
      await ctx.prisma.soC.findMany({
        select: { id: true, name: true, manufacturer: true },
        orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }],
      }),
  ),
})
