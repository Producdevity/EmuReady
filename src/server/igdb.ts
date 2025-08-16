import axios, { type AxiosResponse } from 'axios'
import { IGDB_ADULT_THEME_IDS, IGDBGameCategory } from '@/types/igdb'
import getErrorMessage from '@/utils/getErrorMessage'
import type {
  IGDBGame,
  IGDBSearchResponse,
  GameImageOption,
  IGDBPlatformCategory,
} from '@/types/igdb'

export class IGDBError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
  ) {
    super(message)
    this.name = 'IGDBError'
  }
}

const IGDB_BASE_URL = 'https://api.igdb.com/v4'
const IGDB_IMAGE_BASE_URL = 'https://images.igdb.com/igdb/image/upload'

function getClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_IGDB_CLIENT_ID
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_IGDB_CLIENT_ID environment variable is required')
  }
  return clientId
}

function getClientSecret(): string {
  const clientSecret = process.env.IGDB_CLIENT_KEY
  if (!clientSecret) {
    throw new Error('IGDB_CLIENT_KEY environment variable is required')
  }
  return clientSecret
}

// Token management for IGDB OAuth
let accessToken: string | null = null
let tokenExpiry: number | null = null

async function getAccessToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken
  }

  // Get new token
  try {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: getClientId(),
        client_secret: getClientSecret(),
        grant_type: 'client_credentials',
      },
    })

    accessToken = response.data.access_token
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000

    return accessToken!
  } catch (error) {
    throw new IGDBError(
      `Failed to get IGDB access token: ${getErrorMessage(error)}`,
      undefined,
      'oauth/token',
    )
  }
}

