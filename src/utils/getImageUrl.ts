import { type Nullable } from '@/types/utils'
import getSafePlaceholderImageUrl from './getSafePlaceholderImageUrl'
import { resolveImageProxyUrl } from './imageProxy'

type Options = {
  useProxy?: boolean
}
/**
 * Get a safe image URL for display, using a proxy if necessary.
 * @param url - The original image URL.
 * @param title - Optional title for placeholder fallback.
 * @param opts - Options to control proxy usage.
 * @returns A valid image URL or a placeholder if the URL is invalid.
 */
function getImageUrl(url: Nullable<string>, title?: string | null, opts?: Options): string {
  if (!url) return getSafePlaceholderImageUrl(title)

  if (url.startsWith('/') && !url.startsWith('//')) {
    return url // Local image, use directly
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return resolveImageProxyUrl(url, opts?.useProxy)
  }

  return getSafePlaceholderImageUrl(title ?? null) // Invalid URL format, use placeholder
}

export default getImageUrl
