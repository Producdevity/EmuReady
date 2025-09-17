import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  findTitleIdForGameName as findSwitchTitleIds,
  getBestTitleIdMatch as getSwitchBestTitleId,
  getSwitchGamesStats,
} from './switchGameSearch'
import {
  findThreeDsTitleIdForGameName,
  getBestThreeDsTitleIdMatch,
  getThreeDsGamesStats,
} from './threeDsGameSearch'
import {
  getBestTitleIdResult,
  getTitleIdProviders,
  getTitleIdStats,
  searchTitleIds,
} from './titleIdProviders'

vi.mock('./switchGameSearch', () => ({
  findTitleIdForGameName: vi.fn(),
  getBestTitleIdMatch: vi.fn(),
  getSwitchGamesStats: vi.fn(),
}))

vi.mock('./threeDsGameSearch', () => ({
  findThreeDsTitleIdForGameName: vi.fn(),
  getBestThreeDsTitleIdMatch: vi.fn(),
  getThreeDsGamesStats: vi.fn(),
}))

const mockSwitchSearch = vi.mocked(findSwitchTitleIds)
const mockSwitchBest = vi.mocked(getSwitchBestTitleId)
const mockSwitchStats = vi.mocked(getSwitchGamesStats)
const mockThreeDsSearch = vi.mocked(findThreeDsTitleIdForGameName)
const mockThreeDsBest = vi.mocked(getBestThreeDsTitleIdMatch)
const mockThreeDsStats = vi.mocked(getThreeDsGamesStats)

describe('titleIdProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns provider metadata', () => {
    const providers = getTitleIdProviders()

    expect(providers).toHaveLength(2)
    expect(providers[0]?.id).toBe('nintendo_switch')
    expect(providers[1]?.id).toBe('nintendo_3ds')
  })

  it('maps switch search results to unified shape', async () => {
    mockSwitchSearch.mockResolvedValueOnce([
      {
        titleId: '0100000000010000',
        name: 'Example Game',
        normalizedTitle: 'example game',
        score: 80,
      },
    ])

    const results = await searchTitleIds('nintendo_switch', 'Example', 5)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      providerId: 'nintendo_switch',
      productCode: null,
      region: undefined,
    })
  })

  it('maps 3DS search results with regional data', async () => {
    mockThreeDsSearch.mockResolvedValueOnce([
      {
        titleId: '00040000001A5F00',
        name: 'Mario Party Star Rush',
        normalizedTitle: 'mario party star rush',
        score: 92,
        region: 'US',
        productCode: 'CTR-N-BABE',
      },
    ])

    const results = await searchTitleIds('nintendo_3ds', 'Mario Party', 5)

    expect(results[0]).toMatchObject({
      providerId: 'nintendo_3ds',
      region: 'US',
      productCode: 'CTR-N-BABE',
    })
  })

  it('uses provider best match logic for 3DS', async () => {
    mockThreeDsBest.mockResolvedValueOnce('00040000001A5F00')
    mockThreeDsSearch.mockResolvedValueOnce([
      {
        titleId: '00040000001A5F00',
        name: 'Mario Party Star Rush',
        normalizedTitle: 'mario party star rush',
        score: 92,
        region: 'US',
        productCode: 'CTR-N-BABE',
      },
    ])

    const bestMatch = await getBestTitleIdResult('nintendo_3ds', 'Mario Party Star Rush')

    expect(mockThreeDsBest).toHaveBeenCalled()
    expect(bestMatch?.titleId).toBe('00040000001A5F00')
  })

  it('returns best match when provider threshold is met', async () => {
    mockSwitchBest.mockResolvedValueOnce('0100000000010000')
    mockSwitchSearch.mockResolvedValueOnce([
      {
        titleId: '0100000000010000',
        name: 'Example Game',
        normalizedTitle: 'example game',
        score: 80,
      },
    ])

    const bestMatch = await getBestTitleIdResult('nintendo_switch', 'Example Game')

    expect(bestMatch?.titleId).toBe('0100000000010000')
  })

  it('returns null when provider does not return a best match', async () => {
    mockSwitchBest.mockResolvedValueOnce(null)

    const bestMatch = await getBestTitleIdResult('nintendo_switch', 'Missing Game')

    expect(bestMatch).toBeNull()
  })

  it('returns provider statistics', async () => {
    mockSwitchStats.mockResolvedValueOnce({
      totalGames: 100,
      cacheStatus: 'hit',
      lastUpdated: new Date('2025-01-01T00:00:00Z'),
    })

    const stats = await getTitleIdStats('nintendo_switch')

    expect(stats.totalGames).toBe(100)
    expect(stats.cacheStatus).toBe('hit')
  })

  it('returns 3DS provider statistics', async () => {
    mockThreeDsStats.mockResolvedValueOnce({
      totalGames: 2500,
      cacheStatus: 'miss',
      lastUpdated: new Date('2025-03-15T12:00:00Z'),
    })

    const stats = await getTitleIdStats('nintendo_3ds')

    expect(stats.totalGames).toBe(2500)
    expect(stats.cacheStatus).toBe('miss')
  })
})
