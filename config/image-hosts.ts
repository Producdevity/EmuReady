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

export const NEXT_IMAGE_REMOTE_HOST_PATTERNS = [
  'placehold.co',
  '*.clerk.com',
  '*.clerk.accounts.dev',
  'storage.ko-fi.com',
  'ko-fi.com',
  ...GAME_IMAGE_PROVIDER_HOST_PATTERNS,
] as const

export const NEXT_IMAGE_REMOTE_PATTERNS = NEXT_IMAGE_REMOTE_HOST_PATTERNS.map((hostname) => ({
  protocol: 'https' as const,
  hostname,
  pathname: '/**',
}))
