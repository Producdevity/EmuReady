import getSafePlaceholderImageUrl from './getSafePlaceholderImageUrl'

function getImageUrl(url: string | null, title?: string): string {
  if (!url) return getSafePlaceholderImageUrl(title)

  if (url.startsWith('/') && !url.startsWith('//')) {
    return url // Local image, use directly
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}` // use proxy
  }

  return getSafePlaceholderImageUrl(title) // Invalid URL format, use placeholder
}

export default getImageUrl
