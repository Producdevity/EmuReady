import { NEXT_IMAGE_REMOTE_HOST_PATTERNS } from '@/data/image-hosts'

function matchesHostPattern(hostname: string, pattern: string): boolean {
  if (!pattern.startsWith('*.')) return hostname === pattern

  const parentHost = pattern.slice(2)
  return hostname.endsWith(`.${parentHost}`)
}

export function isKnownNextImageRemoteUrl(src: string): boolean {
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:') return false

    return NEXT_IMAGE_REMOTE_HOST_PATTERNS.some((pattern) =>
      matchesHostPattern(url.hostname, pattern),
    )
  } catch {
    return false
  }
}

export function shouldProxyImageUrl(src: string, useProxy?: boolean): boolean {
  if (src.startsWith('/') && !src.startsWith('//')) return false
  if (!src.startsWith('http://') && !src.startsWith('https://')) return false

  if (useProxy !== undefined) return useProxy
  return !isKnownNextImageRemoteUrl(src)
}

export function resolveImageProxyUrl(src: string, useProxy?: boolean): string {
  if (!shouldProxyImageUrl(src, useProxy)) return src
  return `/api/proxy-image?url=${encodeURIComponent(src)}`
}
