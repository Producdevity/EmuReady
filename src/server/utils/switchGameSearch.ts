/**
 * Nintendo Switch game data management with fuzzy search capabilities
 * Fetches and caches Switch game data from external source with periodic updates
 */

import Fuse from 'fuse.js'
import { ms } from '@/utils/time'
import { MemoryCache } from './cache'

// Types for Switch game data
interface SwitchGameEntry {
  program_id: string
  name: string
  title_normalized: string
}

interface SwitchGameSearchResult {
  titleId: string
  name: string
  normalizedTitle: string
  score: number
}

// Cache for Switch games data - longer TTL since data updates weekly
const switchGamesDataCache = new MemoryCache<SwitchGameEntry[]>({
  ttl: ms.days(1),
  maxSize: 1,
})

// Cache for Fuse.js search instance - rebuild when data updates
const switchGamesFuseCache = new MemoryCache<Fuse<SwitchGameEntry>>({
  ttl: ms.days(1),
  maxSize: 1,
})

// Configuration for fuzzy search
const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'title_normalized', weight: 0.3 },
  ],
  threshold: 0.4, // More strict threshold for better matches
  distance: 50, // Reduced distance for better precision
  minMatchCharLength: 3, // Require at least 3 characters to match
  includeScore: true,
  includeMatches: true, // Include match details for better filtering
  ignoreLocation: true, // Don't penalize matches at different positions
  findAllMatches: true, // Find all matching patterns
}

const SWITCH_GAMES_URL = 'https://producdevity.github.io/switch-games-json/switchbrew_id_names.json'

/**
 * Fetches Switch games data from external source
 */
