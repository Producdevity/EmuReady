/**
 * Nintendo 3DS title ID lookup with fuzzy search and caching
 * Mirrors the Nintendo Switch lookup flow but sources data from the 3DS title manifest
 */

import Fuse from 'fuse.js'
import { ms } from '@/utils/time'
import { MemoryCache } from './cache'
import type { IFuseOptions } from 'fuse.js'

interface RawThreeDsTitleEntry {
  title_id: string
  product_code?: string
  platform_device?: string
  languages?: string[]
}

type RawThreeDsTitleMap = Record<string, RawThreeDsTitleEntry>
type RawThreeDsNamesMap = Record<string, Record<string, string>>

interface ThreeDsGameEntry {
  titleId: string
  name: string
  normalizedTitle: string
  aliases: string[]
  languages: string[]
  region: string
  productCode: string | null
}

export interface ThreeDsGameSearchResult {
  titleId: string
  name: string
  normalizedTitle: string
  score: number
  region: string
  productCode: string | null
}

const REGION_PRIORITY = [
  'US',
  'GB',
  'CA',
  'MX',
  'AU',
  'NZ',
  'EU',
  'FR',
  'DE',
  'ES',
  'IT',
  'NL',
  'PT',
  'SE',
  'NO',
  'DK',
  'FI',
  'JP',
]

const REGION_RANK = new Map(REGION_PRIORITY.map((code, index) => [code, index]))

const FUSE_OPTIONS: IFuseOptions<ThreeDsGameEntry> = {
  keys: [
    { name: 'name', weight: 0.55 },
    { name: 'normalizedTitle', weight: 0.3 },
    { name: 'aliases', weight: 0.15 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  distance: 45,
  minMatchCharLength: 2,
  ignoreLocation: true,
  findAllMatches: true,
}

const THREEDS_TITLES_URL = 'https://dantheman827.github.io/nus-info/titles.json'
const THREEDS_TITLE_NAMES_URL = 'https://dantheman827.github.io/nus-info/title-names.json'

const threeDsGamesDataCache = new MemoryCache<ThreeDsGameEntry[]>({
  ttl: ms.days(1),
  maxSize: 1,
})

const threeDsGamesFuseCache = new MemoryCache<Fuse<ThreeDsGameEntry>>({
  ttl: ms.days(1),
  maxSize: 1,
})

function normalizeTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2122\u00AE\u00A9]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getRegionRank(region: string): number {
  const rank = REGION_RANK.get(region)
  return rank !== undefined ? rank : REGION_PRIORITY.length
}

function pickPreferredName(
  names: Record<string, string> | undefined,
  languages: string[] | undefined,
): { name: string; region: string } | null {
  if (!names) return null

  const sanitizedEntries = Object.entries(names)
    .map(([region, value]) => ({ region, value: value?.trim() ?? '' }))
    .filter((entry) => entry.value.length > 0)

  if (sanitizedEntries.length === 0) return null

  for (const region of REGION_PRIORITY) {
    const entry = names[region]
    if (entry && entry.trim().length > 0) {
      return { name: entry.trim(), region }
    }
  }

  if (languages) {
    for (const region of languages) {
      const entry = names[region]
      if (entry && entry.trim().length > 0) {
        return { name: entry.trim(), region }
      }
    }
  }

  const fallback = sanitizedEntries.sort((a, b) => a.region.localeCompare(b.region))[0]
  return { name: fallback.value, region: fallback.region }
}

async function fetchThreeDsGamesData(): Promise<ThreeDsGameEntry[]> {
  const [titlesResponse, titleNamesResponse] = await Promise.all([
    fetch(THREEDS_TITLES_URL, {
      headers: { 'User-Agent': 'EmuReady-3DSLookup/1.0' },
    }),
    fetch(THREEDS_TITLE_NAMES_URL, {
      headers: { 'User-Agent': 'EmuReady-3DSLookup/1.0' },
    }),
  ])

  if (!titlesResponse.ok) {
    throw new Error(
      `Failed to fetch 3DS titles: ${titlesResponse.status} ${titlesResponse.statusText}`,
    )
  }

  if (!titleNamesResponse.ok) {
    throw new Error(
      `Failed to fetch 3DS title names: ${titleNamesResponse.status} ${titleNamesResponse.statusText}`,
    )
  }

  const titlesJson = (await titlesResponse.json()) as RawThreeDsTitleMap
  const namesJson = (await titleNamesResponse.json()) as RawThreeDsNamesMap

  const entries: ThreeDsGameEntry[] = []

  for (const metadata of Object.values(titlesJson)) {
    if (!metadata || metadata.platform_device !== 'CTR') continue
    if (!metadata.title_id || !metadata.title_id.startsWith('00040000')) continue

    const titleNames = namesJson[metadata.title_id]
    const preferred = pickPreferredName(titleNames, metadata.languages)
    if (!preferred) continue

    const normalizedTitle = normalizeTitle(preferred.name)
    if (!normalizedTitle) continue

    const aliasSet = new Set<string>()
    if (titleNames) {
      for (const value of Object.values(titleNames)) {
        const trimmed = value?.trim()
        if (trimmed && trimmed.length > 0) {
          aliasSet.add(trimmed)
        }
      }
    }
    aliasSet.delete(preferred.name)

    entries.push({
      titleId: metadata.title_id,
      name: preferred.name,
      normalizedTitle,
      aliases: Array.from(aliasSet),
      languages: metadata.languages ?? [],
      region: preferred.region,
      productCode: metadata.product_code ?? null,
    })
  }

  if (entries.length === 0) {
    throw new Error('3DS dataset contained no valid entries')
  }

  return entries
}

async function getThreeDsGamesData(): Promise<ThreeDsGameEntry[]> {
  const cacheKey = '3ds-games-data'
  const cached = threeDsGamesDataCache.get(cacheKey)
  if (cached) return cached

  try {
    const fresh = await fetchThreeDsGamesData()
    threeDsGamesDataCache.set(cacheKey, fresh)
    return fresh
  } catch (error) {
    if (error instanceof Error) {
      error.message = `3DS games data fetch failed: ${error.message}`
    }
    throw error
  }
}

async function getFuseInstance(): Promise<Fuse<ThreeDsGameEntry>> {
  const cacheKey = '3ds-games-fuse'
  const cached = threeDsGamesFuseCache.get(cacheKey)
  if (cached) return cached

  const games = await getThreeDsGamesData()
  const fuse = new Fuse(games, FUSE_OPTIONS)
  threeDsGamesFuseCache.set(cacheKey, fuse)
  return fuse
}

function calculateScore(
  item: ThreeDsGameEntry,
  fuseScore: number,
  searchTerm: string,
  normalizedSearchTerm: string,
  normalizedSearchWords: string[],
): number {
  const baseScore = Math.round((1 - fuseScore) * 100)

  let bonus = 0
  const lowerName = item.name.toLowerCase()

  if (item.normalizedTitle === normalizedSearchTerm) {
    bonus += 40
  } else if (item.normalizedTitle.includes(normalizedSearchTerm)) {
    bonus += 20
  }

  if (lowerName === searchTerm) {
    bonus += 25
  } else if (lowerName.includes(searchTerm)) {
    bonus += 12
  }

  const aliasesLower = item.aliases.map((alias) => alias.toLowerCase())
  const aliasesNormalized = item.aliases.map((alias) => normalizeTitle(alias))

  if (aliasesLower.includes(searchTerm)) {
    bonus += 18
  } else if (aliasesLower.some((alias) => alias.includes(searchTerm))) {
    bonus += 8
  }

  let wordMatchScore = 0
  for (const word of normalizedSearchWords) {
    if (word.length < 3) continue
    if (item.normalizedTitle.includes(word)) {
      wordMatchScore += 6
    } else if (aliasesNormalized.some((alias) => alias.includes(word))) {
      wordMatchScore += 4
    }
  }

  const isDemo = item.normalizedTitle.includes('demo')
  const isDlc = item.normalizedTitle.includes('dlc') || item.normalizedTitle.includes('pack')
  const searchesForDemo = normalizedSearchTerm.includes('demo')
  const searchesForDlc =
    normalizedSearchTerm.includes('dlc') || normalizedSearchTerm.includes('pack')

  let penalties = 0
  if (isDemo && !searchesForDemo) penalties -= 15
  if (isDlc && !searchesForDlc) penalties -= 10

  const rawScore = baseScore + bonus + wordMatchScore + penalties
  return Math.max(0, Math.min(100, rawScore))
}

export async function findThreeDsTitleIdForGameName(
  gameName: string,
  maxResults: number = 5,
): Promise<ThreeDsGameSearchResult[]> {
  const trimmed = gameName.trim()
  if (trimmed.length < 2) return []

  try {
    const fuse = await getFuseInstance()
    const searchTerm = trimmed.toLowerCase()
    const normalizedSearchTerm = normalizeTitle(trimmed)
    const normalizedSearchWords = normalizedSearchTerm.split(' ').filter((word) => word.length > 0)

    const rawResults = fuse.search(trimmed, { limit: maxResults * 3 })

    return rawResults
      .map((result) => {
        const item = result.item
        const fuseScore = result.score ?? 1
        const score = calculateScore(
          item,
          fuseScore,
          searchTerm,
          normalizedSearchTerm,
          normalizedSearchWords,
        )

        return {
          titleId: item.titleId,
          name: item.name,
          normalizedTitle: item.normalizedTitle,
          score,
          region: item.region,
          productCode: item.productCode,
        }
      })
      .filter((result) => result.score >= 40)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        const regionComparison = getRegionRank(a.region) - getRegionRank(b.region)
        if (regionComparison !== 0) return regionComparison
        return a.name.localeCompare(b.name)
      })
      .slice(0, maxResults)
  } catch (error) {
    console.error('Error searching for 3DS title ID:', error)
    return []
  }
}

