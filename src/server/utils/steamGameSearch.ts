import Fuse from 'fuse.js'
import { LRUCache } from 'lru-cache'
import { CACHE_DURATIONS } from '@/data/constants'

interface SteamAppEntry {
  appid: number
  name: string
}

interface SteamStoreApiResponse {
  response: {
    apps: (SteamAppEntry & { last_modified?: number; price_change_number?: number })[]
    have_more_results?: boolean
    last_appid?: number
  }
}

interface SteamGameSearchResult {
  appId: string
  name: string
  normalizedTitle: string
  score: number
}

interface CachedData<T> {
  data: T
  createdAt: Date
}

const steamGamesDataCache = new LRUCache<string, CachedData<SteamAppEntry[]>>({
  ttl: CACHE_DURATIONS.STATIC,
  max: 1,
})

const steamGamesFuseCache = new LRUCache<string, Fuse<SteamAppEntry>>({
  ttl: CACHE_DURATIONS.STATIC,
  max: 1,
})

const FUSE_OPTIONS = {
  keys: [{ name: 'name', weight: 1.0 }],
  threshold: 0.4,
  distance: 50,
  minMatchCharLength: 3,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  findAllMatches: true,
}

// ISteamApps/GetAppList/v2 was removed by Valve. The replacement requires a key.
const STEAM_STORE_API_URL = 'https://api.steampowered.com/IStoreService/GetAppList/v1/'
const FETCH_TIMEOUT_MS = 30_000
const PAGE_SIZE = 50_000

let inflightFetch: Promise<SteamAppEntry[]> | null = null

