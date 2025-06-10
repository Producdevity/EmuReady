import type { GameImageOption } from '@/types/tgdb'

export function getImageDisplayName(image: GameImageOption): string {
  const typeDisplayNames: Record<string, string> = {
    boxart: 'Box Art',
    fanart: 'Fan Art',
    banner: 'Banner',
    screenshot: 'Screenshot',
    clearlogo: 'Clear Logo',
    titlescreen: 'Title Screen',
  }

  const typeName = typeDisplayNames[image.type] || image.type
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
  const typeDisplayNames: Record<string, string> = {
    boxart: 'Box Art',
    fanart: 'Fan Art',
    banner: 'Banner',
    screenshot: 'Screenshot',
    clearlogo: 'Clear Logo',
    titlescreen: 'Title Screen',
  }

  return typeDisplayNames[type] || type.charAt(0).toUpperCase() + type.slice(1)
}
