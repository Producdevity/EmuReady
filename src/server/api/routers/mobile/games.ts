import {
  GetGameByIdSchema,
  GetGamesSchema,
  SearchGamesSchema,
} from '@/schemas/mobile'
import {
  createMobileTRPCRouter,
  mobilePublicProcedure,
} from '@/server/api/mobileContext'
import { ApprovalStatus } from '@orm'

export const mobileGamesRouter = createMobileTRPCRouter({
  /**
   * Get games with search and filtering
   */
  getGames: mobilePublicProcedure
    .input(GetGamesSchema)
    .query(async ({ ctx, input }) => {
      const { search, systemId, limit = 20 } = input || {}

      const baseWhere = {
        status: ApprovalStatus.APPROVED,
      }

      if (systemId) Object.assign(baseWhere, { systemId })

      let games = await ctx.prisma.game.findMany({
        where: baseWhere,
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { title: 'asc' }],
        take: search ? undefined : limit,
      })

      // Filter by search if provided
      if (search) {
        games = games
          .filter((game) =>
            game.title.toLowerCase().includes(search.toLowerCase()),
          )
          .slice(0, limit)
      }

      return games
    }),

  /**
   * Get popular games
   */
  getPopularGames: mobilePublicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.game.findMany({
      where: { status: ApprovalStatus.APPROVED },
      include: {
        system: { select: { id: true, name: true, key: true } },
        _count: {
          select: { listings: { where: { status: ApprovalStatus.APPROVED } } },
        },
      },
      orderBy: { listings: { _count: 'desc' } },
      take: 20,
    })
  }),

  /**
   * Search games
   */
  searchGames: mobilePublicProcedure
    .input(SearchGamesSchema)
    .query(async ({ ctx, input }) => {
      let games = await ctx.prisma.game.findMany({
        where: {
          status: ApprovalStatus.APPROVED,
        },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        take: 100, // Get more to filter from
      })

      // Filter by search
      games = games
        .filter((game) =>
          game.title.toLowerCase().includes(input.query.toLowerCase()),
        )
        .slice(0, 20)

      return games
    }),

  /**
   * Get game by ID
   */
  getGameById: mobilePublicProcedure
    .input(GetGameByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.game.findUnique({
        where: { id: input.id },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
      })
    }),
})