async function fetchSteamGamesData(): Promise<SteamAppEntry[]> {
  const apiKey = process.env.STEAM_API_KEY
  if (!apiKey) {
    throw new Error('STEAM_API_KEY environment variable is not set')
  }

  const allApps: SteamAppEntry[] = []
  let lastAppId: number | undefined

  do {
    const url = new URL(STEAM_STORE_API_URL)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('include_games', '1')
    url.searchParams.set('include_dlc', '0')
    url.searchParams.set('include_software', '0')
    url.searchParams.set('include_videos', '0')
    url.searchParams.set('include_hardware', '0')
    url.searchParams.set('max_results', String(PAGE_SIZE))
    if (lastAppId !== undefined) {
      url.searchParams.set('last_appid', String(lastAppId))
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(url, {
        headers: { 'User-Agent': 'EmuReady-GameSearch/1.0' },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch Steam games data: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as SteamStoreApiResponse

    if (!data.response || !Array.isArray(data.response.apps)) {
      throw new Error('Invalid Steam games data format: expected response.apps array')
    }

    for (const entry of data.response.apps) {
      if (entry.name) allApps.push({ appid: entry.appid, name: entry.name })
    }

    lastAppId = data.response.have_more_results ? data.response.last_appid : undefined
  } while (lastAppId !== undefined)

  return allApps
}

export async function getSteamGamesData(): Promise<SteamAppEntry[]> {
  const cacheKey = 'steam-games-data'

  const cachedData = steamGamesDataCache.get(cacheKey)
  if (cachedData) return cachedData.data

  if (!inflightFetch) {
    inflightFetch = fetchSteamGamesData().finally(() => {
      inflightFetch = null
    })
  }

  try {
    const freshData = await inflightFetch
    steamGamesDataCache.set(cacheKey, { data: freshData, createdAt: new Date() })
    return freshData
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[steamGameSearch] fetchSteamGamesData failed:', message)
    if (error instanceof Error) {
      error.message = `Steam games data fetch failed: ${message}`
    }
    throw error
  }
}

async function getFuseInstance(): Promise<Fuse<SteamAppEntry>> {
  const cacheKey = 'steam-games-fuse'

  const cachedFuse = steamGamesFuseCache.get(cacheKey)
  if (cachedFuse) return cachedFuse

  const gamesData = await getSteamGamesData()
  const fuse = new Fuse(gamesData, FUSE_OPTIONS)

  steamGamesFuseCache.set(cacheKey, fuse)
  return fuse
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function findSteamAppIdForGameName(
  gameName: string,
  maxResults: number = 5,
): Promise<SteamGameSearchResult[]> {
  if (!gameName || gameName.trim().length < 2) return []

  try {
    const fuse = await getFuseInstance()
    const searchTerm = gameName.trim().toLowerCase()
    const searchResults = fuse.search(searchTerm, { limit: maxResults * 2 })

    const enhancedResults = searchResults
      .map((result) => {
        const item = result.item
        const fuseScore = result.score || 0

        const nameMatch = item.name.toLowerCase()
        const normalizedMatch = normalizeTitle(item.name)

        let bonusScore = 0
        if (nameMatch === searchTerm || normalizedMatch === normalizeTitle(searchTerm)) {
          bonusScore = 40
        } else if (nameMatch.includes(searchTerm) || normalizedMatch.includes(searchTerm)) {
          bonusScore = 20
        }

        const searchWords = searchTerm.split(' ').filter((w) => w.length > 2)
        const nameWords = nameMatch.split(' ')

        let wordMatchScore = 0
        searchWords.forEach((searchWord) => {
          if (nameWords.some((w) => w.includes(searchWord))) {
            wordMatchScore += 10
          }
        })

        let contentBonus = 0
        const lowerName = nameMatch
        const isDlc =
          lowerName.includes('dlc') ||
          lowerName.includes('downloadable content') ||
          lowerName.includes('expansion')
        const isSoundtrack = lowerName.includes('soundtrack') || lowerName.includes('ost')
        const isDemo = lowerName.includes('demo') || lowerName.includes('playtest')

        const searchesForDlc = searchTerm.includes('dlc') || searchTerm.includes('expansion')
        const searchesForSoundtrack =
          searchTerm.includes('soundtrack') || searchTerm.includes('ost')
        const searchesForDemo = searchTerm.includes('demo') || searchTerm.includes('playtest')

        if (isDlc && !searchesForDlc) contentBonus = -15
        if (isSoundtrack && !searchesForSoundtrack) contentBonus = -15
        if (isDemo && !searchesForDemo) contentBonus = -15

        const baseScore = Math.round((1 - fuseScore) * 100)
        const finalScore = Math.min(
          100,
          Math.max(0, baseScore + bonusScore + wordMatchScore + contentBonus),
        )

        return {
          appId: String(item.appid),
          name: item.name,
          normalizedTitle: normalizeTitle(item.name),
          score: finalScore,
          isDlc,
          isSoundtrack,
          isDemo,
        }
      })
      .filter((result) => result.score >= 30)
      .sort((a, b) => {
        if (Math.abs(a.score - b.score) <= 10) {
          const aExtra = a.isDlc || a.isSoundtrack || a.isDemo
          const bExtra = b.isDlc || b.isSoundtrack || b.isDemo
          if (aExtra && !bExtra) return 1
          if (!aExtra && bExtra) return -1
        }
        return b.score - a.score
      })
      .slice(0, maxResults)

    return enhancedResults.map(({ isDlc, isSoundtrack, isDemo, ...result }) => result)
  } catch (error) {
    console.error('Error searching for Steam App ID:', error)
    return []
  }
}

export async function getBestSteamAppIdMatch(gameName: string): Promise<string | null> {
  const results = await findSteamAppIdForGameName(gameName, 1)
  return results.length > 0 && results[0].score >= 50 ? results[0].appId : null
}

export async function refreshSteamGamesData(): Promise<void> {
  try {
    steamGamesDataCache.clear()
    steamGamesFuseCache.clear()
    await getSteamGamesData()
    await getFuseInstance()
  } catch (error) {
    console.error('Error refreshing Steam games data:', error)
    throw error
  }
}

export async function getSteamGamesStats(): Promise<{
  totalGames: number
  cacheStatus: 'hit' | 'miss' | 'empty'
  lastUpdated?: Date
}> {
  const cacheKey = 'steam-games-data'
  const cachedData = steamGamesDataCache.get(cacheKey)

  if (cachedData) {
    return {
      totalGames: cachedData.data.length,
      cacheStatus: 'hit',
      lastUpdated: cachedData.createdAt,
    }
  }

  try {
    const freshData = await getSteamGamesData()
    const cached = steamGamesDataCache.get(cacheKey)
    return {
      totalGames: freshData.length,
      cacheStatus: 'miss',
      lastUpdated: cached?.createdAt,
    }
  } catch (error) {
    console.error('[steamGameSearch] getSteamGamesStats failed to load data:', error)
    return {
      totalGames: 0,
      cacheStatus: 'empty',
    }
  }
}
