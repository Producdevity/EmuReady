import { LRUCache } from 'lru-cache'
import { ms } from '@/utils/time'
import { getSteamGamesData } from './steamGameSearch'

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

const steamAppNameCache = new LRUCache<string, string>({
  ttl: ms.hours(1),
  max: 10000,
})

export function normalizeGameTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
}

async function getSteamAppInfo(appIds: string[]): Promise<Map<string, SteamAppInfo>> {
  const result = new Map<string, SteamAppInfo>()

  try {
    const allSteamApps = await getSteamGamesData()

    const steamAppMap = new Map<string, SteamAppInfo>()
    for (const app of allSteamApps) {
      steamAppMap.set(String(app.appid), app)
    }

    for (const appId of appIds) {
      const cacheKey = `steam-app-${appId}`

      const cachedName = steamAppNameCache.get(cacheKey)
      if (cachedName) {
        result.set(appId, { appid: Number(appId), name: cachedName })
        continue
      }

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

export async function matchSteamAppIdsToNames(steamAppIds: string[]): Promise<GameMatchResult[]> {
  const results: GameMatchResult[] = []

  const steamApps = await getSteamAppInfo(steamAppIds)

  for (const appId of steamAppIds) {
    const appInfo = steamApps.get(appId)

    if (appInfo) {
      results.push({
        steamAppId: appId,
        gameName: appInfo.name,
        matchStrategy: 'exact',
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

export function validateSteamAppIds(steamAppIds: string[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (steamAppIds.length === 0) {
    errors.push('Batch cannot be empty')
  }

  if (steamAppIds.length > MAX_BATCH_SIZE) {
    errors.push(`Batch size exceeds maximum limit of ${MAX_BATCH_SIZE}`)
  }

  const uniqueIds = new Set(steamAppIds)
  if (uniqueIds.size !== steamAppIds.length) {
    errors.push('Batch contains duplicate Steam App IDs')
  }

  for (const appId of steamAppIds) {
    if (!appId || typeof appId !== 'string') {
      errors.push(`Invalid Steam App ID format: ${appId}`)
      break
    }

    if (!/^\d+$/.test(appId)) {
      errors.push(`Invalid Steam App ID format: ${appId}`)
      break
    }

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
