import Fuse from 'fuse.js'
import { LRUCache } from 'lru-cache'
import { ms } from '@/utils/time'

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

interface CachedData<T> {
  data: T
  createdAt: Date
}

const switchGamesDataCache = new LRUCache<string, CachedData<SwitchGameEntry[]>>({
  ttl: ms.days(1),
  max: 1,
})

const switchGamesFuseCache = new LRUCache<string, Fuse<SwitchGameEntry>>({
  ttl: ms.days(1),
  max: 1,
})

const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.7 },
    { name: 'title_normalized', weight: 0.3 },
  ],
  threshold: 0.4,
  distance: 50,
  minMatchCharLength: 3,
  includeScore: true,
  includeMatches: true,
  ignoreLocation: true,
  findAllMatches: true,
}

const SWITCH_GAMES_URL = 'https://producdevity.github.io/switch-games-json/switchbrew_id_names.json'

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

  for (const entry of data.slice(0, 5)) {
    if (!entry.program_id || !entry.name || !entry.title_normalized) {
      throw new Error('Invalid Switch game entry structure')
    }
  }

  return data
}

async function getSwitchGamesData(): Promise<SwitchGameEntry[]> {
  const cacheKey = 'switch-games-data'

  const cachedData = switchGamesDataCache.get(cacheKey)
  if (cachedData) return cachedData.data

  try {
    const freshData = await fetchSwitchGamesData()
    switchGamesDataCache.set(cacheKey, { data: freshData, createdAt: new Date() })
    return freshData
  } catch (error) {
    if (error instanceof Error) {
      error.message = `Switch games data fetch failed: ${error.message}`
    }
    throw error
  }
}

async function getFuseInstance(): Promise<Fuse<SwitchGameEntry>> {
  const cacheKey = 'switch-games-fuse'

  const cachedFuse = switchGamesFuseCache.get(cacheKey)
  if (cachedFuse) return cachedFuse

  const gamesData = await getSwitchGamesData()
  const fuse = new Fuse(gamesData, FUSE_OPTIONS)

  switchGamesFuseCache.set(cacheKey, fuse)
  return fuse
}

export async function findTitleIdForGameName(
  gameName: string,
  maxResults: number = 5,
): Promise<SwitchGameSearchResult[]> {
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
        const normalizedMatch = item.title_normalized.toLowerCase()

        let bonusScore = 0
        if (nameMatch === searchTerm || normalizedMatch === searchTerm) {
          bonusScore = 40
        } else if (nameMatch.includes(searchTerm) || normalizedMatch.includes(searchTerm)) {
          bonusScore = 20
        }

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

        let demoBonus = 0
        const isDemo = nameMatch.includes('demo') || nameMatch.includes('kiosk')
        const searchesForDemo = searchTerm.includes('demo') || searchTerm.includes('kiosk')

        if (isDemo && !searchesForDemo) {
          demoBonus = -15
        }

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
      .filter((result) => result.score >= 30)
      .sort((a, b) => {
        if (Math.abs(a.score - b.score) <= 10) {
          if (a.isDemo && !b.isDemo) return 1
          if (!a.isDemo && b.isDemo) return -1
        }
        return b.score - a.score
      })
      .slice(0, maxResults)

    return enhancedResults.map(({ isDemo, ...result }) => result)
  } catch (error) {
    console.error('Error searching for Switch title ID:', error)
    return []
  }
}

export async function getBestTitleIdMatch(gameName: string): Promise<string | null> {
  const results = await findTitleIdForGameName(gameName, 1)

  return results.length > 0 && results[0].score >= 50 ? results[0].titleId : null
}

export async function refreshSwitchGamesData(): Promise<void> {
  try {
    switchGamesDataCache.clear()
    switchGamesFuseCache.clear()

    await getSwitchGamesData()
    await getFuseInstance()
  } catch (error) {
    console.error('Error refreshing Switch games data:', error)
    throw error
  }
}

export async function getSwitchGamesStats(): Promise<{
  totalGames: number
  cacheStatus: 'hit' | 'miss' | 'empty'
  lastUpdated?: Date
}> {
  const cacheKey = 'switch-games-data'
  const cachedData = switchGamesDataCache.get(cacheKey)

  if (cachedData) {
    return {
      totalGames: cachedData.data.length,
      cacheStatus: 'hit',
      lastUpdated: cachedData.createdAt,
    }
  }

  try {
    const freshData = await getSwitchGamesData()
    const cached = switchGamesDataCache.get(cacheKey)
    return {
      totalGames: freshData.length,
      cacheStatus: 'miss',
      lastUpdated: cached?.createdAt,
    }
  } catch {
    return {
      totalGames: 0,
      cacheStatus: 'empty',
    }
  }
}
