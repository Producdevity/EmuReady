import { GetEmulatorByIdSchema, GetEmulatorsSchema } from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { ApprovalStatus } from '@orm'

export const mobileEmulatorsRouter = createMobileTRPCRouter({
  /**
   * Get emulators with search and filtering
   */
  getEmulators: mobilePublicProcedure
    .input(GetEmulatorsSchema)
    .query(async ({ ctx, input }) => {
      const { systemId, search, limit } = input ?? {}

      const whereClause: Record<string, unknown> = {}

      // Add search filtering at database level
      if (search) whereClause.name = { contains: search, mode: 'insensitive' }

      // Add system filtering at database level
      if (systemId) whereClause.systems = { some: { id: systemId } }

      return await ctx.prisma.emulator.findMany({
        where: whereClause,
        include: {
          systems: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { name: 'asc' }],
        take: limit,
      })
    }),

  /**
   * Get emulator by ID
   */
  getEmulatorById: mobilePublicProcedure
    .input(GetEmulatorByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.emulator.findUnique({
        where: { id: input.id },
        include: {
          systems: { select: { id: true, name: true, key: true } },
          _count: { select: { listings: true } },
        },
      })
    }),
})
