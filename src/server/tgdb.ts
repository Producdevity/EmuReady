import axios, { type AxiosResponse } from 'axios'
import { isValidImageUrl } from '@/lib/tgdb-utils'
import {
  tgdbGamesCache,
  tgdbImagesCache,
  tgdbPlatformsCache,
  tgdbImageUrlsCache,
  tgdbGameImagesCache,
  createCacheKey,
} from '@/server/utils/cache'
import scoreGameMatch from '@/server/utils/scoreGameMatch'
import getErrorMessage from '@/utils/getErrorMessage'
import type {
  TGDBGamesByNameResponse,
  TGDBGamesImagesResponse,
  TGDBPlatformsResponse,
  GameImageOption,
} from '@/types/tgdb'

export class TGDBError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
  ) {
    super(message)
    this.name = 'TGDBError'
  }
}

const TGDB_BASE_URL = 'https://api.thegamesdb.net'

function getApiKey(): string {
  const apiKey = process.env.THE_GAMES_DB_API_KEY
  if (!apiKey) {
    throw new Error('THE_GAMES_DB_API_KEY environment variable is required')
  }
  return apiKey
}

async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await axios.get(
      `${TGDB_BASE_URL}${endpoint}`,
      {
        params: {
          apikey: getApiKey(),
          ...params,
        },
        headers: {
          'User-Agent': 'EmuReady/1.0',
        },
      },
    )

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const statusText = error.response?.statusText ?? 'Unknown error'
      const payload = error.response?.data
        ? JSON.stringify(error.response.data)
        : ''

      throw new TGDBError(
        `TGDB API error: ${status} ${statusText} – ${payload}`,
        status,
        endpoint,
      )
    }

    throw new TGDBError(
      `Failed to fetch from TGDB API: ${getErrorMessage(error)}`,
      undefined,
      endpoint,
    )
  }
}

export async function searchGames(
  query: string,
  tgdbPlatformId?: number,
  page = 1,
  _pageSize = 10,
): Promise<TGDBGamesByNameResponse> {
  if (!query.trim()) {
    throw new TGDBError('Search query cannot be empty')
  }

  // Create cache key for this search
  const cacheKey = createCacheKey(
    'tgdb:searchGames',
    query.trim(),
    tgdbPlatformId ?? 'none',
    page,
  )

  // Check cache first
  const cached = tgdbGamesCache.get(cacheKey)
  if (cached) return cached

  const params: Record<string, string | number> = {
    name: query.trim(),
    page: page.toString(),
    include: 'boxart',
  }

  // Add platform filter if platform ID is provided
  if (tgdbPlatformId) {
    params['filter[platform]'] = tgdbPlatformId.toString()
  }

  const response = await makeRequest<TGDBGamesByNameResponse>(
    '/v1.1/Games/ByGameName',
    params,
  )

  // Score and sort the results if we have games
  if (response.data.games.length > 0) {
    const scoredResults = response.data.games.map((game, originalIndex) => ({
      game,
      score: scoreGameMatch(game.game_title, query.trim()),
      originalIndex,
    }))

    // Sort by score (descending), then by original index (ascending) for ties
    scoredResults.sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : a.originalIndex - b.originalIndex,
    )

    response.data.games = scoredResults.map((item) => item.game)
  }

  // Cache the response
  tgdbGamesCache.set(cacheKey, response)

  return response
}

// Helper function to get boxart URL from search response
export function getBoxartUrlFromGame(
  gameId: number,
  searchResponse: TGDBGamesByNameResponse,
): string | undefined {
  const gameIdStr = gameId.toString()
  const boxartData = searchResponse.include?.boxart?.data[gameIdStr]

  // Early returns to avoid deep nesting
  if (!boxartData?.length) return undefined
  if (!searchResponse.include?.boxart?.base_url) return undefined

  const firstBoxart = boxartData[0]
  if (!firstBoxart?.filename) return undefined

  const imageUrl = `${searchResponse.include.boxart.base_url.original}${firstBoxart.filename}`
  return isValidImageUrl(imageUrl) ? imageUrl : undefined
}

