import { isValidImageUrl as validateImageUrl } from '@/utils/imageValidation'
import type { GameImageOption } from '@/types/rawg'

export function isValidImageUrl(url: string): boolean {
  return validateImageUrl(url)
}

export function getImageDisplayName(image: GameImageOption): string {
  const typeLabel = image.type === 'background' ? 'Cover' : 'Screenshot'
  return `${typeLabel} - ${image.gameName}`
}