async function fetchSwitchGamesData(): Promise<SwitchGameEntry[]> {
  const response = await fetch(SWITCH_GAMES_URL, {
    headers: { 'User-Agent': 'EmuReady-GameSearch/1.0' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Switch games data: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as SwitchGameEntry[]

  if (!Array.isArray(data)) {
    throw new Error('Invalid Switch games data format: expected array')
  }

  // Validate data structure
  for (const entry of data.slice(0, 5)) {
    // Check first 5 entries
    if (!entry.program_id || !entry.name || !entry.title_normalized) {
      throw new Error('Invalid Switch game entry structure')
    }
  }

  return data
}

/**
 * Gets cached Switch games data or fetches fresh data
 */
async function getSwitchGamesData(): Promise<SwitchGameEntry[]> {
  const cacheKey = 'switch-games-data'

  // Try to get from cache first
  const cachedData = switchGamesDataCache.get(cacheKey)
  if (cachedData) return cachedData

  // Fetch fresh data and cache it
  try {
    const freshData = await fetchSwitchGamesData()
    switchGamesDataCache.set(cacheKey, freshData)
    return freshData
  } catch (error) {
    // Add context to the error without losing the original stack trace
    if (error instanceof Error) {
      error.message = `Switch games data fetch failed: ${error.message}`
    }
    throw error
  }
}

/**
 * Gets or creates Fuse.js search instance
 */
async function getFuseInstance(): Promise<Fuse<SwitchGameEntry>> {
  const cacheKey = 'switch-games-fuse'

  // Try to get from cache first
  const cachedFuse = switchGamesFuseCache.get(cacheKey)
  if (cachedFuse) return cachedFuse

  // Create new Fuse instance with fresh data
  const gamesData = await getSwitchGamesData()
  const fuse = new Fuse(gamesData, FUSE_OPTIONS)

  switchGamesFuseCache.set(cacheKey, fuse)
  return fuse
}

/**
 * Searches for Nintendo Switch title ID based on game name using fuzzy matching
 * @param gameName - The name of the game to search for
 * @param maxResults - Maximum number of results to return (default: 5)
 * @returns Array of search results with title IDs and match scores
 */
export async function findTitleIdForGameName(
  gameName: string,
  maxResults: number = 5,
): Promise<SwitchGameSearchResult[]> {
  if (!gameName || gameName.trim().length < 2) return []

  try {
    const fuse = await getFuseInstance()
    const searchTerm = gameName.trim().toLowerCase()
    const searchResults = fuse.search(searchTerm, { limit: maxResults * 2 }) // Get more results for filtering

    // Filter and enhance results with better scoring
    const enhancedResults = searchResults
      .map((result) => {
        const item = result.item
        const fuseScore = result.score || 0

        // Calculate enhanced score based on multiple factors
        const nameMatch = item.name.toLowerCase()
        const normalizedMatch = item.title_normalized.toLowerCase()

        // Exact match bonus
        let bonusScore = 0
        if (nameMatch === searchTerm || normalizedMatch === searchTerm) {
          bonusScore = 40
        } else if (nameMatch.includes(searchTerm) || normalizedMatch.includes(searchTerm)) {
          bonusScore = 20
        }

        // Word match bonus
        const searchWords = searchTerm.split(' ').filter((w) => w.length > 2)
        const nameWords = nameMatch.split(' ')
        const normalizedWords = normalizedMatch.split(' ')

        let wordMatchScore = 0
        searchWords.forEach((searchWord) => {
          if (
            nameWords.some((w) => w.includes(searchWord)) ||
            normalizedWords.some((w) => w.includes(searchWord))
          ) {
            wordMatchScore += 10
          }
        })

        // Avoid demo/kiosk versions unless specifically searched for
        let demoBonus = 0
        const isDemo = nameMatch.includes('demo') || nameMatch.includes('kiosk')
        const searchesForDemo = searchTerm.includes('demo') || searchTerm.includes('kiosk')

        if (isDemo && !searchesForDemo) {
          demoBonus = -15 // Penalize demos if not specifically searched
        }

        // Final score calculation
        const baseScore = Math.round((1 - fuseScore) * 100)
        const finalScore = Math.min(
          100,
          Math.max(0, baseScore + bonusScore + wordMatchScore + demoBonus),
        )

        return {
          titleId: item.program_id,
          name: item.name,
          normalizedTitle: item.title_normalized,
          score: finalScore,
          isDemo,
        }
      })
      .filter((result) => result.score >= 30) // Only return results with decent scores
      .sort((a, b) => {
        // Prioritize non-demo versions if scores are close
        if (Math.abs(a.score - b.score) <= 10) {
          if (a.isDemo && !b.isDemo) return 1
          if (!a.isDemo && b.isDemo) return -1
        }
        return b.score - a.score
      })
      .slice(0, maxResults)

    // Remove the isDemo property from final results
    return enhancedResults.map(({ isDemo, ...result }) => result)
  } catch (error) {
    console.error('Error searching for Switch title ID:', error)
    return []
  }
}

/**
 * Gets the best matching title ID for a game name (highest score)
 * @param gameName - The name of the game to search for
 * @returns The best matching title ID or null if no good match found
 */
export async function getBestTitleIdMatch(gameName: string): Promise<string | null> {
  const results = await findTitleIdForGameName(gameName, 1)

  // Return the best match if score is good enough (>= 50% for more flexibility)
  return results.length > 0 && results[0].score >= 50 ? results[0].titleId : null
}

/**
 * Forces a refresh of the Switch games data cache
 * Useful for periodic updates or manual refresh
 */
export async function refreshSwitchGamesData(): Promise<void> {
  try {
    // Clear caches to force fresh fetch
    switchGamesDataCache.clear()
    switchGamesFuseCache.clear()

    // Pre-populate cache with fresh data
    await getSwitchGamesData()
    await getFuseInstance()
  } catch (error) {
    console.error('Error refreshing Switch games data:', error)
    throw error
  }
}

/**
 * Gets statistics about the cached Switch games data
 */
export async function getSwitchGamesStats(): Promise<{
  totalGames: number
  cacheStatus: 'hit' | 'miss' | 'empty'
  lastUpdated?: Date
}> {
  const cacheKey = 'switch-games-data'
  const cachedData = switchGamesDataCache.get(cacheKey)

  if (cachedData) {
    const lastUpdated = switchGamesDataCache.getCreatedAt(cacheKey)
    return {
      totalGames: cachedData.length,
      cacheStatus: 'hit',
      lastUpdated: lastUpdated || undefined,
    }
  }

  try {
    const freshData = await getSwitchGamesData()
    const lastUpdated = switchGamesDataCache.getCreatedAt(cacheKey)
    return {
      totalGames: freshData.length,
      cacheStatus: 'miss',
      lastUpdated: lastUpdated || undefined,
    }
  } catch {
    return {
      totalGames: 0,
      cacheStatus: 'empty',
    }
  }
}
