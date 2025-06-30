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
      const { systemId, search, limit } = input

      let emulators = await ctx.prisma.emulator.findMany({
        include: {
          systems: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { name: 'asc' }],
        take: search || systemId ? undefined : limit,
      })

      // Filter by search and/or systemId
      if (search || systemId) {
        emulators = emulators
          .filter((emulator) => {
            const matchesSearch =
              !search ||
              emulator.name.toLowerCase().includes(search.toLowerCase())
            const matchesSystem =
              !systemId ||
              emulator.systems.some((system) => system.id === systemId)
            return matchesSearch && matchesSystem
          })
          .slice(0, limit)
      }

      return emulators
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
