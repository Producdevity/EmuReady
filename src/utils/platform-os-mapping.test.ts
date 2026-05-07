import { describe, expect, it } from 'vitest'
import { PcOs } from '@orm'
import {
  OS_TO_COMPATIBLE_PLATFORM_SLUGS,
  OS_TO_PLATFORM_SLUG,
  getCompatiblePlatformSlugsForOs,
  inferPlatformSlugFromOs,
  isPlatformSlugCompatibleWithOs,
} from './platform-os-mapping'

describe('platform-os-mapping', () => {
  describe('OS_TO_PLATFORM_SLUG', () => {
    it.each([
      [PcOs.WINDOWS, 'windows-x86'],
      [PcOs.LINUX, 'linux-x86'],
      [PcOs.FREEBSD, 'freebsd'],
    ])('maps PcOs.%s to slug "%s"', (os, expectedSlug) => {
      expect(OS_TO_PLATFORM_SLUG[os]).toBe(expectedSlug)
    })

    it('maps macOS to the ARM slug (Apple Silicon is the modern default)', () => {
      expect(OS_TO_PLATFORM_SLUG[PcOs.MACOS]).toBe('macos-arm')
    })

    it('maps PcOs.OTHER to null so callers can leave the row untagged', () => {
      expect(OS_TO_PLATFORM_SLUG[PcOs.OTHER]).toBeNull()
    })

    it('covers every value in the PcOs enum exhaustively', () => {
      const osValues = Object.values(PcOs)
      const mappedKeys = Object.keys(OS_TO_PLATFORM_SLUG)
      expect(mappedKeys.sort()).toEqual(osValues.sort())
    })

    it('all non-null target slugs match the canonical platformsSeeder entries', async () => {
      const { PLATFORMS } = await import('../../prisma/seeders/platformsSeeder')
      const validSlugs = new Set(PLATFORMS.map((p) => p.slug))

      for (const [os, slug] of Object.entries(OS_TO_PLATFORM_SLUG)) {
        if (slug !== null) {
          expect(validSlugs.has(slug), `OS ${os} maps to unknown slug ${slug}`).toBe(true)
        }
      }
    })
  })

  describe('inferPlatformSlugFromOs', () => {
    it('returns the mapped slug for a known OS', () => {
      expect(inferPlatformSlugFromOs(PcOs.WINDOWS)).toBe('windows-x86')
      expect(inferPlatformSlugFromOs(PcOs.MACOS)).toBe('macos-arm')
    })

    it('returns null for null or undefined (form field not yet set)', () => {
      expect(inferPlatformSlugFromOs(null)).toBeNull()
      expect(inferPlatformSlugFromOs(undefined)).toBeNull()
    })

    it('returns null for PcOs.OTHER (caller falls back to manual selection)', () => {
      expect(inferPlatformSlugFromOs(PcOs.OTHER)).toBeNull()
    })
  })

  describe('OS_TO_COMPATIBLE_PLATFORM_SLUGS', () => {
    it.each([
      [PcOs.WINDOWS, ['windows-x86', 'windows-arm']],
      [PcOs.LINUX, ['linux-x86', 'linux-arm']],
      [PcOs.MACOS, ['macos-x86', 'macos-arm']],
      [PcOs.FREEBSD, ['freebsd']],
    ])('lists every architecture variant for PcOs.%s', (os, expected) => {
      expect(OS_TO_COMPATIBLE_PLATFORM_SLUGS[os]).toEqual(expected)
    })

    it('returns null for PcOs.OTHER so the UI falls back to the full list', () => {
      expect(OS_TO_COMPATIBLE_PLATFORM_SLUGS[PcOs.OTHER]).toBeNull()
    })

    it('every compatible slug also exists in the platformsSeeder canonical list', async () => {
      const { PLATFORMS } = await import('../../prisma/seeders/platformsSeeder')
      const validSlugs = new Set(PLATFORMS.map((p) => p.slug))

      for (const [os, slugs] of Object.entries(OS_TO_COMPATIBLE_PLATFORM_SLUGS)) {
        if (!slugs) continue
        for (const slug of slugs) {
          expect(validSlugs.has(slug), `OS ${os} references unknown slug ${slug}`).toBe(true)
        }
      }
    })

    it('the smart-default slug is always inside the compatible-slugs list (where the list is set)', () => {
      for (const os of Object.values(PcOs)) {
        const defaultSlug = OS_TO_PLATFORM_SLUG[os]
        const compatible = OS_TO_COMPATIBLE_PLATFORM_SLUGS[os]
        if (defaultSlug && compatible) {
          expect(
            compatible.includes(defaultSlug),
            `Default ${defaultSlug} missing from compatible list for ${os}`,
          ).toBe(true)
        }
      }
    })
  })

  describe('getCompatiblePlatformSlugsForOs', () => {
    it('returns the compatible list for a known OS', () => {
      expect(getCompatiblePlatformSlugsForOs(PcOs.WINDOWS)).toEqual(['windows-x86', 'windows-arm'])
    })

    it('returns null when given null/undefined/PcOs.OTHER', () => {
      expect(getCompatiblePlatformSlugsForOs(null)).toBeNull()
      expect(getCompatiblePlatformSlugsForOs(undefined)).toBeNull()
      expect(getCompatiblePlatformSlugsForOs(PcOs.OTHER)).toBeNull()
    })
  })

  describe('isPlatformSlugCompatibleWithOs', () => {
    it('accepts exact matches', () => {
      expect(isPlatformSlugCompatibleWithOs('windows-x86', PcOs.WINDOWS)).toBe(true)
      expect(isPlatformSlugCompatibleWithOs('windows-arm', PcOs.WINDOWS)).toBe(true)
      expect(isPlatformSlugCompatibleWithOs('macos-x86', PcOs.MACOS)).toBe(true)
      expect(isPlatformSlugCompatibleWithOs('linux-arm', PcOs.LINUX)).toBe(true)
    })

    it('rejects mismatches (Windows + macos-arm)', () => {
      expect(isPlatformSlugCompatibleWithOs('macos-arm', PcOs.WINDOWS)).toBe(false)
      expect(isPlatformSlugCompatibleWithOs('windows-x86', PcOs.MACOS)).toBe(false)
      expect(isPlatformSlugCompatibleWithOs('freebsd', PcOs.LINUX)).toBe(false)
    })

    it('is permissive when either side is missing (new platforms, form in progress)', () => {
      expect(isPlatformSlugCompatibleWithOs(null, PcOs.WINDOWS)).toBe(true)
      expect(isPlatformSlugCompatibleWithOs('windows-x86', null)).toBe(true)
      expect(isPlatformSlugCompatibleWithOs(null, null)).toBe(true)
    })

    it('is permissive for PcOs.OTHER (unknown OS has no constraint)', () => {
      expect(isPlatformSlugCompatibleWithOs('macos-arm', PcOs.OTHER)).toBe(true)
    })
  })
})
