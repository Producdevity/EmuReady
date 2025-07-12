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

      const whereClause: Record<string, unknown> = {
        status: ApprovalStatus.APPROVED,
      }

      if (systemId) {
        whereClause.systemId = systemId
      }

      if (search) {
        whereClause.title = {
          contains: search,
          mode: 'insensitive',
        }
      }

      return await ctx.prisma.game.findMany({
        where: whereClause,
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { title: 'asc' }],
        take: limit,
      })
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
      return await ctx.prisma.game.findMany({
        where: {
          status: ApprovalStatus.APPROVED,
          title: {
            contains: input.query,
            mode: 'insensitive',
          },
        },
        include: {
          system: { select: { id: true, name: true, key: true } },
          _count: {
            select: {
              listings: { where: { status: ApprovalStatus.APPROVED } },
            },
          },
        },
        orderBy: [{ listings: { _count: 'desc' } }, { title: 'asc' }],
        take: 20,
      })
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
