import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@orm/client'

const validateSteamAppIdsMock = vi.hoisted(() => vi.fn())
const matchSteamAppIdsToNamesMock = vi.hoisted(() => vi.fn())
const batchBySteamAppIdsMock = vi.hoisted(() => vi.fn())

const steamBatchQueryCacheMock = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}))

const gamesRepositoryMock = vi.hoisted(() =>
  vi.fn().mockImplementation(function MockGamesRepository() {
    return {
      batchBySteamAppIds: batchBySteamAppIdsMock,
    }
  }),
)

vi.mock('@/server/utils/cache', () => ({
  steamBatchQueryCache: steamBatchQueryCacheMock,
}))

vi.mock('@/server/utils/steamGameBatcher', () => ({
  validateSteamAppIds: validateSteamAppIdsMock,
  matchSteamAppIdsToNames: matchSteamAppIdsToNamesMock,
}))

vi.mock('@/server/repositories/games.repository', () => ({
  GamesRepository: gamesRepositoryMock,
}))

const { lookupGamesBySteamAppIds } = await import('./steam-batch-lookup.service')

const prisma = {} as PrismaClient

const gameWithListing = {
  id: 'game-1',
  title: 'Half-Life 2',
  normalizedTitle: 'half life 2',
  systemId: 'system-1',
  imageUrl: null,
  boxartUrl: null,
  bannerUrl: null,
  tgdbGameId: null,
  metadata: { steamAppId: '220' },
  isErotic: false,
  ageRating: null,
  status: 'APPROVED',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  system: {
    id: 'system-1',
    name: 'PC',
    key: 'pc',
  },
  _count: {
    listings: 1,
  },
  listings: [
    {
      id: 'listing-1',
      deviceId: 'device-1',
      gameId: 'game-1',
      emulatorId: 'emulator-1',
      performanceId: 1,
      notes: 'Runs well',
      upvoteCount: 4,
      downvoteCount: 1,
      voteCount: 5,
      successRate: 0.8,
      device: {
        id: 'device-1',
        modelName: 'Pocket',
        soc: null,
      },
      emulator: {
        id: 'emulator-1',
        name: 'GameHub',
        logo: null,
      },
      performance: {
        id: 1,
        label: 'Perfect',
        rank: 1,
        description: null,
      },
      customFieldValues: [],
    },
  ],
}

describe('lookupGamesBySteamAppIds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validateSteamAppIdsMock.mockReturnValue({ valid: true, errors: [] })
    steamBatchQueryCacheMock.get.mockReturnValue(undefined)
  })

  it('rejects invalid Steam App IDs before cache, Steam metadata, or repository work', async () => {
    validateSteamAppIdsMock.mockReturnValue({
      valid: false,
      errors: ['Invalid Steam App ID format: abc'],
    })

    await expect(
      lookupGamesBySteamAppIds(
        {
          steamAppIds: ['abc'],
          maxListingsPerGame: 1,
        },
        { prisma },
      ),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Invalid Steam App ID format: abc',
    })

    expect(steamBatchQueryCacheMock.get).not.toHaveBeenCalled()
    expect(matchSteamAppIdsToNamesMock).not.toHaveBeenCalled()
    expect(gamesRepositoryMock).not.toHaveBeenCalled()
  })

  it('preserves unresolved Steam App IDs as not found results', async () => {
    matchSteamAppIdsToNamesMock.mockResolvedValue([
      { steamAppId: '999', gameName: null, matchStrategy: 'not_found' },
      { steamAppId: '220', gameName: 'Half-Life 2', matchStrategy: 'exact' },
    ])
    batchBySteamAppIdsMock.mockResolvedValue([
      {
        steamAppId: '220',
        game: gameWithListing,
        matchStrategy: 'exact',
      },
    ])

    const response = await lookupGamesBySteamAppIds(
      {
        steamAppIds: ['999', '220'],
        emulatorName: 'GameHub',
        maxListingsPerGame: 1,
        minimal: true,
      },
      { prisma, showNsfw: false },
    )

    expect(response).toMatchObject({
      success: true,
      totalRequested: 2,
      totalFound: 1,
      totalNotFound: 1,
    })
    expect(response.results).toEqual([
      {
        game_id: null,
        steam_app_id: '999',
        title: null,
        performance: null,
        emulator: null,
        device: null,
        listing: null,
      },
      {
        game_id: 'game-1',
        steam_app_id: '220',
        title: 'Half-Life 2',
        performance: gameWithListing.listings[0].performance,
        emulator: gameWithListing.listings[0].emulator,
        device: gameWithListing.listings[0].device,
        listing: {
          id: 'listing-1',
          notes: 'Runs well',
          upvoteCount: 4,
          downvoteCount: 1,
          voteCount: 5,
          successRate: 0.8,
        },
      },
    ])

    const repositoryInput = batchBySteamAppIdsMock.mock.calls[0]?.[0]
    expect(repositoryInput).toBeInstanceOf(Map)
    if (!(repositoryInput instanceof Map)) throw new Error('Expected repository input to be a Map')

    expect(Array.from(repositoryInput.entries())).toEqual([['220', 'Half-Life 2']])
    expect(batchBySteamAppIdsMock).toHaveBeenCalledWith(repositoryInput, {
      emulatorName: 'GameHub',
      maxListingsPerGame: 1,
      showNsfw: false,
    })
    expect(steamBatchQueryCacheMock.set).toHaveBeenCalledWith(
      'batch:999,220:GameHub:1:false:true',
      response,
    )
  })
})
