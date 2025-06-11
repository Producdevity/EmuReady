import getSafePlaceholderImageUrl from './getSafePlaceholderImageUrl'
import { type Nullable } from '@/types/utils'

function getImageUrl(url: Nullable<string>, title?: string): string {
  if (!url) return getSafePlaceholderImageUrl(title)

  if (url.startsWith('/') && !url.startsWith('//')) {
    return url // Local image, use directly
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}` // use proxy
  }

  return getSafePlaceholderImageUrl(title ?? null) // Invalid URL format, use placeholder
}

export default getImageUrl
