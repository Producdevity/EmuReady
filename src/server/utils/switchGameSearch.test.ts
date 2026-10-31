import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const games = [
  { program_id: '01006A800016E000', name: 'Test Adventure', title_normalized: 'test adventure' },
]

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.resetModules()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Switch catalog loading', () => {
  it('shares one download between a warmup and concurrent lookups', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(games)))
    const catalog = await import('./switchGameSearch')

    const [, first, second, stats] = await Promise.all([
      catalog.refreshSwitchGamesData(),
      catalog.findTitleIdForGameName('Test Adventure'),
      catalog.findTitleIdForGameName('Test Adventure'),
      catalog.getSwitchGamesStats(),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(first[0]?.titleId).toBe(games[0].program_id)
    expect(second).toEqual(first)
    expect(stats.totalGames).toBe(1)
  })

  it('allows another download after a failed load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock
      .mockRejectedValueOnce(new Error('Upstream unavailable'))
      .mockResolvedValueOnce(new Response(JSON.stringify(games)))
    const catalog = await import('./switchGameSearch')

    await expect(catalog.refreshSwitchGamesData()).rejects.toThrow('Upstream unavailable')
    const results = await catalog.findTitleIdForGameName('Test Adventure')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(results[0]?.titleId).toBe(games[0].program_id)
  })
})
