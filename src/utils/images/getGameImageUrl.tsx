import getImageUrl from '@/utils/getImageUrl'
import { type Game } from '@orm'

/**
 * Get the image URL for a game, prioritizing boxart, banner, or image URL.
 * @param game - The game object containing image URLs.
 */
function getGameImageUrl(game: Game): string {
  const displayImageUrl = game.boxartUrl ?? game.bannerUrl ?? game.imageUrl

  return getImageUrl(displayImageUrl, game.title)
}

export default getGameImageUrl
