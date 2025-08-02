import { SearchSuggestionsSchema } from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { ApprovalStatus } from '@orm'

export const mobileGeneralRouter = createMobileTRPCRouter({
  /**
   * Get app statistics
   */
  stats: mobilePublicProcedure.query(async ({ ctx }) => {
    const [
      totalListings,
      totalPcListings,
      totalGames,
      totalDevices,
      totalEmulators,
      totalUsers,
    ] = await Promise.all([
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.pcListing.count({
        where: { status: ApprovalStatus.APPROVED },
      }),
      ctx.prisma.game.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.device.count(),
      ctx.prisma.emulator.count(),
      ctx.prisma.user.count(),
    ])

    return {
      totalListings,
      totalPcListings,
      totalReports: totalListings + totalPcListings,
      totalGames,
      totalDevices,
      totalEmulators,
      totalUsers,
    }
  }),

  /**
   * Get all systems
   */
  systems: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.system.findMany({
      select: { id: true, name: true, key: true, tgdbPlatformId: true },
      orderBy: { name: 'asc' },
    })
  }),

  /**
   * Get performance scales
   */
  performanceScales: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.performanceScale.findMany({
      select: { id: true, label: true, rank: true },
      orderBy: { rank: 'asc' },
    })
  }),

  /**
   * Get search suggestions
   */
  searchSuggestions: mobilePublicProcedure
    .input(SearchSuggestionsSchema)
    .query(async ({ ctx, input }) => {
      const { query, limit } = input

      // Calculate how many results to get from each category
      const perCategory = Math.ceil(limit / 3)

      const [games, devices, emulators] = await Promise.all([
        ctx.prisma.game.findMany({
          where: {
            status: ApprovalStatus.APPROVED,
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          select: { id: true, title: true, system: { select: { name: true } } },
          take: perCategory,
        }),
        ctx.prisma.device.findMany({
          where: {
            OR: [
              {
                modelName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                brand: {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            modelName: true,
            brand: { select: { name: true } },
          },
          take: perCategory,
        }),
        ctx.prisma.emulator.findMany({
          where: {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          select: { id: true, name: true },
          take: perCategory,
        }),
      ])

      const suggestions = [
        ...games.map((game) => ({
          id: game.id,
          title: game.title,
          type: 'game' as const,
          subtitle: game.system.name,
        })),
        ...devices.map((device) => ({
          id: device.id,
          title: device.modelName,
          type: 'device' as const,
          subtitle: device.brand.name,
        })),
        ...emulators.map((emulator) => ({
          id: emulator.id,
          title: emulator.name,
          type: 'emulator' as const,
        })),
      ]

      return suggestions.slice(0, limit)
    }),

  /**
   * Get trust levels (for mobile trust system integration)
   */
  trustLevels: mobilePublicProcedure.query(async () => {
    const { TRUST_LEVELS } = await import('@/lib/trust/config')
    return TRUST_LEVELS
  }),

  // Backward compatibility aliases
  /**
   * @deprecated Use 'stats' instead
   */
  getAppStats: mobilePublicProcedure.query(async ({ ctx }) => {
    const [
      totalListings,
      totalPcListings,
      totalGames,
      totalDevices,
      totalEmulators,
      totalUsers,
    ] = await Promise.all([
      ctx.prisma.listing.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.pcListing.count({
        where: { status: ApprovalStatus.APPROVED },
      }),
      ctx.prisma.game.count({ where: { status: ApprovalStatus.APPROVED } }),
      ctx.prisma.device.count(),
      ctx.prisma.emulator.count(),
      ctx.prisma.user.count(),
    ])

    return {
      totalListings,
      totalPcListings,
      totalReports: totalListings + totalPcListings,
      totalGames,
      totalDevices,
      totalEmulators,
      totalUsers,
    }
  }),

  /**
   * @deprecated Use 'systems' instead
   */
  getSystems: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.system.findMany({
      select: { id: true, name: true, key: true, tgdbPlatformId: true },
      orderBy: { name: 'asc' },
    })
  }),

  /**
   * @deprecated Use 'performanceScales' instead
   */
  getPerformanceScales: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.performanceScale.findMany({
      select: { id: true, label: true, rank: true },
      orderBy: { rank: 'asc' },
    })
  }),

  /**
   * @deprecated Use 'searchSuggestions' instead
   */
  getSearchSuggestions: mobilePublicProcedure
    .input(SearchSuggestionsSchema)
    .query(async ({ ctx, input }) => {
      const { query, limit } = input

      // Calculate how many results to get from each category
      const perCategory = Math.ceil(limit / 3)

      const [games, devices, emulators] = await Promise.all([
        ctx.prisma.game.findMany({
          where: {
            status: ApprovalStatus.APPROVED,
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          select: { id: true, title: true, system: { select: { name: true } } },
          take: perCategory,
        }),
        ctx.prisma.device.findMany({
          where: {
            OR: [
              {
                modelName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                brand: {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            modelName: true,
            brand: { select: { name: true } },
          },
          take: perCategory,
        }),
        ctx.prisma.emulator.findMany({
          where: {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          select: { id: true, name: true },
          take: perCategory,
        }),
      ])

      const suggestions = [
        ...games.map((game) => ({
          id: game.id,
          title: game.title,
          type: 'game' as const,
          subtitle: game.system.name,
        })),
        ...devices.map((device) => ({
          id: device.id,
          title: device.modelName,
          type: 'device' as const,
          subtitle: device.brand.name,
        })),
        ...emulators.map((emulator) => ({
          id: emulator.id,
          title: emulator.name,
          type: 'emulator' as const,
        })),
      ]

      return suggestions.slice(0, limit)
    }),

  /**
   * @deprecated Use 'trustLevels' instead
   */
  getTrustLevels: mobilePublicProcedure.query(async () => {
    const { TRUST_LEVELS } = await import('@/lib/trust/config')
    return TRUST_LEVELS
  }),
})
