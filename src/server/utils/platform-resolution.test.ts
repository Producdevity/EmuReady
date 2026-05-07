import { describe, expect, it } from 'vitest'
import { PcOs } from '@orm'
import { resolveHandheldPlatformId, resolvePcPlatformId } from './platform-resolution'

const ANDROID = 'p-android'
const IOS = 'p-ios'
const WINDOWS_X86 = 'p-windows-x86'
const MACOS_ARM = 'p-macos-arm'
const LINUX_ARM = 'p-linux-arm'

describe('resolveHandheldPlatformId', () => {
  describe('explicit platformId provided', () => {
    it('returns the explicit id when both support sets are empty (fail-open)', () => {
      expect(
        resolveHandheldPlatformId({
          requested: ANDROID,
          deviceSupported: new Set(),
          emulatorSupported: new Set(),
          deviceDefault: null,
        }),
      ).toBe(ANDROID)
    })

    it('returns the explicit id when both support sets contain it', () => {
      expect(
        resolveHandheldPlatformId({
          requested: ANDROID,
          deviceSupported: new Set([ANDROID, LINUX_ARM]),
          emulatorSupported: new Set([ANDROID, WINDOWS_X86]),
          deviceDefault: null,
        }),
      ).toBe(ANDROID)
    })

    it('throws notAvailableForDevice when device support is non-empty and lacks the platform', () => {
      expect(() =>
        resolveHandheldPlatformId({
          requested: IOS,
          deviceSupported: new Set([ANDROID]),
          emulatorSupported: new Set(),
          deviceDefault: null,
        }),
      ).toThrow(/not available for this device/i)
    })

    it('throws notSupportedByEmulator when emulator support is non-empty and lacks the platform', () => {
      expect(() =>
        resolveHandheldPlatformId({
          requested: IOS,
          deviceSupported: new Set(),
          emulatorSupported: new Set([ANDROID]),
          deviceDefault: null,
        }),
      ).toThrow(/emulator does not support/i)
    })

    it('checks device support before emulator support', () => {
      expect(() =>
        resolveHandheldPlatformId({
          requested: IOS,
          deviceSupported: new Set([ANDROID]),
          emulatorSupported: new Set([ANDROID]),
          deviceDefault: null,
        }),
      ).toThrow(/not available for this device/i)
    })
  })

  describe('no explicit platformId — falls back to device default', () => {
    it('returns deviceDefault when emulator support is empty (fail-open)', () => {
      expect(
        resolveHandheldPlatformId({
          requested: null,
          deviceSupported: new Set([ANDROID]),
          emulatorSupported: new Set(),
          deviceDefault: ANDROID,
        }),
      ).toBe(ANDROID)
    })

    it('returns deviceDefault when emulator supports it', () => {
      expect(
        resolveHandheldPlatformId({
          requested: null,
          deviceSupported: new Set([ANDROID]),
          emulatorSupported: new Set([ANDROID, WINDOWS_X86]),
          deviceDefault: ANDROID,
        }),
      ).toBe(ANDROID)
    })

    it('returns null when deviceDefault is not in non-empty emulator support set (silent drop)', () => {
      expect(
        resolveHandheldPlatformId({
          requested: null,
          deviceSupported: new Set([ANDROID]),
          emulatorSupported: new Set([WINDOWS_X86]),
          deviceDefault: ANDROID,
        }),
      ).toBeNull()
    })

    it('returns null when deviceDefault is not in non-empty device support set (inconsistent seed)', () => {
      // Defensive: if the seeder stored a defaultPlatformId that is not
      // actually in the device's DevicePlatform rows, silently drop it
      // rather than persist the contradiction.
      expect(
        resolveHandheldPlatformId({
          requested: null,
          deviceSupported: new Set([WINDOWS_X86]),
          emulatorSupported: new Set(),
          deviceDefault: ANDROID,
        }),
      ).toBeNull()
    })

    it('returns null when device has no default', () => {
      expect(
        resolveHandheldPlatformId({
          requested: null,
          deviceSupported: new Set(),
          emulatorSupported: new Set(),
          deviceDefault: null,
        }),
      ).toBeNull()
    })

    it('treats undefined request the same as null', () => {
      expect(
        resolveHandheldPlatformId({
          requested: undefined,
          deviceSupported: new Set(),
          emulatorSupported: new Set(),
          deviceDefault: ANDROID,
        }),
      ).toBe(ANDROID)
    })
  })
})