export async function getGameImages(
  gameIds: number[],
): Promise<TGDBGamesImagesResponse> {
  if (gameIds.length === 0) {
    throw new TGDBError('At least one game ID is required')
  }

  // Create cache key for this images request
  const sortedIds = [...gameIds].sort((a, b) => a - b) // Sort for consistent caching
  const cacheKey = createCacheKey('tgdb:getGameImages', sortedIds.join(','))

  // Check cache first
  const cached = tgdbImagesCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const response = await makeRequest<TGDBGamesImagesResponse>(
    '/v1/Games/Images',
    {
      games_id: gameIds.join(','),
      'filter[type]': 'boxart,fanart,banner,screenshot,clearlogo,titlescreen',
    },
  )

  // Cache the response
  tgdbImagesCache.set(cacheKey, response)

  return response
}

export async function getPlatforms(): Promise<TGDBPlatformsResponse> {
  // Create cache key for platforms (this data rarely changes)
  const cacheKey = createCacheKey('tgdb:getPlatforms')

  // Check cache first
  const cached = tgdbPlatformsCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const response = await makeRequest<TGDBPlatformsResponse>('/v1/Platforms')

  // Cache the response with longer TTL since platforms don't change often
  tgdbPlatformsCache.set(cacheKey, response, 60 * 60 * 1000) // 1 hour

  return response
}

export async function getGameImageUrls(
  gameId: number,
): Promise<{ boxartUrl?: string; bannerUrl?: string }> {
  // Create cache key for this specific game's image URLs
  const cacheKey = createCacheKey('tgdb:getGameImageUrls', gameId)

  // Check cache first
  const cached = tgdbImageUrlsCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const imagesResponse = await getGameImages([gameId])

    const gameIdStr = gameId.toString()
    const gameImagesData = imagesResponse.data.images[gameIdStr] ?? []

    // Use functional approach to find images
    const validImages = gameImagesData
      .filter((image) => image.filename && imagesResponse.data.base_url)
      .map((image) => ({
        ...image,
        fullUrl: `${imagesResponse.data.base_url!.original}${image.filename}`,
      }))
      .filter((image) => isValidImageUrl(image.fullUrl))

    const boxartUrl = validImages.find((img) => img.type === 'boxart')?.fullUrl
    let bannerUrl = validImages.find((img) => img.type === 'banner')?.fullUrl

    // Try alternative image types if banner is not found
    bannerUrl ??= validImages.find(
      (img) => img.type === 'fanart' || img.type === 'clearlogo',
    )?.fullUrl

    const result = { boxartUrl, bannerUrl }

    // Cache the result
    tgdbImageUrlsCache.set(cacheKey, result)

    return result
  } catch (error) {
    console.error(
      `❌ Error fetching game image URLs from TGDB for game ${gameId}:`,
      error,
    )
    return {}
  }
}