async function makeRequest<T>(endpoint: string, body: string): Promise<T> {
  try {
    const token = await getAccessToken()

    const response: AxiosResponse<T> = await axios.post(`${IGDB_BASE_URL}${endpoint}`, body, {
      headers: {
        'Client-ID': getClientId(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
    })

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const statusText = error.response?.statusText ?? 'Unknown error'
      const payload = error.response?.data ? JSON.stringify(error.response.data) : ''

      // If token expired, clear it and retry once
      if (status === 401 && accessToken) {
        accessToken = null
        tokenExpiry = null
        return makeRequest<T>(endpoint, body)
      }

      throw new IGDBError(`IGDB API error: ${status} ${statusText} – ${payload}`, status, endpoint)
    }

    throw new IGDBError(
      `Failed to fetch from IGDB API: ${getErrorMessage(error)}`,
      undefined,
      endpoint,
    )
  }
}

// Build IGDB image URL with specified size
export function buildImageUrl(
  imageId: string,
  size:
    | 'thumb'
    | 'cover_small'
    | 'cover_big'
    | 'screenshot_med'
    | 'screenshot_big'
    | '1080p'
    | 'screenshot_huge' = 'cover_big',
): string {
  return `${IGDB_IMAGE_BASE_URL}/t_${size}/${imageId}.jpg`
}

// Check if a game has adult/NSFW content
export function isAdultContent(game: IGDBGame): boolean {
  // Check if game has adult themes
  if (game.themes?.some((theme) => IGDB_ADULT_THEME_IDS.includes(theme.id))) return true

  // TODO: Check age ratings (PEGI 18, ESRB M/AO, etc.)
  // TODO: This would require fetching age_ratings data

  return false
}

// Extract best images for our database fields
export function extractGameImages(game: IGDBGame): {
  imageUrl: string | null
  boxartUrl: string | null
  bannerUrl: string | null
} {
  const result = {
    imageUrl: null as string | null,
    boxartUrl: null as string | null,
    bannerUrl: null as string | null,
  }

  // Cover image as boxart
  if (game.cover?.image_id) {
    result.boxartUrl = buildImageUrl(game.cover.image_id, 'cover_big')
    // Use cover as fallback for main image too
    result.imageUrl = result.boxartUrl
  }

  // Try to find a good banner image from artworks
  if (game.artworks && game.artworks.length > 0) {
    // Find the widest artwork (likely to be banner-like)
    const widestArtwork = game.artworks.reduce((prev, current) => {
      const prevRatio = prev.width / prev.height
      const currentRatio = current.width / current.height
      return currentRatio > prevRatio ? current : prev
    })

    if (widestArtwork.image_id) {
      result.bannerUrl = buildImageUrl(widestArtwork.image_id, 'screenshot_big')
    }
  }

  // Use first screenshot as fallback for banner
  if (!result.bannerUrl && game.screenshots && game.screenshots.length > 0) {
    const screenshot = game.screenshots[0]
    if (screenshot.image_id) {
      result.bannerUrl = buildImageUrl(screenshot.image_id, 'screenshot_big')
    }
  }

  // Use first screenshot as fallback for main image if no cover
  if (!result.imageUrl && game.screenshots && game.screenshots.length > 0) {
    const screenshot = game.screenshots[0]
    if (screenshot.image_id) {
      result.imageUrl = buildImageUrl(screenshot.image_id, 'screenshot_med')
    }
  }

  return result
}

// Search games with platform filter
export async function searchGames(
  query: string,
  platformId?: number | null,
  limit = 20,
  includeAllCategories = false,
): Promise<IGDBSearchResponse> {
  if (!query.trim()) {
    throw new IGDBError('Search query cannot be empty')
  }

  // Build the query
  let igdbQuery = `search "${query.trim()}";`
  igdbQuery +=
    ' fields id,name,cover.*,artworks.*,screenshots.*,platforms.*,genres.*,themes.*,summary,storyline,first_release_date,category;'

  // Build where clause for filtering
  const whereConditions: string[] = []

  // Filter by platform if specified
  if (platformId) {
    whereConditions.push(`platforms = (${platformId})`)
  }

  // Filter to only main games by default (exclude DLCs, expansions, etc.)
  if (!includeAllCategories) {
    whereConditions.push(`category = ${IGDBGameCategory.MAIN_GAME}`)
  }

  // Add where clause if we have conditions
  if (whereConditions.length > 0) {
    igdbQuery += ` where ${whereConditions.join(' & ')};`
  }

  igdbQuery += ` limit ${limit};`

  const games = await makeRequest<IGDBGame[]>('/games', igdbQuery)

  return {
    games,
    count: games.length,
  }
}

// Get game details by ID
export async function getGameById(gameId: number): Promise<IGDBGame | null> {
  const query = `fields *,cover.*,artworks.*,screenshots.*,platforms.*,genres.*,themes.*; where id = ${gameId};`

  const games = await makeRequest<IGDBGame[]>('/games', query)

  return games.length > 0 ? games[0] : null
}

// Get all available images for a game (for image selector)
export async function getGameImages(gameId: number): Promise<GameImageOption[]> {
  const game = await getGameById(gameId)

  if (!game) return []

  const images: GameImageOption[] = []

  // Add cover image
  if (game.cover?.image_id) {
    images.push({
      url: buildImageUrl(game.cover.image_id, 'cover_big'),
      type: 'cover',
      width: game.cover.width,
      height: game.cover.height,
    })
  }

  // Add artworks
  if (game.artworks) {
    game.artworks.forEach((artwork) => {
      if (artwork.image_id) {
        images.push({
          url: buildImageUrl(artwork.image_id, 'screenshot_big'),
          type: 'artwork',
          width: artwork.width,
          height: artwork.height,
        })
      }
    })
  }

  // Add screenshots
  if (game.screenshots) {
    game.screenshots.forEach((screenshot) => {
      if (screenshot.image_id) {
        images.push({
          url: buildImageUrl(screenshot.image_id, 'screenshot_big'),
          type: 'screenshot',
          width: screenshot.width,
          height: screenshot.height,
        })
      }
    })
  }

  return images
}

// Platform interface with category for categorization
export interface IGDBPlatform {
  id: number
  name: string
  abbreviation?: string
  category?: IGDBPlatformCategory
}

// Search for platforms (useful for mapping to our system)
export async function searchPlatforms(
  query: string,
  category?: IGDBPlatformCategory,
): Promise<IGDBPlatform[]> {
  let igdbQuery = `search "${query}"; fields id,name,abbreviation,category; limit 50;`

  // Filter by category if specified
  if (category !== null && category !== undefined) {
    igdbQuery = `search "${query}"; fields id,name,abbreviation,category; where category = ${category}; limit 50;`
  }

  return await makeRequest<IGDBPlatform[]>('/platforms', igdbQuery)
}
