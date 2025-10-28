/**
 * Steam Game Batch Matcher
 * Efficiently matches Steam App IDs to games in the database
 * Optimized for large batches (up to 1000 Steam App IDs)
 */

import { ms } from '@/utils/time'
import { MemoryCache } from './cache'
import { getSteamGamesData } from './steamGameSearch'

// Validation constants
const MAX_STEAM_APP_ID = 10000000
const MAX_BATCH_SIZE = 1000

interface SteamAppInfo {
  appid: number
  name: string
}

interface GameMatchResult {
  steamAppId: string
  gameName: string | null
  matchStrategy: 'metadata' | 'exact' | 'normalized' | 'not_found'
}

// Cache for Steam App ID → Game Name mappings (1 hour TTL)
const steamAppNameCache = new MemoryCache<string>({
  ttl: ms.hours(1),
  maxSize: 10000, // Cache up to 10k mappings
})

/**
 * Normalize game titles for better matching
 * Removes special characters, extra spaces, and converts to lowercase
 */
export function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, '') // Remove trademark symbols
    .replace(/[:\-–—]/g, ' ') // Convert separators to spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
}

/**
 * Get Steam app information from our cached Steam app list
 * This reuses the cache from our existing Steam App ID search feature
 */
async function getSteamAppInfo(appIds: string[]): Promise<Map<string, SteamAppInfo>> {
  const result = new Map<string, SteamAppInfo>()

  try {
    // Get all Steam apps from cache (already implemented in steamGameSearch.ts)
    const allSteamApps = await getSteamGamesData()

    // Create a lookup map for O(1) access
    const steamAppMap = new Map<string, SteamAppInfo>()
    for (const app of allSteamApps) {
      steamAppMap.set(String(app.appid), app)
    }

    // Look up each requested app ID
    for (const appId of appIds) {
      const cacheKey = `steam-app-${appId}`

      // Try cache first
      const cachedName = steamAppNameCache.get(cacheKey)
      if (cachedName) {
        result.set(appId, { appid: Number(appId), name: cachedName })
        continue
      }

      // Lookup in Steam app list
      const appInfo = steamAppMap.get(appId)
      if (appInfo) {
        result.set(appId, appInfo)
        steamAppNameCache.set(cacheKey, appInfo.name)
      }
    }
  } catch (error) {
    console.error('Error fetching Steam app info:', error)
  }

  return result
}

/**
 * Match Steam App IDs to game names
 * Returns a map of steamAppId → game name (or null if not found)
 */
export async function matchSteamAppIdsToNames(steamAppIds: string[]): Promise<GameMatchResult[]> {
  const results: GameMatchResult[] = []

  // Get Steam app information for all requested IDs
  const steamApps = await getSteamAppInfo(steamAppIds)

  for (const appId of steamAppIds) {
    const appInfo = steamApps.get(appId)

    if (appInfo) {
      results.push({
        steamAppId: appId,
        gameName: appInfo.name,
        matchStrategy: 'exact', // Will be determined by the database query
      })
    } else {
      results.push({
        steamAppId: appId,
        gameName: null,
        matchStrategy: 'not_found',
      })
    }
  }

  return results
}

/**
 * Create normalized title mappings for fallback matching
 */
export function createNormalizedTitleMap(gameMatches: GameMatchResult[]): Map<string, string> {
  const normalizedMap = new Map<string, string>()

  for (const match of gameMatches) {
    if (match.gameName) {
      const normalized = normalizeGameTitle(match.gameName)
      normalizedMap.set(normalized, match.steamAppId)
    }
  }

  return normalizedMap
}

/**
 * Batch validation for Steam App IDs
 * Ensures all IDs are valid and within reasonable limits
 */
export function validateSteamAppIds(steamAppIds: string[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check batch size
  if (steamAppIds.length === 0) {
    errors.push('Batch cannot be empty')
  }

  if (steamAppIds.length > MAX_BATCH_SIZE) {
    errors.push(`Batch size exceeds maximum limit of ${MAX_BATCH_SIZE}`)
  }

  // Check for duplicates
  const uniqueIds = new Set(steamAppIds)
  if (uniqueIds.size !== steamAppIds.length) {
    errors.push('Batch contains duplicate Steam App IDs')
  }

  // Validate each ID format
  for (const appId of steamAppIds) {
    if (!appId || typeof appId !== 'string') {
      errors.push(`Invalid Steam App ID format: ${appId}`)
      break
    }

    // Steam App IDs are numeric strings
    if (!/^\d+$/.test(appId)) {
      errors.push(`Invalid Steam App ID format: ${appId}`)
      break
    }

    // Reasonable range check (Steam App IDs are typically < 10 million)
    const numericId = Number(appId)
    if (numericId < 0 || numericId > MAX_STEAM_APP_ID) {
      errors.push(`Steam App ID out of valid range: ${appId}`)
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
