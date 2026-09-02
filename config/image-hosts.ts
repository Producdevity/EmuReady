export const GAME_IMAGE_PROVIDER_HOST_PATTERNS = [
  'media.rawg.io',
  'cdn.thegamesdb.net',
  'images.igdb.com',
  'assets.nintendo.com',
  'shared.akamai.steamstatic.com',
  'cdn1.epicgames.com',
  'cdn2.unrealengine.com',
  'images.gog-statics.com',
] as const

function r2UploadsHost(): string | null {
  const base =
    process.env.NEXT_PUBLIC_R2_UPLOADS_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL
  if (!base) return null
  try {
    return new URL(base).hostname
  } catch {
    return null
  }
}

const R2_UPLOADS_HOST = r2UploadsHost()

export const NEXT_IMAGE_REMOTE_HOST_PATTERNS = [
  'placehold.co',
  '*.clerk.com',
  '*.clerk.accounts.dev',
  'storage.ko-fi.com',
  'ko-fi.com',
  ...GAME_IMAGE_PROVIDER_HOST_PATTERNS,
  ...(R2_UPLOADS_HOST ? [R2_UPLOADS_HOST] : []),
] as const

export const NEXT_IMAGE_REMOTE_PATTERNS = NEXT_IMAGE_REMOTE_HOST_PATTERNS.map((hostname) => ({
  protocol: 'https' as const,
  hostname,
  pathname: '/**',
}))
