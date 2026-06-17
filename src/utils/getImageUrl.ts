import { type Nullable } from '@/types/utils'
import getSafePlaceholderImageUrl from './getSafePlaceholderImageUrl'
import { getImageRenderMode } from './imageUrls'

/**
 * Get a safe image URL for display.
 * @param url - The original image URL.
 * @param title - Optional title for placeholder fallback.
 * @returns A valid image URL or a placeholder if the URL is invalid.
 */
function getImageUrl(url: Nullable<string>, title?: string | null): string {
  if (!url) return getSafePlaceholderImageUrl(title)

  const trimmedUrl = url.trim()
  if (getImageRenderMode(trimmedUrl) !== 'invalid') return trimmedUrl

  return getSafePlaceholderImageUrl(title ?? null)
}

export default getImageUrl
