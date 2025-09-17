import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearThreeDsCachesForTests,
  findThreeDsTitleIdForGameName,
  getBestThreeDsTitleIdMatch,
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

  it('filters out non-3DS platform entries', async () => {
    const results = await findThreeDsTitleIdForGameName('Tears of the Kingdom')
    expect(results).toHaveLength(0)
  })
})
