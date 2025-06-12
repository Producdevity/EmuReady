import axios, { type AxiosResponse } from 'axios'
import { isValidImageUrl } from '@/lib/rawg-utils'
import scoreGameMatch from '@/server/utils/scoreGameMatch'
import getErrorMessage from '@/utils/getErrorMessage'
import type {
  RawgGameResponse,
  RawgGameDetails,
  RawgScreenshotsResponse,
  GameImageOption,
} from '@/types/rawg'

export class RawgError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
  ) {
    super(message)
    this.name = 'RawgError'
  }
}

const RAWG_BASE_URL = 'https://api.rawg.io/api'

function getApiKey(): string {
  const apiKey = process.env.RAWG_API_KEY ?? ''
  if (!apiKey) {
    throw new Error('RAWG_API_KEY environment variable is required')
  }
  return apiKey
}

async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  try {
    const response: AxiosResponse<T> = await axios.get(
      `${RAWG_BASE_URL}${endpoint}`,
      {
        params: {
          key: getApiKey(),
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

      throw new RawgError(
        `RAWG API error: ${status} ${statusText} – ${payload}`,
        status,
        endpoint,
      )
    }

    throw new RawgError(
      `Failed to fetch from RAWG API: ${getErrorMessage(error)}`,
      undefined,
      endpoint,
    )
  }
}

// TODO: benchmark this scoring algorithm, it may need adjustments
export async function searchGames(
  query: string,
  page = 1,
  pageSize = 10,
): Promise<RawgGameResponse> {
  if (!query.trim()) {
    throw new RawgError('Search query cannot be empty')
  }

  // Fetch more results from RAWG to have more data to sort
  const fetchSize = Math.max(pageSize * 3, 20) // Fetch 3x the requested amount or minimum 20

  const rawResponse = await makeRequest<RawgGameResponse>('/games', {
    search: query.trim(),
    page: '1', // Always fetch from page 1 to get the most results for sorting
    page_size: fetchSize.toString(),
  })

  // Score and sort the results
  const scoredResults = rawResponse.results.map((game, originalIndex) => ({
    game,
    score: scoreGameMatch(game.name, query.trim()),
    originalIndex, // Preserve original RAWG ordering for ties
  }))

  // Sort by score (descending), then by original index (ascending) for ties
  scoredResults.sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.originalIndex - b.originalIndex,
  )

  // Calculate pagination for the sorted results
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedResults = scoredResults
    .slice(startIndex, endIndex)
    .map((item) => item.game)

  // Adjust the response metadata
  return {
    ...rawResponse,
    results: paginatedResults,
    // Note: count, next, previous may not be perfectly accurate after our re-sorting
    // but this is acceptable for better search relevance
  }
}

export async function getGameDetails(gameId: number): Promise<RawgGameDetails> {
  return makeRequest<RawgGameDetails>(`/games/${gameId}`)
}

export async function getGameScreenshots(
  gameId: number,
  page = 1,
  pageSize = 20,
): Promise<RawgScreenshotsResponse> {
  return makeRequest<RawgScreenshotsResponse>(`/games/${gameId}/screenshots`, {
    page: page.toString(),
    page_size: pageSize.toString(),
  })
}

export async function getGameImages(
  gameId: number,
  gameName: string,
): Promise<GameImageOption[]> {
  const images: GameImageOption[] = []

  try {
    // Get game details for background image
    const gameDetails = await getGameDetails(gameId)

    if (
      gameDetails.background_image &&
      isValidImageUrl(gameDetails.background_image)
    ) {
      images.push({
        id: `bg-${gameId}`,
        url: gameDetails.background_image,
        type: 'background',
        source: 'rawg' as const,
        gameId,
        gameName,
      })
    }

    const screenshots = await getGameScreenshots(gameId)

    screenshots.results.forEach((screenshot, index) => {
      if (isValidImageUrl(screenshot.image)) {
        images.push({
          id: `screenshot-${gameId}-${index}`,
          url: screenshot.image,
          type: 'screenshot',
          source: 'rawg' as const,
          gameId,
          gameName,
          width: screenshot.width,
          height: screenshot.height,
        })
      }
    })

    return images
  } catch (error) {
    if (error instanceof RawgError) {
      throw error
    }
    throw new RawgError(`Failed to fetch images for game ${gameId}`)
  }
}

export async function searchGameImages(
  query: string,
): Promise<Map<number, GameImageOption[]>> {
  try {
    const searchResults = await searchGames(query, 1, 5) // Limit to 5 games for performance
    const imageMap = new Map<number, GameImageOption[]>()

    await Promise.all(
      searchResults.results.map(async (game) => {
        try {
          const images = await getGameImages(game.id, game.name)
          if (images.length > 0) {
            imageMap.set(game.id, images)
          }
        } catch (error) {
          // Log but don't fail the entire operation for one game
          console.warn(`Failed to fetch images for game ${game.name}:`, error)
        }
      }),
    )

    return imageMap
  } catch (error) {
    if (error instanceof RawgError) {
      throw error
    }
    throw new RawgError(
      `Failed to search for game images: ${getErrorMessage(error)}`,
    )
  }
}
