export const NEXT_IMAGE_REMOTE_HOST_PATTERNS = [
  'placehold.co',
  'media.rawg.io',
  '*.clerk.com',
  '*.clerk.accounts.dev',
  'cdn.thegamesdb.net',
  'images.igdb.com',
  'assets.nintendo.com',
  'storage.ko-fi.com',
  'ko-fi.com',
] as const

export const NEXT_IMAGE_REMOTE_PATTERNS = NEXT_IMAGE_REMOTE_HOST_PATTERNS.map((hostname) => ({
  protocol: 'https' as const,
  hostname,
  pathname: '/**',
}))