export async function getBestThreeDsTitleIdMatch(gameName: string): Promise<string | null> {
  const results = await findThreeDsTitleIdForGameName(gameName, 1)
  return results.length > 0 && results[0].score >= 55 ? results[0].titleId : null
}

export async function refreshThreeDsGamesData(): Promise<void> {
  threeDsGamesDataCache.clear()
  threeDsGamesFuseCache.clear()
  await getThreeDsGamesData()
  await getFuseInstance()
}

export async function getThreeDsGamesStats(): Promise<{
  totalGames: number
  cacheStatus: 'hit' | 'miss' | 'empty'
  lastUpdated?: Date
}> {
  const cacheKey = '3ds-games-data'
  const cached = threeDsGamesDataCache.get(cacheKey)

  if (cached) {
    const lastUpdated = threeDsGamesDataCache.getCreatedAt(cacheKey)
    return {
      totalGames: cached.length,
      cacheStatus: 'hit',
      lastUpdated: lastUpdated ?? undefined,
    }
  }

  try {
    const fresh = await getThreeDsGamesData()
    const lastUpdated = threeDsGamesDataCache.getCreatedAt(cacheKey)
    return {
      totalGames: fresh.length,
      cacheStatus: 'miss',
      lastUpdated: lastUpdated ?? undefined,
    }
  } catch {
    return {
      totalGames: 0,
      cacheStatus: 'empty',
    }
  }
}

export function clearThreeDsCachesForTests(): void {
  threeDsGamesDataCache.clear()
  threeDsGamesFuseCache.clear()
}
