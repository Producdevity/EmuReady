import {
  TITLE_ID_PLATFORM_IDS,
  type TitleIdPlatformId,
  type TitleIdProviderInfo,
  type TitleIdSearchResult,
  type TitleIdStats,
} from '@/schemas/titleId'
import {
  findSteamAppIdForGameName,
  getBestSteamAppIdMatch,
  getSteamGamesStats,
} from './steamGameSearch'
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

interface TitleIdProvider {
  id: TitleIdPlatformId
  label: string
  description: string
  supportsStats: boolean
  search: (gameName: string, maxResults: number) => Promise<TitleIdSearchResult[]>
  bestMatch: (gameName: string) => Promise<TitleIdSearchResult | null>
  stats?: () => Promise<TitleIdStats>
}

function mapSwitchResults(
  providerId: TitleIdPlatformId,
  results: Awaited<ReturnType<typeof findSwitchTitleIds>>,
): TitleIdSearchResult[] {
  return results.map((result) => ({
    titleId: result.titleId,
    name: result.name,
    normalizedTitle: result.normalizedTitle,
    score: result.score,
    region: undefined,
    productCode: null,
    providerId,
    raw: result,
  }))
}

function mapThreeDsResults(
  providerId: TitleIdPlatformId,
  results: Awaited<ReturnType<typeof findThreeDsTitleIdForGameName>>,
): TitleIdSearchResult[] {
  return results.map((result) => ({
    titleId: result.titleId,
    name: result.name,
    normalizedTitle: result.normalizedTitle,
    score: result.score,
    region: result.region,
    productCode: result.productCode ?? null,
    providerId,
    raw: result,
  }))
}

function mapSteamResults(
  providerId: TitleIdPlatformId,
  results: Awaited<ReturnType<typeof findSteamAppIdForGameName>>,
): TitleIdSearchResult[] {
  return results.map((result) => ({
    titleId: result.appId,
    name: result.name,
    normalizedTitle: result.normalizedTitle,
    score: result.score,
    region: undefined,
    productCode: null,
    providerId,
    raw: result,
  }))
}

const providers: TitleIdProvider[] = [
  {
    id: 'nintendo_switch',
    label: 'Nintendo Switch',
    description: 'Fuzzy search against the Nintendo Switch title catalog (program IDs).',
    supportsStats: true,
    search: async (gameName, maxResults) => {
      const results = await findSwitchTitleIds(gameName, maxResults)
      return mapSwitchResults('nintendo_switch', results)
    },
    bestMatch: async (gameName) => {
      const bestTitleId = await getSwitchBestTitleId(gameName)
      if (!bestTitleId) return null

      const results = await findSwitchTitleIds(gameName, 1)
      const mapped = mapSwitchResults('nintendo_switch', results)
      return mapped[0] ?? null
    },
    stats: async () => getSwitchGamesStats(),
  },
  {
    id: 'nintendo_3ds',
    label: 'Nintendo 3DS',
    description: 'Lookup across Nintendo 3DS title manifests with regional metadata.',
    supportsStats: true,
    search: async (gameName, maxResults) => {
      const results = await findThreeDsTitleIdForGameName(gameName, maxResults)
      return mapThreeDsResults('nintendo_3ds', results)
    },
    bestMatch: async (gameName) => {
      const bestTitleId = await getBestThreeDsTitleIdMatch(gameName)
      if (!bestTitleId) return null

      const results = await findThreeDsTitleIdForGameName(gameName, 1)
      const mapped = mapThreeDsResults('nintendo_3ds', results)
      return mapped[0] ?? null
    },
    stats: async () => getThreeDsGamesStats(),
  },
  {
    id: 'steam',
    label: 'Steam',
    description: 'Fuzzy search against the Steam app catalog (App IDs).',
    supportsStats: true,
    search: async (gameName, maxResults) => {
      const results = await findSteamAppIdForGameName(gameName, maxResults)
      return mapSteamResults('steam', results)
    },
    bestMatch: async (gameName) => {
      const bestAppId = await getBestSteamAppIdMatch(gameName)
      if (!bestAppId) return null

      const results = await findSteamAppIdForGameName(gameName, 1)
      const mapped = mapSteamResults('steam', results)
      return mapped[0] ?? null
    },
    stats: async () => getSteamGamesStats(),
  },
]

export function getTitleIdProviders(): TitleIdProviderInfo[] {
  return providers.map((provider) => ({
    id: provider.id,
    label: provider.label,
    description: provider.description,
    supportsStats: provider.supportsStats && typeof provider.stats === 'function',
  }))
}

export function getTitleIdProvider(id: TitleIdPlatformId): TitleIdProvider | null {
  return providers.find((provider) => provider.id === id) ?? null
}

export function assertTitleIdPlatform(id: string): asserts id is TitleIdPlatformId {
  if (!TITLE_ID_PLATFORM_IDS.includes(id as TitleIdPlatformId)) {
    throw new Error(`Unsupported title ID provider: ${id}`)
  }
}

export async function searchTitleIds(
  platformId: TitleIdPlatformId,
  gameName: string,
  maxResults: number,
): Promise<TitleIdSearchResult[]> {
  const provider = getTitleIdProvider(platformId)
  if (!provider) {
    throw new Error(`Title ID provider not found: ${platformId}`)
  }
  return provider.search(gameName, maxResults)
}

export async function getBestTitleIdResult(
  platformId: TitleIdPlatformId,
  gameName: string,
): Promise<TitleIdSearchResult | null> {
  const provider = getTitleIdProvider(platformId)
  if (!provider) {
    throw new Error(`Title ID provider not found: ${platformId}`)
  }
  return provider.bestMatch(gameName)
}

export async function getTitleIdStats(platformId: TitleIdPlatformId): Promise<TitleIdStats> {
  const provider = getTitleIdProvider(platformId)
  if (!provider || !provider.stats) {
    throw new Error(`Title ID provider stats not available: ${platformId}`)
  }
  return provider.stats()
}
