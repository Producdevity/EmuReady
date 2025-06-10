import type { TGDBGame, TGDBGamesByNameResponse } from '@/types/tgdb'

/**
 * Extracts the first boxart URL from a TGDB game with its search response context
 */
export function extractBoxartUrl(
  game: TGDBGame,
  searchResponse: TGDBGamesByNameResponse,
): string | null {
  const gameId = game.id.toString()
  const boxartImages = searchResponse.include?.boxart?.data[gameId]

  if (!boxartImages || boxartImages.length === 0) return null

  // Get the first boxart image
  const boxart = boxartImages[0]
  if (!boxart) return null

  const baseUrl = searchResponse.include?.boxart?.base_url?.thumb
  if (!baseUrl) return null

  return `${baseUrl}${boxart.filename}`
}

/**
 * Gets display-friendly platform name, handling edge cases
 */
export function formatPlatformName(platforms: string[]): string {
  if (!platforms || platforms.length === 0) return 'Unknown Platform'

  // If multiple platforms, show the first one + count
  return platforms.length > 1
    ? `${platforms[0]} (+${platforms.length - 1} more)`
    : platforms[0]
}
