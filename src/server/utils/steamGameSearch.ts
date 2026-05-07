/**
 * Steam game data management with fuzzy search capabilities
 * Fetches and caches Steam game data from Steam Web API with periodic updates
 */

import Fuse from 'fuse.js'
import { ms } from '@/utils/time'
import { MemoryCache } from './cache'

// Types for Steam game data
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

// Cache for Steam games data - longer TTL since the list is large and updates periodically
const steamGamesDataCache = new MemoryCache<SteamAppEntry[]>({
  ttl: ms.days(1),
  maxSize: 1,
})

// Cache for Fuse.js search instance - rebuild when data updates
const steamGamesFuseCache = new MemoryCache<Fuse<SteamAppEntry>>({
  ttl: ms.days(1),
  maxSize: 1,
})

// Configuration for fuzzy search
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
const FETCH_TIMEOUT_MS = 30_000 // 30s — avoids hanging on serverless cold starts
const PAGE_SIZE = 50_000 // max allowed by the API

// In-flight deduplication: prevents concurrent cold starts from each firing a fetch
let inflightFetch: Promise<SteamAppEntry[]> | null = null

/**
 * Fetches Steam games data from IStoreService/GetAppList/v1 with pagination.
 * Requires STEAM_API_KEY env var.
 */
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

/**
 * Gets cached Steam games data or fetches fresh data
 */
export async function getSteamGamesData(): Promise<SteamAppEntry[]> {
  const cacheKey = 'steam-games-data'

  const cachedData = steamGamesDataCache.get(cacheKey)
  if (cachedData) return cachedData

  // Deduplicate concurrent fetches so only one in-flight request runs at a time
  if (!inflightFetch) {
    inflightFetch = fetchSteamGamesData().finally(() => {
      inflightFetch = null
    })
  }

  try {
    const freshData = await inflightFetch
    steamGamesDataCache.set(cacheKey, freshData)
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

/**
 * Gets or creates Fuse.js search instance
 */
async function getFuseInstance(): Promise<Fuse<SteamAppEntry>> {
  const cacheKey = 'steam-games-fuse'

  // Try to get from cache first
  const cachedFuse = steamGamesFuseCache.get(cacheKey)
  if (cachedFuse) return cachedFuse

  // Create new Fuse instance with fresh data
  const gamesData = await getSteamGamesData()
  const fuse = new Fuse(gamesData, FUSE_OPTIONS)

  steamGamesFuseCache.set(cacheKey, fuse)
  return fuse
}

/**
 * Normalizes a title for better matching
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Searches for Steam App ID based on game name using fuzzy matching
 * @param gameName - The name of the game to search for
 * @param maxResults - Maximum number of results to return (default: 5)
 * @returns Array of search results with app IDs and match scores
 */
export async function findSteamAppIdForGameName(
  gameName: string,
  maxResults: number = 5,
): Promise<SteamGameSearchResult[]> {
  if (!gameName || gameName.trim().length < 2) return []

  try {
    const fuse = await getFuseInstance()
    const searchTerm = gameName.trim().toLowerCase()
    const searchResults = fuse.search(searchTerm, { limit: maxResults * 2 })

    // Filter and enhance results with better scoring
    const enhancedResults = searchResults
      .map((result) => {
        const item = result.item
        const fuseScore = result.score || 0

        // Calculate enhanced score based on multiple factors
        const nameMatch = item.name.toLowerCase()
        const normalizedMatch = normalizeTitle(item.name)

        // Exact match bonus
        let bonusScore = 0
        if (nameMatch === searchTerm || normalizedMatch === normalizeTitle(searchTerm)) {
          bonusScore = 40
        } else if (nameMatch.includes(searchTerm) || normalizedMatch.includes(searchTerm)) {
          bonusScore = 20
        }

        // Word match bonus
        const searchWords = searchTerm.split(' ').filter((w) => w.length > 2)
        const nameWords = nameMatch.split(' ')

        let wordMatchScore = 0
        searchWords.forEach((searchWord) => {
          if (nameWords.some((w) => w.includes(searchWord))) {
            wordMatchScore += 10
          }
        })

        // Penalize soundtrack/dlc/demo entries unless specifically searched for
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

        // Final score calculation
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
        // Prioritize main game versions if scores are close
        if (Math.abs(a.score - b.score) <= 10) {
          const aExtra = a.isDlc || a.isSoundtrack || a.isDemo
          const bExtra = b.isDlc || b.isSoundtrack || b.isDemo
          if (aExtra && !bExtra) return 1
          if (!aExtra && bExtra) return -1
        }
        return b.score - a.score
      })
      .slice(0, maxResults)

    // Remove the extra properties from final results
    return enhancedResults.map(({ isDlc, isSoundtrack, isDemo, ...result }) => result)
  } catch (error) {
    console.error('Error searching for Steam App ID:', error)
    return []
  }
}

/**
 * Gets the best matching App ID for a game name (highest score)
 * @param gameName - The name of the game to search for
 * @returns The best matching App ID or null if no good match found
 */
export async function getBestSteamAppIdMatch(gameName: string): Promise<string | null> {
  const results = await findSteamAppIdForGameName(gameName, 1)
  return results.length > 0 && results[0].score >= 50 ? results[0].appId : null
}

/**
 * Forces a refresh of the Steam games data cache
 */
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

/**
 * Gets statistics about the cached Steam games data
 */
export async function getSteamGamesStats(): Promise<{
  totalGames: number
  cacheStatus: 'hit' | 'miss' | 'empty'
  lastUpdated?: Date
}> {
  const cacheKey = 'steam-games-data'
  const cachedData = steamGamesDataCache.get(cacheKey)

  if (cachedData) {
    const lastUpdated = steamGamesDataCache.getCreatedAt(cacheKey)
    return {
      totalGames: cachedData.length,
      cacheStatus: 'hit',
      lastUpdated: lastUpdated || undefined,
    }
  }

  try {
    const freshData = await getSteamGamesData()
    const lastUpdated = steamGamesDataCache.getCreatedAt(cacheKey)
    return {
      totalGames: freshData.length,
      cacheStatus: 'miss',
      lastUpdated: lastUpdated || undefined,
    }
  } catch (error) {
    console.error('[steamGameSearch] getSteamGamesStats failed to load data:', error)
    return {
      totalGames: 0,
      cacheStatus: 'empty',
    }
  }
}
