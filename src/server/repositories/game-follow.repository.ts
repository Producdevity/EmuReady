import { BATCH_SIZES } from '@/data/constants'
import { ResourceError } from '@/lib/errors'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import { ApprovalStatus } from '@orm'
import { BaseRepository } from './base.repository'
import { hiddenList, visibleList, hiddenCounts, visibleCounts } from './types'
import type { VisibilityContext, VisibilityGatedList, VisibilityGatedCounts } from './types'
import type { Prisma } from '@orm'

const gameFollowSelects = {
  followWithGame: {
    id: true,
    createdAt: true,
    game: {
      select: {
        id: true,
        title: true,
        imageUrl: true,
        system: { select: { id: true, name: true, key: true } },
        _count: { select: { listings: true, pcListings: true } },
      },
    },
  } satisfies Prisma.GameFollowSelect,
} as const

type GameFollowListItem = Prisma.GameFollowGetPayload<{
  select: (typeof gameFollowSelects)['followWithGame']
}>

export class GameFollowRepository extends BaseRepository {
  static readonly selects = gameFollowSelects

  async follow(userId: string, gameId: string) {
    return this.handleDatabaseOperation(async () => {
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        select: { id: true, status: true },
      })

      if (!game) throw ResourceError.game.notFound()
      if (game.status !== ApprovalStatus.APPROVED) {
        throw ResourceError.gameFollow.cannotFollowNonApproved()
      }

      return this.prisma.gameFollow.upsert({
        where: { userId_gameId: { userId, gameId } },
        create: { userId, gameId },
        update: {},
        select: { id: true },
      })
    }, 'GameFollow')
  }

  async unfollow(userId: string, gameId: string) {
    return this.handleDatabaseOperation(
      () =>
        this.prisma.gameFollow.deleteMany({
          where: { userId, gameId },
        }),
      'GameFollow',
    )
  }

  async isFollowing(userId: string, gameId: string): Promise<boolean> {
    return this.handleDatabaseOperation(async () => {
      const follow = await this.prisma.gameFollow.findUnique({
        where: { userId_gameId: { userId, gameId } },
        select: { id: true },
      })
      return Boolean(follow)
    }, 'GameFollow')
  }

  async getBulkFollowStatuses(userId: string, gameIds: string[]): Promise<Record<string, boolean>> {
    return this.handleDatabaseOperation(async () => {
      const follows = await this.prisma.gameFollow.findMany({
        where: { userId, gameId: { in: gameIds } },
        select: { gameId: true },
      })

      const followSet = new Set(follows.map((f) => f.gameId))
      const statuses: Record<string, boolean> = {}
      for (const id of gameIds) {
        statuses[id] = followSet.has(id)
      }
      return statuses
    }, 'GameFollow')
  }

  async list(
    userId: string,
    page: number,
    limit: number,
    ctx?: VisibilityContext,
    search?: string,
    systemId?: string,
  ): Promise<VisibilityGatedList<GameFollowListItem>> {
    return this.handleDatabaseOperation(async () => {
      const isHidden = await this.checkFollowVisibility(userId, ctx)
      if (isHidden) return hiddenList()

      const offset = calculateOffset({ page }, limit)
      const where: Prisma.GameFollowWhereInput = {
        userId,
        game: {
          status: ApprovalStatus.APPROVED,
          ...(search ? { title: { contains: search, mode: this.mode } } : {}),
          ...(systemId ? { systemId } : {}),
        },
      }

      const [items, total] = await Promise.all([
        this.prisma.gameFollow.findMany({
          where,
          select: GameFollowRepository.selects.followWithGame,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.gameFollow.count({ where }),
      ])

      return visibleList(items, paginate({ total, page, limit }))
    }, 'GameFollow')
  }

  async *iterateFollowerUserIds(
    gameId: string,
    batchSize: number = BATCH_SIZES.CURSOR_DEFAULT,
  ): AsyncGenerator<string[], void, undefined> {
    for await (const batch of this.cursorBatchIterator(
      (params) =>
        this.prisma.gameFollow.findMany({
          where: { gameId },
          select: { id: true, userId: true },
          orderBy: { id: 'asc' },
          ...params,
        }),
      batchSize,
    )) {
      yield batch.map((f) => f.userId)
    }
  }

  async counts(
    userId: string,
    ctx?: VisibilityContext,
  ): Promise<VisibilityGatedCounts<{ followedGames: number }>> {
    return this.handleDatabaseOperation(async () => {
      const isHidden = await this.checkFollowVisibility(userId, ctx)
      if (isHidden) return hiddenCounts()

      const count = await this.prisma.gameFollow.count({
        where: { userId, game: { status: ApprovalStatus.APPROVED } },
      })
      return visibleCounts({ followedGames: count })
    }, 'GameFollow')
  }

  private async checkFollowVisibility(userId: string, ctx?: VisibilityContext): Promise<boolean> {
    return this.checkSettingVisibility(userId, ctx, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { settings: { select: { followedGamesVisible: true } } },
      })
      return user?.settings?.followedGamesVisible
    })
  }
}