describe('resolvePcPlatformId', () => {
  describe('explicit platformId provided', () => {
    it('returns the explicit id when emulator support is empty and OS is consistent', () => {
      expect(
        resolvePcPlatformId({
          requested: WINDOWS_X86,
          requestedSlug: 'windows-x86',
          emulatorSupported: new Set(),
          os: PcOs.WINDOWS,
          osDerivedFallback: null,
        }),
      ).toBe(WINDOWS_X86)
    })

    it('returns the explicit id for a UNIVERSAL-scope platform (linux-arm) regardless of OS', () => {
      expect(
        resolvePcPlatformId({
          requested: LINUX_ARM,
          requestedSlug: 'linux-arm',
          emulatorSupported: new Set([LINUX_ARM]),
          os: PcOs.LINUX,
          osDerivedFallback: null,
        }),
      ).toBe(LINUX_ARM)
    })

    it('throws notSupportedByEmulator when emulator support is non-empty and lacks the platform', () => {
      expect(() =>
        resolvePcPlatformId({
          requested: MACOS_ARM,
          requestedSlug: 'macos-arm',
          emulatorSupported: new Set([WINDOWS_X86]),
          os: PcOs.MACOS,
          osDerivedFallback: null,
        }),
      ).toThrow(/emulator does not support/i)
    })

    it('throws inconsistentWithOs when slug does not match OS (windows-x86 with MACOS)', () => {
      expect(() =>
        resolvePcPlatformId({
          requested: WINDOWS_X86,
          requestedSlug: 'windows-x86',
          emulatorSupported: new Set(),
          os: PcOs.MACOS,
          osDerivedFallback: null,
        }),
      ).toThrow(/does not match the selected operating system/i)
    })

    it('checks emulator support before OS consistency', () => {
      expect(() =>
        resolvePcPlatformId({
          requested: WINDOWS_X86,
          requestedSlug: 'windows-x86',
          emulatorSupported: new Set([MACOS_ARM]),
          os: PcOs.MACOS,
          osDerivedFallback: null,
        }),
      ).toThrow(/emulator does not support/i)
    })

    it('throws platform.notFound when requestedSlug is null (platform id not in DB)', () => {
      expect(() =>
        resolvePcPlatformId({
          requested: 'bogus-platform-id',
          requestedSlug: null,
          emulatorSupported: new Set(),
          os: PcOs.OTHER,
          osDerivedFallback: null,
        }),
      ).toThrow(/not found/i)
    })

    it('skips OS check when requestedSlug is undefined AND os is OTHER', () => {
      // Undefined slug means the caller opted not to look up the slug.
      // Combined with PcOs.OTHER, the OS-consistency check is effectively
      // bypassed and the explicit id passes straight through.
      expect(
        resolvePcPlatformId({
          requested: LINUX_ARM,
          requestedSlug: undefined,
          emulatorSupported: new Set(),
          os: PcOs.OTHER,
          osDerivedFallback: null,
        }),
      ).toBe(LINUX_ARM)
    })
  })

  describe('no explicit platformId — falls back to OS-derived', () => {
    it('returns the OS-derived fallback when emulator support is empty', () => {
      expect(
        resolvePcPlatformId({
          requested: null,
          requestedSlug: null,
          emulatorSupported: new Set(),
          os: PcOs.WINDOWS,
          osDerivedFallback: { id: WINDOWS_X86 },
        }),
      ).toBe(WINDOWS_X86)
    })

    it('returns the OS-derived fallback when emulator supports it', () => {
      expect(
        resolvePcPlatformId({
          requested: null,
          requestedSlug: null,
          emulatorSupported: new Set([WINDOWS_X86, MACOS_ARM]),
          os: PcOs.WINDOWS,
          osDerivedFallback: { id: WINDOWS_X86 },
        }),
      ).toBe(WINDOWS_X86)
    })

    it('returns null when fallback is not in non-empty emulator support set (silent drop)', () => {
      expect(
        resolvePcPlatformId({
          requested: null,
          requestedSlug: null,
          emulatorSupported: new Set([MACOS_ARM]),
          os: PcOs.WINDOWS,
          osDerivedFallback: { id: WINDOWS_X86 },
        }),
      ).toBeNull()
    })

    it('returns null when OS has no derived fallback (e.g., PcOs.OTHER)', () => {
      expect(
        resolvePcPlatformId({
          requested: null,
          requestedSlug: null,
          emulatorSupported: new Set(),
          os: PcOs.OTHER,
          osDerivedFallback: null,
        }),
      ).toBeNull()
    })
  })
})
