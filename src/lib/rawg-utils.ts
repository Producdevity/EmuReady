import type { GameImageOption } from '@/types/rawg'

export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url)
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
  } catch {
    return false
  }
}

export function getImageDisplayName(image: GameImageOption): string {
  const typeLabel = image.type === 'background' ? 'Cover' : 'Screenshot'
  return `${typeLabel} - ${image.gameName}`
} 