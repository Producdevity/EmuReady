import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApprovalStatus, type PrismaClient } from '@orm'
import { GamesRepository } from './games.repository'

vi.mock('@orm', async () => {
  const actual = await import('@orm')
  return {
    ...actual,
    Prisma: {
      QueryMode: {
        insensitive: 'insensitive',
      },
      SortOrder: {
        asc: 'asc',
        desc: 'desc',
      },
    },
  }
})

describe('GamesRepository - batchBySteamAppIds', () => {
  let prisma: PrismaClient
  let repository: GamesRepository

  beforeEach(() => {
    prisma = {
      game: {
        findMany: vi.fn(),
      },
    } as unknown as PrismaClient
    repository = new GamesRepository(prisma)
  })

  const mockGame1 = {
    id: 'game-1',
    title: 'Half-Life 2',
    systemId: 'pc',
    imageUrl: 'https://example.com/hl2.jpg',
    boxartUrl: null,
    bannerUrl: null,
    tgdbGameId: null,
    metadata: { steamAppId: '220' },
    isErotic: false,
    status: ApprovalStatus.APPROVED,
    submittedBy: null,
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date(),
    system: { id: 'pc', name: 'PC', key: 'pc' },
    _count: { listings: 5 },
    listings: [],
  }

  const mockGame2 = {
    id: 'game-2',
    title: 'Counter-Strike 2',
    systemId: 'pc',
    imageUrl: 'https://example.com/cs2.jpg',
    boxartUrl: null,
    bannerUrl: null,
    tgdbGameId: null,
    metadata: null,
    isErotic: false,
    status: ApprovalStatus.APPROVED,
    submittedBy: null,
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    createdAt: new Date(),
    system: { id: 'pc', name: 'PC', key: 'pc' },
    _count: { listings: 3 },
    listings: [],
  }

  it('should match games by Steam App ID in metadata', async () => {
    const steamAppIdToName = new Map([
      ['220', 'Half-Life 2'],
      ['730', 'Counter-Strike 2'],
    ])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([mockGame1, mockGame2])

    const results = await repository.batchBySteamAppIds(steamAppIdToName)

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      steamAppId: '220',
      matchStrategy: 'metadata',
    })
    expect(results[0]?.game?.id).toBe('game-1')
  })

  it('should match games by exact title when no metadata', async () => {
    const steamAppIdToName = new Map([['730', 'Counter-Strike 2']])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([mockGame2])

    const results = await repository.batchBySteamAppIds(steamAppIdToName)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      steamAppId: '730',
      matchStrategy: 'exact',
    })
    expect(results[0]?.game?.id).toBe('game-2')
  })

  it('should match games by normalized title', async () => {
    const steamAppIdToName = new Map([['730', 'Counter-Strike® 2']])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([mockGame2])

    const results = await repository.batchBySteamAppIds(steamAppIdToName)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      steamAppId: '730',
      matchStrategy: 'normalized',
    })
  })

  it('should return not_found for missing games', async () => {
    const steamAppIdToName = new Map([['999999', 'Nonexistent Game']])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([])

    const results = await repository.batchBySteamAppIds(steamAppIdToName)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      steamAppId: '999999',
      game: null,
      matchStrategy: 'not_found',
    })
  })

  it('should filter listings by emulator name', async () => {
    const steamAppIdToName = new Map([['220', 'Half-Life 2']])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([mockGame1])

    await repository.batchBySteamAppIds(steamAppIdToName, {
      emulatorName: 'GameHub',
    })

    expect(vi.mocked(prisma.game.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          listings: expect.objectContaining({
            where: expect.objectContaining({
              emulator: {
                name: {
                  equals: 'GameHub',
                  mode: 'insensitive',
                },
              },
            }),
          }),
        }),
      }),
    )
  })

  it('should respect maxListingsPerGame option', async () => {
    const steamAppIdToName = new Map([['220', 'Half-Life 2']])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([mockGame1])

    await repository.batchBySteamAppIds(steamAppIdToName, {
      maxListingsPerGame: 5,
    })

    expect(vi.mocked(prisma.game.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          listings: expect.objectContaining({
            take: 5,
          }),
        }),
      }),
    )
  })

  it('should filter out NSFW games when showNsfw is false', async () => {
    const steamAppIdToName = new Map([['220', 'Half-Life 2']])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([mockGame1])

    await repository.batchBySteamAppIds(steamAppIdToName, {
      showNsfw: false,
    })

    expect(vi.mocked(prisma.game.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isErotic: false,
        }),
      }),
    )
  })

  it('should handle large batches efficiently', async () => {
    const largeBatch = new Map<string, string>()
    const mockGames = []

    for (let i = 0; i < 100; i++) {
      largeBatch.set(String(i), `Game ${i}`)
      mockGames.push({
        ...mockGame1,
        id: `game-${i}`,
        title: `Game ${i}`,
        metadata: { steamAppId: String(i) },
      })
    }

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce(mockGames)

    const results = await repository.batchBySteamAppIds(largeBatch)

    expect(results).toHaveLength(100)
    expect(vi.mocked(prisma.game.findMany)).toHaveBeenCalledTimes(1)
  })

  it('should prioritize metadata match over exact title match', async () => {
    const gameWithBothMatches = {
      ...mockGame1,
      title: 'Half-Life 2',
      metadata: { steamAppId: '220' },
    }

    const steamAppIdToName = new Map([['220', 'Half-Life 2']])

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([gameWithBothMatches])

    const results = await repository.batchBySteamAppIds(steamAppIdToName)

    expect(results[0]?.matchStrategy).toBe('metadata')
  })

  it('should handle empty input gracefully', async () => {
    const emptyMap = new Map<string, string>()

    vi.mocked(prisma.game.findMany).mockResolvedValueOnce([])

    const results = await repository.batchBySteamAppIds(emptyMap)

    expect(results).toHaveLength(0)
  })
})
