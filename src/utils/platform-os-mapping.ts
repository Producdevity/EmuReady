import { PcOs } from '@orm'

// Mapping is intentionally biased toward the modern architecture per OS
// (MACOS → macos-arm, WINDOWS → windows-x86, LINUX → linux-x86). Slugs must
// stay aligned with the `slug` values in prisma/seeders/platformsSeeder.ts.
export const OS_TO_PLATFORM_SLUG: Record<PcOs, string | null> = {
  [PcOs.WINDOWS]: 'windows-x86',
  [PcOs.LINUX]: 'linux-x86',
  [PcOs.MACOS]: 'macos-arm',
  [PcOs.FREEBSD]: 'freebsd',
  [PcOs.OTHER]: null,
}

// `null` indicates "no constraint" — caller treats any platform slug as
// compatible, which is the correct behaviour for PcOs.OTHER.
export const OS_TO_COMPATIBLE_PLATFORM_SLUGS: Record<PcOs, readonly string[] | null> = {
  [PcOs.WINDOWS]: ['windows-x86', 'windows-arm'],
  [PcOs.LINUX]: ['linux-x86', 'linux-arm'],
  [PcOs.MACOS]: ['macos-x86', 'macos-arm'],
  [PcOs.FREEBSD]: ['freebsd'],
  [PcOs.OTHER]: null,
}

export function inferPlatformSlugFromOs(os: PcOs | null | undefined): string | null {
  if (!os) return null
  return OS_TO_PLATFORM_SLUG[os] ?? null
}

export function getCompatiblePlatformSlugsForOs(
  os: PcOs | null | undefined,
): readonly string[] | null {
  if (!os) return null
  return OS_TO_COMPATIBLE_PLATFORM_SLUGS[os] ?? null
}

export function isPlatformSlugCompatibleWithOs(
  slug: string | null | undefined,
  os: PcOs | null | undefined,
): boolean {
  if (!slug || !os) return true
  const compatible = OS_TO_COMPATIBLE_PLATFORM_SLUGS[os]
  if (compatible === null) return true
  return compatible.includes(slug)
}
