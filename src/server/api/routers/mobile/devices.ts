import { ResourceError } from '@/lib/errors'
import { GetDeviceByIdSchema } from '@/schemas/device'
import { GetDevicesSchema } from '@/schemas/mobile'
import { createMobileTRPCRouter, mobilePublicProcedure } from '@/server/api/mobileContext'
import { ApprovalStatus, Prisma } from '@orm'

export const mobileDevicesRouter = createMobileTRPCRouter({
  /**
   * Get devices with optional search, brand filtering, and pagination
   */
  get: mobilePublicProcedure.input(GetDevicesSchema).query(async ({ ctx, input }) => {
    const mode = Prisma.QueryMode.insensitive
    const { brandId, search, limit } = input ?? {}
    const baseWhere: Record<string, unknown> = {}
    if (brandId) baseWhere.brandId = brandId

    if (search) {
      baseWhere.OR = [
        { modelName: { contains: search, mode } },
        { brand: { name: { contains: search, mode } } },
      ]
    }

    return await ctx.prisma.device.findMany({
      where: baseWhere,
      include: {
        brand: { select: { id: true, name: true } },
        soc: { select: { id: true, name: true, manufacturer: true } },
        _count: { select: { listings: { where: { status: ApprovalStatus.APPROVED } } } },
      },
      orderBy: [{ brand: { name: 'asc' } }, { modelName: 'asc' }],
      take: limit,
    })
  }),

  /**
   * Get all device brands sorted alphabetically
   */
  brands: mobilePublicProcedure.query(
    async ({ ctx }) =>
      await ctx.prisma.deviceBrand.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
  ),

  /**
   * Get SOCs (System on Chips)
   */
  socs: mobilePublicProcedure.query(
    async ({ ctx }) =>
      await ctx.prisma.soC.findMany({
        select: { id: true, name: true, manufacturer: true },
        orderBy: [{ manufacturer: 'asc' }, { name: 'asc' }],
      }),
  ),

  /**
   * Get device by ID
   */
  byId: mobilePublicProcedure.input(GetDeviceByIdSchema).query(async ({ ctx, input }) => {
    const device = await ctx.prisma.device.findUnique({
      where: { id: input.id },
      include: {
        brand: { select: { id: true, name: true } },
        soc: { select: { id: true, name: true, manufacturer: true } },
        _count: { select: { listings: { where: { status: ApprovalStatus.APPROVED } } } },
      },
    })

    return device || ResourceError.device.notFound()
  }),
})
