import { filterNullAndEmpty } from '@/utils/filter'
import { type PrismaClient, ApprovalStatus } from '@orm'
import { BaseService } from '../base.service'
import { type BaseUser } from '../types'
import {
  type FindGamesParams,
  type GameWithRelations,
  type GameWithStats,
} from './game.types'

export class GameService extends BaseService<GameWithRelations, GameWithStats> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'game')
  }

  protected getDefaultInclude() {
    return {
      system: true,
      _count: {
        select: {
          listings: true,
        },
      },
    }
  }

  protected getSearchConditions(search: string) {
    return {
      OR: [{ title: { contains: search, mode: 'insensitive' as const } }],
    }
  }

  protected getOrderBy() {
    return { title: 'asc' }
  }

  async findMany(params: FindGamesParams) {
    const { systemId, user, ...baseParams } = params

    // Build additional where conditions
    const additionalWhere = filterNullAndEmpty({
      status: ApprovalStatus.APPROVED,
      ...(systemId && { systemId }),
      ...(user?.showNsfw ? {} : { isErotic: false }),
    })

    // Override the base method to add custom where conditions
    const { page = 1, limit = 10, search } = baseParams
    const where = {
      ...additionalWhere,
      ...(search ? this.getSearchConditions(search) : {}),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic model access limitation
    const model = this.prisma[this.modelName] as any

    const [items, total] = await Promise.all([
      model.findMany({
        where,
        include: this.getDefaultInclude(),
        orderBy: this.getOrderBy(),
        skip: (page - 1) * limit,
        take: limit,
      }),
      model.count({ where }),
    ])

    // Calculate stats for each game
    const gamesWithStats = await Promise.all(
      items.map(async (game: GameWithRelations) => this.addStatsToGame(game)),
    )

    return {
      items: gamesWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async findById(
    id: string,
    user?: BaseUser | null,
  ): Promise<GameWithStats | null> {
    const game = (await this.prisma.game.findUnique({
      where: { id },
      include: this.getDefaultInclude(),
    })) as GameWithRelations | null

    if (!game) return null

    // Check if game is approved
    if (game.status !== ApprovalStatus.APPROVED) {
      return null
    }

    // Check NSFW content
    if (!user?.showNsfw && game.isErotic) {
      return null
    }

    return this.addStatsToGame(game)
  }

  async search(
    query: string,
    limit = 20,
    user?: BaseUser | null,
  ): Promise<GameWithStats[]> {
    const games = await this.prisma.game.findMany({
      where: {
        status: ApprovalStatus.APPROVED,
        ...(user?.showNsfw ? {} : { isErotic: false }),
        OR: [{ title: { contains: query, mode: 'insensitive' as const } }],
      },
      include: this.getDefaultInclude(),
      orderBy: [{ listings: { _count: 'desc' } }, { title: 'asc' }],
      take: limit,
    })

    return Promise.all(
      games.map(async (game) => this.addStatsToGame(game as GameWithRelations)),
    )
  }

  private async addStatsToGame(
    game: GameWithRelations,
  ): Promise<GameWithStats> {
    // Get average success rate from listings

    // Get listings with votes to calculate proper success rate
    const listingsWithVotes = await this.prisma.listing.findMany({
      where: {
        gameId: game.id,
        status: ApprovalStatus.APPROVED,
      },
      include: {
        _count: {
          select: {
            votes: true,
          },
        },
        votes: true,
      },
    })

    let totalSuccessRate = 0
    let listingsWithVotesCount = 0

    for (const listing of listingsWithVotes) {
      if (listing._count.votes > 0) {
        const upVotes = listing.votes.filter((v) => v.value).length
        const downVotes = listing.votes.filter((v) => !v.value).length
        const successRate = (upVotes / (upVotes + downVotes)) * 100
        totalSuccessRate += successRate
        listingsWithVotesCount++
      }
    }

    const averageSuccessRate =
      listingsWithVotesCount > 0 ? totalSuccessRate / listingsWithVotesCount : 0

    return {
      ...game,
      stats: {
        listingsCount: game._count.listings,
        averageSuccessRate,
      },
    }
  }
}
