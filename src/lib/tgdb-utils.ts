import type { GameImageOption } from '@/types/tgdb'

const TYPE_DISPLAY_NAMES: Record<string, string> = {
  boxart: 'Box Art',
  fanart: 'Fan Art',
  banner: 'Banner',
  screenshot: 'Screenshot',
  clearlogo: 'Clear Logo',
  titlescreen: 'Title Screen',
}

export function getImageDisplayName(image: GameImageOption): string {
  const typeName = TYPE_DISPLAY_NAMES[image.type] || image.type
  return `${typeName} - ${image.gameName}`
}

export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return (
      parsedUrl.protocol === 'https:' &&
      /\.(jpg|jpeg|png|webp|gif)$/i.test(parsedUrl.pathname)
    )
  } catch {
    return false
  }
}

export function getImageTypeDisplayName(type: string): string {
  return (
    TYPE_DISPLAY_NAMES[type] || type.charAt(0).toUpperCase() + type.slice(1)
  )
}
