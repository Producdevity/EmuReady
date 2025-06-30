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
      const baseWhere = {}
      if (input.brandId) Object.assign(baseWhere, { brandId: input.brandId })

      const devices = await ctx.prisma.device.findMany({
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
        take: input.search ? undefined : input.limit,
      })

      const searchTerm = input.search?.toLowerCase()

      // Filter by search if provided
      // TODO: do this in the query instead
      return searchTerm
        ? devices
            .filter((device) =>
              `${device.modelName} ${device.brand.name}`
                .toLowerCase()
                .includes(searchTerm),
            )
            .slice(0, input.limit)
        : devices
    }),

  /**
   * Get device brands
   */
  getDeviceBrands: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.deviceBrand.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  }),

  /**
   * Get SOCs (System on Chips)
   */
  getSocs: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.soC.findMany({
      select: { id: true, name: true, manufacturer: true },
      orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }],
    })
  }),
})
