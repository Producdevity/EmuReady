import type {
  RawgGameResponse,
  RawgGameDetails,
  RawgScreenshotsResponse,
  GameImageOption,
} from '@/types/rawg'
import { isValidImageUrl } from '@/lib/rawg-utils'
import getErrorMessage from '@/utils/getErrorMessage'

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
  const url = new URL(`${RAWG_BASE_URL}${endpoint}`)
  url.searchParams.set('key', getApiKey())

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'EmuReady/1.0',
      },
    })

    if (!response.ok) {
      const payload = await response.text().catch(() => '')
      throw new RawgError(
        `RAWG API error: ${response.status} ${response.statusText} – ${payload}`,
        response.status,
        endpoint,
      )
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    if (error instanceof RawgError) {
      throw error
    }
    throw new RawgError(
      `Failed to fetch from RAWG API: ${getErrorMessage(error)}`,
      undefined,
      endpoint,
    )
  }
}

// TODO: benchmark this scoring algorithm, it may need adjustments
function scoreGameMatch(gameName: string, searchQuery: string): number {
  const normalizedGameName = gameName.toLowerCase().trim()
  const normalizedQuery = searchQuery.toLowerCase().trim()

  // Exact match gets highest score
  if (normalizedGameName === normalizedQuery) return 1000

  // Game name starts with query gets very high score
  if (normalizedGameName.startsWith(normalizedQuery)) return 900

  // Split into words for more sophisticated matching
  const queryWords = normalizedQuery
    .split(/\s+/)
    .filter((word) => word.length > 0)
  const gameWords = normalizedGameName
    .split(/\s+/)
    .filter((word) => word.length > 0)

  // Check if all query words are present in the game name (in any order)
  const matchingWords = queryWords.filter((queryWord) =>
    gameWords.some((gameWord) => gameWord.includes(queryWord)),
  )

  if (matchingWords.length === queryWords.length) {
    // All words match - check if they're in order
    let lastIndex = -1
    let inOrder = true

    for (const queryWord of queryWords) {
      const foundIndex = gameWords.findIndex(
        (gameWord, index) => index > lastIndex && gameWord.includes(queryWord),
      )

      if (foundIndex <= lastIndex) {
        inOrder = false
        break
      }
      lastIndex = foundIndex
    }

    return inOrder ? 800 : 750
  }

  // Partial matches - score based on percentage of matching words
  if (matchingWords.length > 0) {
    const matchRatio = matchingWords.length / queryWords.length
    return 500 + matchRatio * 200
  }

  // No significant match - return 0 to preserve original RAWG ordering
  return 0
}

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
        source: 'rawg',
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
          source: 'rawg',
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
