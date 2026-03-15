import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus, Role, type PrismaClient } from '@orm'
import { GameFollowRepository } from './game-follow.repository'

vi.mock('@orm', async () => {
  const actual = await import('@orm')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

function createMockPrisma() {
  const mock = {
    gameFollow: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    game: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient
  return mock
}

describe('GameFollowRepository', () => {
  let prisma: PrismaClient
  let repository: GameFollowRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repository = new GameFollowRepository(prisma)
  })

  describe('follow', () => {
    it('should upsert a game follow for an approved game', async () => {
      vi.mocked(prisma.game.findUnique).mockResolvedValueOnce({
        id: 'game-1',
        status: ApprovalStatus.APPROVED,
      } as never)
      vi.mocked(prisma.gameFollow.upsert).mockResolvedValueOnce({ id: 'gf-1' } as never)

      await repository.follow('user-1', 'game-1')

      expect(prisma.gameFollow.upsert).toHaveBeenCalledWith({
        where: { userId_gameId: { userId: 'user-1', gameId: 'game-1' } },
        create: { userId: 'user-1', gameId: 'game-1' },
        update: {},
        select: { id: true },
      })
    })

    it('should throw when game not found', async () => {
      vi.mocked(prisma.game.findUnique).mockResolvedValueOnce(null)

      await expect(repository.follow('user-1', 'nonexistent')).rejects.toThrow('Game not found')
    })

    it('should throw when game is not approved', async () => {
      vi.mocked(prisma.game.findUnique).mockResolvedValueOnce({
        id: 'game-1',
        status: ApprovalStatus.PENDING,
      } as never)

      await expect(repository.follow('user-1', 'game-1')).rejects.toThrow(
        'Cannot follow a game that is not approved',
      )
    })
  })

  describe('unfollow', () => {
    it('should call deleteMany with correct userId and gameId', async () => {
      vi.mocked(prisma.gameFollow.deleteMany).mockResolvedValueOnce({ count: 1 } as never)

      await repository.unfollow('user-1', 'game-1')

      expect(prisma.gameFollow.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', gameId: 'game-1' },
      })
    })
  })

  describe('isFollowing', () => {
    it('should return true when follow record exists', async () => {
      vi.mocked(prisma.gameFollow.findUnique).mockResolvedValueOnce({ id: 'gf-1' } as never)

      const result = await repository.isFollowing('user-1', 'game-1')

      expect(result).toBe(true)
    })

    it('should return false when no record exists', async () => {
      vi.mocked(prisma.gameFollow.findUnique).mockResolvedValueOnce(null)

      const result = await repository.isFollowing('user-1', 'game-1')

      expect(result).toBe(false)
    })
  })

  describe('getBulkFollowStatuses', () => {
    it('should return a Record mapping each ID correctly', async () => {
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce([
        { gameId: 'g1' },
        { gameId: 'g3' },
      ] as never)

      const result = await repository.getBulkFollowStatuses('user-1', ['g1', 'g2', 'g3'])

      expect(result).toEqual({ g1: true, g2: false, g3: true })
    })
  })

  describe('list', () => {
    it('should return visible list with pagination when no visibility context', async () => {
      const items = [{ id: 'gf-1', createdAt: new Date(), game: { id: 'g1', title: 'Game 1' } }]
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.gameFollow.count).mockResolvedValueOnce(1)

      const result = await repository.list('user-1', 1, 10)

      expect(result.visibility).toBe('visible')
      if (result.visibility === 'visible') {
        expect(result.items).toEqual(items)
        expect(result.pagination.total).toBe(1)
      }
    })

    it('should return hidden when followedGamesVisible: false for non-owner non-mod', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        settings: { followedGamesVisible: false },
      } as never)

      const result = await repository.list('user-1', 1, 10, {
        requestingUserId: 'other-user',
        requestingUserRole: Role.USER,
      })

      expect(result.visibility).toBe('hidden')
    })

    it('should return visible when followedGamesVisible: false but requester is owner', async () => {
      const items = [{ id: 'gf-1' }]
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.gameFollow.count).mockResolvedValueOnce(1)

      const result = await repository.list('user-1', 1, 10, {
        requestingUserId: 'user-1',
        requestingUserRole: Role.USER,
      })

      expect(result.visibility).toBe('visible')
      if (result.visibility === 'visible') {
        expect(result.items).toEqual(items)
      }
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return visible when followedGamesVisible: false but requester is MODERATOR', async () => {
      const items = [{ id: 'gf-1' }]
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce(items as never)
      vi.mocked(prisma.gameFollow.count).mockResolvedValueOnce(1)

      const result = await repository.list('user-1', 1, 10, {
        requestingUserId: 'mod-user',
        requestingUserRole: Role.MODERATOR,
      })

      expect(result.visibility).toBe('visible')
      if (result.visibility === 'visible') {
        expect(result.items).toEqual(items)
      }
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should apply search filter to game title', async () => {
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.gameFollow.count).mockResolvedValueOnce(0)

      await repository.list('user-1', 1, 10, undefined, 'zelda')

      expect(prisma.gameFollow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            game: expect.objectContaining({
              title: { contains: 'zelda', mode: 'insensitive' },
            }),
          }),
        }),
      )
    })

    it('should apply systemId filter', async () => {
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.gameFollow.count).mockResolvedValueOnce(0)

      await repository.list('user-1', 1, 10, undefined, undefined, 'system-1')

      expect(prisma.gameFollow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            game: expect.objectContaining({
              systemId: 'system-1',
            }),
          }),
        }),
      )
    })
  })

  describe('iterateFollowerUserIds', () => {
    it('should yield user IDs from batched game follows', async () => {
      vi.mocked(prisma.gameFollow.findMany)
        .mockResolvedValueOnce([
          { id: 'gf-1', userId: 'user-a' },
          { id: 'gf-2', userId: 'user-b' },
        ] as never)
        .mockResolvedValueOnce([{ id: 'gf-3', userId: 'user-c' }] as never)

      const allBatches: string[][] = []
      for await (const batch of repository.iterateFollowerUserIds('game-1', 2)) {
        allBatches.push(batch)
      }

      expect(allBatches).toEqual([['user-a', 'user-b'], ['user-c']])

      expect(prisma.gameFollow.findMany).toHaveBeenNthCalledWith(1, {
        where: { gameId: 'game-1' },
        select: { id: true, userId: true },
        orderBy: { id: 'asc' },
        take: 2,
      })
      expect(prisma.gameFollow.findMany).toHaveBeenNthCalledWith(2, {
        where: { gameId: 'game-1' },
        select: { id: true, userId: true },
        orderBy: { id: 'asc' },
        take: 2,
        cursor: { id: 'gf-2' },
        skip: 1,
      })
    })

    it('should handle no followers (empty generator)', async () => {
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce([])

      const allBatches: string[][] = []
      for await (const batch of repository.iterateFollowerUserIds('game-1', 10)) {
        allBatches.push(batch)
      }

      expect(allBatches).toEqual([])
    })

    it('should pass correct query parameters to findMany', async () => {
      vi.mocked(prisma.gameFollow.findMany).mockResolvedValueOnce([
        { id: 'gf-1', userId: 'user-a' },
      ] as never)

      const batches: string[][] = []
      for await (const batch of repository.iterateFollowerUserIds('game-1', 5)) {
        batches.push(batch)
      }

      expect(prisma.gameFollow.findMany).toHaveBeenCalledWith({
        where: { gameId: 'game-1' },
        select: { id: true, userId: true },
        orderBy: { id: 'asc' },
        take: 5,
      })
    })
  })

  describe('counts', () => {
    it('should return visible counts when no visibility context', async () => {
      vi.mocked(prisma.gameFollow.count).mockResolvedValueOnce(5)

      const result = await repository.counts('user-1')

      expect(result.visibility).toBe('visible')
      if (result.visibility === 'visible') {
        expect(result.counts).toEqual({ followedGames: 5 })
      }
    })

    it('should return hidden when visibility is restricted', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        settings: { followedGamesVisible: false },
      } as never)

      const result = await repository.counts('user-1', {
        requestingUserId: 'other-user',
        requestingUserRole: Role.USER,
      })

      expect(result.visibility).toBe('hidden')
    })

    it('should return visible counts when requester is owner', async () => {
      vi.mocked(prisma.gameFollow.count).mockResolvedValueOnce(3)

      const result = await repository.counts('user-1', {
        requestingUserId: 'user-1',
        requestingUserRole: Role.USER,
      })

      expect(result.visibility).toBe('visible')
      if (result.visibility === 'visible') {
        expect(result.counts).toEqual({ followedGames: 3 })
      }
    })
  })
})