export async function searchGameImages(
  query: string,
  tgdbPlatformId?: number,
): Promise<Map<number, GameImageOption[]>> {
  // Create cache key for this search
  const cacheKey = createCacheKey(
    'tgdb:searchGameImages',
    query.trim(),
    tgdbPlatformId ?? 'none',
  )

  // Check cache first - need to handle Map serialization
  const cached = tgdbGameImagesCache.get(cacheKey)
  if (cached) {
    // Convert cached object back to Map
    const resultMap = new Map<number, GameImageOption[]>()
    Object.entries(cached).forEach(([gameId, images]) => {
      resultMap.set(parseInt(gameId), images)
    })
    return resultMap
  }

  const gamesResponse = await searchGames(query, tgdbPlatformId, 1, 20)
  const gameImageMap = new Map<number, GameImageOption[]>()

  if (gamesResponse.data.games.length === 0) {
    // Cache empty result too
    tgdbGameImagesCache.set(cacheKey, {})
    return gameImageMap
  }

  try {
    // Get images for all found games
    const gameIds = gamesResponse.data.games.map((game) => game.id)
    const imagesResponse = await getGameImages(gameIds)

    // Process each game's images using functional approach
    gamesResponse.data.games.forEach((game) => {
      const boxartImages = createBoxartImages(game, gamesResponse)
      const otherImages = createOtherImages(game, imagesResponse)

      // Combine and deduplicate images based on URL
      const allImages = [...boxartImages, ...otherImages]
      const uniqueImages = allImages.reduce((acc, image) => {
        const existingImage = acc.find((existing) => existing.url === image.url)
        return existingImage ? acc : [...acc, image]
      }, [] as GameImageOption[])

      if (uniqueImages.length > 0) {
        gameImageMap.set(game.id, uniqueImages)
      }
    })

    // Cache the result - convert Map to plain object for JSON serialization
    const cacheObject: Record<string, GameImageOption[]> = {}
    gameImageMap.forEach((images, gameId) => {
      cacheObject[gameId.toString()] = images
    })
    tgdbGameImagesCache.set(cacheKey, cacheObject)
  } catch (error) {
    console.error('Error fetching game images from TGDB:', error)
    // Continue without images rather than failing completely
  }

  return gameImageMap
}

// Helper function to create boxart images from games response
function createBoxartImages(
  game: TGDBGamesByNameResponse['data']['games'][0],
  gamesResponse: TGDBGamesByNameResponse,
): GameImageOption[] {
  const gameIdStr = game.id.toString()
  const boxartData = gamesResponse.include?.boxart?.data[gameIdStr]

  if (!boxartData || !gamesResponse.include?.boxart?.base_url) return []

  return boxartData
    .filter((boxart) => boxart.filename)
    .map((boxart, index) => {
      const url = `${gamesResponse.include!.boxart!.base_url.original}${boxart.filename}`
      return {
        filename: boxart.filename,
        url,
        resolution: boxart.resolution,
        id: boxart.id,
        index, // Add index to ensure uniqueness
      }
    })
    .filter((boxart) => isValidImageUrl(boxart.url))
    .map((boxart) => ({
      id: `tgdb-${game.id}-boxart-${boxart.id}`,
      url: boxart.url,
      type: 'boxart' as const,
      source: 'tgdb' as const,
      gameId: game.id,
      gameName: game.game_title,
      width: boxart.resolution
        ? parseInt(boxart.resolution.split('x')[0])
        : undefined,
      height: boxart.resolution
        ? parseInt(boxart.resolution.split('x')[1])
        : undefined,
    }))
}

/**
 * Creates other image types (fanart, banner, etc.) from TGDB images response.
 * @param game - The game object from TGDB search response.
 * @param imagesResponse - The full images response from TGDB.
 */
function createOtherImages(
  game: TGDBGamesByNameResponse['data']['games'][0],
  imagesResponse: TGDBGamesImagesResponse,
): GameImageOption[] {
  const gameIdStr = game.id.toString()
  const gameImagesData = imagesResponse.data.images[gameIdStr] ?? []

  return imagesResponse.data.base_url
    ? gameImagesData
        .filter((image) => image.filename)
        .map((image) => {
          const url = `${imagesResponse.data.base_url!.original}${image.filename}`
          return {
            ...image,
            url,
          }
        })
        .filter((image) => isValidImageUrl(image.url))
        .map((image) => ({
          id: `tgdb-${game.id}-${image.type}-${image.id}`,
          url: image.url,
          type: image.type as GameImageOption['type'],
          source: 'tgdb' as const,
          gameId: game.id,
          gameName: game.game_title,
          width: image.resolution
            ? parseInt(image.resolution.split('x')[0])
            : undefined,
          height: image.resolution
            ? parseInt(image.resolution.split('x')[1])
            : undefined,
        }))
    : []
}
