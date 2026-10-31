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
  it.each(['headers', 'body'])(
    'releases a load stalled while reading %s after its deadline',
    async (phase) => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const controller = new AbortController()
      const deadline = new DOMException('Catalog deadline', 'TimeoutError')
      const timeout = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal)
      const network = Promise.withResolvers<Response>()
      fetchMock.mockImplementation(async (_input, options) => {
        const signal = options?.signal ?? controller.signal
        if (phase === 'body') {
          return new Response(
            new ReadableStream<Uint8Array>({
              start(stream) {
                signal.addEventListener('abort', () => stream.error(signal.reason), { once: true })
              },
            }),
          )
        }
        signal.addEventListener('abort', () => network.reject(signal.reason), { once: true })
        return network.promise
      })
      const catalog = await import('./switchGameSearch')
      const load = catalog.refreshSwitchGamesData().catch((error: unknown) => error)

      try {
        expect(timeout).toHaveBeenCalledWith(30_000)
        expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
        controller.abort(deadline)
        expect(await load).toBe(deadline)
        timeout.mockRestore()
        fetchMock.mockResolvedValue(Response.json(games))
        expect((await catalog.findTitleIdForGameName('Test Adventure'))[0]?.titleId).toBe(
          games[0].program_id,
        )
      } finally {
        controller.abort(new Error('Test cleanup'))
        if (phase === 'headers') network.reject(new Error('Test cleanup'))
        await load
      }
    },
  )

  it.each([true, false])(
    'keeps refreshed data when the older lookup finishes first: %s',
    async (oldFirst) => {
      const old = Promise.withResolvers<Response>()
      const fresh = Promise.withResolvers<Response>()
      const freshGames = [
        { ...games[0], program_id: '01006A800016E001' },
        { program_id: '01006A800016E002', name: 'Other Game', title_normalized: 'other game' },
      ]
      fetchMock.mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise)
      const catalog = await import('./switchGameSearch')
      const lookup = catalog.findTitleIdForGameName('Test Adventure')
      const refresh = catalog.refreshSwitchGamesData()

      try {
        expect(fetchMock).toHaveBeenCalledTimes(2)
        if (oldFirst) {
          old.resolve(Response.json(games))
          await lookup
          const concurrent = catalog.findTitleIdForGameName('Test Adventure')
          expect(fetchMock).toHaveBeenCalledTimes(2)
          fresh.resolve(Response.json(freshGames))
          await Promise.all([refresh, concurrent])
        } else {
          fresh.resolve(Response.json(freshGames))
          await refresh
          old.resolve(Response.json(games))
          await lookup
        }
        expect((await catalog.findTitleIdForGameName('Test Adventure'))[0]?.titleId).toBe(
          freshGames[0].program_id,
        )
        expect((await catalog.getSwitchGamesStats()).totalGames).toBe(2)
        expect(fetchMock).toHaveBeenCalledTimes(2)
      } finally {
        old.resolve(Response.json(games))
        fresh.resolve(Response.json(freshGames))
        await Promise.allSettled([lookup, refresh])
      }
    },
  )

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
