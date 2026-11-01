import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearThreeDsCachesForTests,
  findThreeDsTitleIdForGameName,
  getBestThreeDsTitleIdMatch,
  getThreeDsGamesStats,
  refreshThreeDsGamesData,
} from './threeDsGameSearch'

const TITLES_URL = 'https://dantheman827.github.io/nus-info/titles.json'
const TITLE_NAMES_URL = 'https://dantheman827.github.io/nus-info/title-names.json'

const sampleTitles = {
  '00040000001A5F00': {
    title_id: '00040000001A5F00',
    product_code: 'CTR-N-BABE',
    platform_device: 'CTR',
    languages: ['US', 'JP'],
  },
  '000400000019C200': {
    title_id: '000400000019C200',
    product_code: 'CTR-P-BNEP',
    platform_device: 'CTR',
    languages: ['US', 'GB'],
  },
  '01006A800016E800': {
    title_id: '01006A800016E800',
    product_code: 'HAC-BPAXA-USA',
    platform_device: 'HAC',
    languages: ['US'],
  },
}

const sampleNames = {
  '00040000001A5F00': {
    US: 'Mario Party Star Rush',
    JP: 'マリオパーティースターラッシュ',
  },
  '000400000019C200': {
    US: 'The Legend of Zelda: Tri Force Heroes',
    GB: 'The Legend of Zelda: Tri Force Heroes',
  },
  '01006A800016E800': {
    US: 'The Legend of Zelda: Tears of the Kingdom',
  },
}

function toUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  return input.url
}

function createJsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>

function createFetchMock(): FetchMock {
  return vi.fn<typeof fetch>(async (input) => {
    const url = toUrl(input)
    if (url === TITLES_URL) {
      return createJsonResponse(sampleTitles)
    }
    if (url === TITLE_NAMES_URL) {
      return createJsonResponse(sampleNames)
    }

    throw new Error(`Unexpected fetch URL: ${url}`)
  })
}

describe('threeDsGameSearch', () => {
  const originalFetch = global.fetch
  let fetchMock: FetchMock

  beforeEach(() => {
    clearThreeDsCachesForTests()
    fetchMock = createFetchMock()
    global.fetch = fetchMock
  })

  afterEach(() => {
    clearThreeDsCachesForTests()
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it.each(['headers', 'body'])(
    'releases a load stalled while reading %s after its deadline',
    async (phase) => {
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
      const load = refreshThreeDsGamesData().catch((error: unknown) => error)

      try {
        expect(timeout).toHaveBeenCalledWith(30_000)
        expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
        expect(fetchMock.mock.calls[1]?.[1]?.signal).toBe(controller.signal)
        controller.abort(deadline)
        expect(await load).toBe(deadline)
        timeout.mockRestore()
        fetchMock.mockImplementation(createFetchMock())
        expect((await findThreeDsTitleIdForGameName('Mario Party Star Rush'))[0]?.titleId).toBe(
          '00040000001A5F00',
        )
      } finally {
        controller.abort(new Error('Test cleanup'))
        if (phase === 'headers') network.reject(new Error('Test cleanup'))
        await load
      }
    },
  )

  it.each([
    { operation: 'refresh', oldFirst: true },
    { operation: 'refresh', oldFirst: false },
    { operation: 'clear', oldFirst: false },
  ])('keeps refreshed data after $operation with oldFirst=$oldFirst', async (options) => {
    const oldTitles = Promise.withResolvers<Response>()
    const oldNames = Promise.withResolvers<Response>()
    const freshTitles = Promise.withResolvers<Response>()
    const freshNames = Promise.withResolvers<Response>()
    const freshId = '00040000001A5F01'
    const titles = { [freshId]: { title_id: freshId, platform_device: 'CTR' } }
    const names = { [freshId]: { US: 'Mario Party Star Rush' } }
    fetchMock
      .mockReturnValueOnce(oldTitles.promise)
      .mockReturnValueOnce(oldNames.promise)
      .mockReturnValueOnce(freshTitles.promise)
      .mockReturnValueOnce(freshNames.promise)
    const lookup = findThreeDsTitleIdForGameName('Mario Party Star Rush')
    if (options.operation === 'clear') clearThreeDsCachesForTests()
    const reload =
      options.operation === 'refresh'
        ? refreshThreeDsGamesData()
        : findThreeDsTitleIdForGameName('Mario Party Star Rush')

    try {
      expect(fetchMock).toHaveBeenCalledTimes(4)
      if (options.oldFirst) {
        oldTitles.resolve(createJsonResponse(sampleTitles))
        oldNames.resolve(createJsonResponse(sampleNames))
        await lookup
        const concurrent = findThreeDsTitleIdForGameName('Mario Party Star Rush')
        expect(fetchMock).toHaveBeenCalledTimes(4)
        freshTitles.resolve(createJsonResponse(titles))
        freshNames.resolve(createJsonResponse(names))
        await Promise.all([reload, concurrent])
      } else {
        freshTitles.resolve(createJsonResponse(titles))
        freshNames.resolve(createJsonResponse(names))
        await reload
        oldTitles.resolve(createJsonResponse(sampleTitles))
        oldNames.resolve(createJsonResponse(sampleNames))
        await lookup
      }
      expect((await findThreeDsTitleIdForGameName('Mario Party Star Rush'))[0]?.titleId).toBe(
        freshId,
      )
      expect((await getThreeDsGamesStats()).totalGames).toBe(1)
      expect(fetchMock).toHaveBeenCalledTimes(4)
    } finally {
      oldTitles.resolve(createJsonResponse(sampleTitles))
      oldNames.resolve(createJsonResponse(sampleNames))
      freshTitles.resolve(createJsonResponse(titles))
      freshNames.resolve(createJsonResponse(names))
      await Promise.allSettled([lookup, reload])
    }
  })

  it('finds title IDs for matching Nintendo 3DS games', async () => {
    const results = await findThreeDsTitleIdForGameName('Mario Party Star Rush')

    expect(results).toHaveLength(1)
    expect(results[0]?.titleId).toBe('00040000001A5F00')
    expect(results[0]?.name).toBe('Mario Party Star Rush')
    expect(results[0]?.region).toBe('US')
    expect(results[0]?.score).toBeGreaterThanOrEqual(70)
  })

  it('returns null when no strong match is found', async () => {
    const titleId = await getBestThreeDsTitleIdMatch('Nonexistent Game Title')
    expect(titleId).toBeNull()
  })

  it('caches dataset between lookups', async () => {
    await findThreeDsTitleIdForGameName('Mario Party Star Rush')
    await findThreeDsTitleIdForGameName('Tri Force Heroes')

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shares the two dataset downloads between warmup and concurrent lookups', async () => {
    const [, first, second, stats] = await Promise.all([
      refreshThreeDsGamesData(),
      findThreeDsTitleIdForGameName('Mario Party Star Rush'),
      findThreeDsTitleIdForGameName('Mario Party Star Rush'),
      getThreeDsGamesStats(),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(first[0]?.titleId).toBe('00040000001A5F00')
    expect(second).toEqual(first)
    expect(stats.totalGames).toBe(2)
  })

  it('allows another download after a failed load', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Upstream unavailable'))

    await expect(refreshThreeDsGamesData()).rejects.toThrow('Upstream unavailable')
    const results = await findThreeDsTitleIdForGameName('Mario Party Star Rush')

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(results[0]?.titleId).toBe('00040000001A5F00')
  })

  it('filters out non-3DS platform entries', async () => {
    const results = await findThreeDsTitleIdForGameName('Tears of the Kingdom')
    expect(results).toHaveLength(0)
  })
})
