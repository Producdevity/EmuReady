import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PcOs, type PrismaClient } from '@orm'
import { ListingsRepository } from './listings.repository'
import { PcListingsRepository } from './pc-listings.repository'

const LISTING_ID = '00000000-0000-4000-a000-000000000001'
const PC_LISTING_ID = '00000000-0000-4000-a000-000000000002'
const DEVICE_ID = '00000000-0000-4000-a000-000000000010'
const EMULATOR_ID = '00000000-0000-4000-a000-000000000020'
const PLATFORM_ANDROID = '00000000-0000-4000-a000-000000000101'
const PLATFORM_WINDOWS = '00000000-0000-4000-a000-000000000102'
const PLATFORM_MACOS_ARM = '00000000-0000-4000-a000-000000000103'
const PLATFORM_IOS = '00000000-0000-4000-a000-000000000104'
const PLATFORM_LINUX_X86 = '00000000-0000-4000-a000-000000000105'
const PLATFORM_LINUX_ARM = '00000000-0000-4000-a000-000000000106'

type MockPrisma = {
  listing: { findUnique: ReturnType<typeof vi.fn> }
  pcListing: { findUnique: ReturnType<typeof vi.fn> }
  device: { findUnique: ReturnType<typeof vi.fn> }
  devicePlatform: { findMany: ReturnType<typeof vi.fn> }
  emulatorPlatform: { findMany: ReturnType<typeof vi.fn> }
  platform: { findUnique: ReturnType<typeof vi.fn> }
}

function createMockPrisma(): MockPrisma {
  return {
    listing: { findUnique: vi.fn() },
    pcListing: { findUnique: vi.fn() },
    device: { findUnique: vi.fn() },
    devicePlatform: { findMany: vi.fn() },
    emulatorPlatform: { findMany: vi.fn() },
    platform: { findUnique: vi.fn() },
  }
}

describe('ListingsRepository.validatePlatformForUpdate', () => {
  let prisma: MockPrisma
  let repo: ListingsRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repo = new ListingsRepository(prisma as unknown as PrismaClient)
  })

  function stubExisting(platformId: string | null, emulatorId: string = EMULATOR_ID) {
    prisma.listing.findUnique.mockResolvedValueOnce({
      deviceId: DEVICE_ID,
      emulatorId,
      platformId,
    })
  }

  function stubContext(args: {
    deviceSupported?: string[]
    emulatorSupported?: string[]
    deviceDefault?: string | null
  }) {
    prisma.devicePlatform.findMany.mockResolvedValueOnce(
      (args.deviceSupported ?? []).map((id) => ({ platformId: id })),
    )
    prisma.emulatorPlatform.findMany.mockResolvedValueOnce(
      (args.emulatorSupported ?? []).map((id) => ({ platformId: id })),
    )
    prisma.device.findUnique.mockResolvedValueOnce({
      defaultPlatformId: args.deviceDefault ?? null,
    })
  }

  describe('no-op cases (no DB round-trip for validation)', () => {
    it('omitted platformId with no other relevant changes — skips context fetch', async () => {
      stubExisting(PLATFORM_ANDROID)
      await expect(
        repo.validatePlatformForUpdate({ platformId: undefined, listingId: LISTING_ID }),
      ).resolves.toBeUndefined()
      expect(prisma.devicePlatform.findMany).not.toHaveBeenCalled()
    })

    it('explicit null (user clearing) — skips context fetch', async () => {
      stubExisting(PLATFORM_ANDROID)
      await expect(
        repo.validatePlatformForUpdate({ platformId: null, listingId: LISTING_ID }),
      ).resolves.toBeUndefined()
      expect(prisma.devicePlatform.findMany).not.toHaveBeenCalled()
    })

    it('stored platform is null AND not setting a new one — skips context fetch', async () => {
      stubExisting(null)
      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          listingId: LISTING_ID,
          emulatorId: '00000000-0000-4000-a000-000000000099',
        }),
      ).resolves.toBeUndefined()
      expect(prisma.devicePlatform.findMany).not.toHaveBeenCalled()
    })
  })

  describe('error cases', () => {
    it('throws listing.notFound when listing does not exist', async () => {
      prisma.listing.findUnique.mockResolvedValueOnce(null)
      await expect(
        repo.validatePlatformForUpdate({
          platformId: PLATFORM_ANDROID,
          listingId: LISTING_ID,
        }),
      ).rejects.toThrow(/not found/i)
    })

    it('throws notAvailableForDevice when device support excludes the explicit platform', async () => {
      stubExisting(null)
      stubContext({ deviceSupported: [PLATFORM_ANDROID], emulatorSupported: [] })
      await expect(
        repo.validatePlatformForUpdate({ platformId: PLATFORM_IOS, listingId: LISTING_ID }),
      ).rejects.toThrow(/not available for this device/i)
    })

    it('throws notSupportedByEmulator when emulator support excludes the explicit platform', async () => {
      stubExisting(null)
      stubContext({ emulatorSupported: [PLATFORM_ANDROID] })
      await expect(
        repo.validatePlatformForUpdate({ platformId: PLATFORM_IOS, listingId: LISTING_ID }),
      ).rejects.toThrow(/emulator does not support/i)
    })

    it('checks device support before emulator support', async () => {
      stubExisting(null)
      stubContext({
        deviceSupported: [PLATFORM_ANDROID],
        emulatorSupported: [PLATFORM_ANDROID],
      })
      await expect(
        repo.validatePlatformForUpdate({ platformId: PLATFORM_IOS, listingId: LISTING_ID }),
      ).rejects.toThrow(/not available for this device/i)
    })
  })

  describe('happy paths', () => {
    it('accepts a valid explicit platform that both device and emulator support', async () => {
      stubExisting(null)
      stubContext({
        deviceSupported: [PLATFORM_ANDROID],
        emulatorSupported: [PLATFORM_ANDROID, PLATFORM_WINDOWS],
      })
      await expect(
        repo.validatePlatformForUpdate({
          platformId: PLATFORM_ANDROID,
          listingId: LISTING_ID,
        }),
      ).resolves.toBeUndefined()
    })

    it('accepts an explicit platform when both support sets are empty (fail-open)', async () => {
      stubExisting(null)
      stubContext({ deviceSupported: [], emulatorSupported: [] })
      await expect(
        repo.validatePlatformForUpdate({ platformId: PLATFORM_IOS, listingId: LISTING_ID }),
      ).resolves.toBeUndefined()
    })
  })

  describe('re-validation on admin emulator change', () => {
    it('re-validates stored platformId against new emulator when platformId is omitted', async () => {
      // The listing currently has windows-x86 stored. Admin swaps the
      // emulator to one that only supports mobile — the stored platform
      // must now be rejected even though the admin did not change it.
      const NEW_EMULATOR = '00000000-0000-4000-a000-000000000021'
      stubExisting(PLATFORM_WINDOWS, EMULATOR_ID)
      stubContext({
        deviceSupported: [PLATFORM_WINDOWS],
        emulatorSupported: [PLATFORM_ANDROID],
      })

      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          listingId: LISTING_ID,
          emulatorId: NEW_EMULATOR,
        }),
      ).rejects.toThrow(/emulator does not support/i)

      expect(prisma.emulatorPlatform.findMany).toHaveBeenCalledWith({
        where: { emulatorId: NEW_EMULATOR },
        select: { platformId: true },
      })
    })

    it('accepts the stored platformId when the new emulator still supports it', async () => {
      const NEW_EMULATOR = '00000000-0000-4000-a000-000000000022'
      stubExisting(PLATFORM_WINDOWS, EMULATOR_ID)
      stubContext({
        deviceSupported: [PLATFORM_WINDOWS],
        emulatorSupported: [PLATFORM_WINDOWS, PLATFORM_ANDROID],
      })

      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          listingId: LISTING_ID,
          emulatorId: NEW_EMULATOR,
        }),
      ).resolves.toBeUndefined()
    })

    it('does not re-fetch when emulator is same as existing and platformId is omitted', async () => {
      stubExisting(PLATFORM_ANDROID, EMULATOR_ID)
      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          listingId: LISTING_ID,
          emulatorId: EMULATOR_ID,
        }),
      ).resolves.toBeUndefined()
      expect(prisma.devicePlatform.findMany).not.toHaveBeenCalled()
    })
  })
})

describe('PcListingsRepository.validatePlatformForUpdate', () => {
  let prisma: MockPrisma
  let repo: PcListingsRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repo = new PcListingsRepository(prisma as unknown as PrismaClient)
  })

  function stubExisting(
    platformId: string | null,
    emulatorId: string = EMULATOR_ID,
    os: PcOs | null = PcOs.WINDOWS,
  ) {
    prisma.pcListing.findUnique.mockResolvedValueOnce({
      emulatorId,
      os,
      platformId,
    })
  }

  function stubContext(args: {
    emulatorSupported?: string[]
    requestedSlug?: string | null
    osFallbackId?: string | null
  }) {
    prisma.emulatorPlatform.findMany.mockResolvedValueOnce(
      (args.emulatorSupported ?? []).map((id) => ({ platformId: id })),
    )
    prisma.platform.findUnique
      .mockResolvedValueOnce(args.requestedSlug === undefined ? null : { slug: args.requestedSlug })
      .mockResolvedValueOnce(args.osFallbackId ? { id: args.osFallbackId } : null)
  }

  describe('no-op cases', () => {
    it('omitted platformId with no other changes — skips context fetch', async () => {
      stubExisting(PLATFORM_WINDOWS)
      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          pcListingId: PC_LISTING_ID,
        }),
      ).resolves.toBeUndefined()
      expect(prisma.emulatorPlatform.findMany).not.toHaveBeenCalled()
    })

    it('explicit null (user clearing) — skips context fetch', async () => {
      stubExisting(PLATFORM_WINDOWS)
      await expect(
        repo.validatePlatformForUpdate({ platformId: null, pcListingId: PC_LISTING_ID }),
      ).resolves.toBeUndefined()
      expect(prisma.emulatorPlatform.findMany).not.toHaveBeenCalled()
    })

    it('stored platform is null AND platformId omitted — skips context fetch even on OS change', async () => {
      stubExisting(null, EMULATOR_ID, PcOs.WINDOWS)
      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          pcListingId: PC_LISTING_ID,
          os: PcOs.MACOS,
        }),
      ).resolves.toBeUndefined()
      expect(prisma.emulatorPlatform.findMany).not.toHaveBeenCalled()
    })
  })

  describe('error cases', () => {
    it('throws pcListing.notFound when row does not exist', async () => {
      prisma.pcListing.findUnique.mockResolvedValueOnce(null)
      await expect(
        repo.validatePlatformForUpdate({
          platformId: PLATFORM_WINDOWS,
          pcListingId: PC_LISTING_ID,
        }),
      ).rejects.toThrow(/not found/i)
    })

    it('throws platform.notFound when explicit platformId does not exist in DB', async () => {
      stubExisting(null, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({ emulatorSupported: [], requestedSlug: null })
      await expect(
        repo.validatePlatformForUpdate({
          platformId: 'bogus-id',
          pcListingId: PC_LISTING_ID,
        }),
      ).rejects.toThrow(/not found/i)
    })

    it('does NOT throw platform.notFound when only emulator changes and stored platformId is orphaned', async () => {
      // Stored row has a platformId whose row has since been deleted
      // (orphaned FK). User isn't touching platformId — they're only
      // swapping emulator. Skip re-validation rather than erroring,
      // matching the handheld sibling's behavior.
      stubExisting(PLATFORM_WINDOWS, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({ emulatorSupported: [PLATFORM_WINDOWS], requestedSlug: null })

      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          pcListingId: PC_LISTING_ID,
          emulatorId: '00000000-0000-4000-a000-000000000031',
        }),
      ).resolves.toBeUndefined()
    })

    it('throws inconsistentWithOs when explicit platform slug does not match the OS', async () => {
      stubExisting(null, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({ emulatorSupported: [], requestedSlug: 'macos-arm' })
      await expect(
        repo.validatePlatformForUpdate({
          platformId: PLATFORM_MACOS_ARM,
          pcListingId: PC_LISTING_ID,
        }),
      ).rejects.toThrow(/does not match the selected operating system/i)
    })

    it('throws notSupportedByEmulator when emulator support excludes the platform', async () => {
      stubExisting(null, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({
        emulatorSupported: [PLATFORM_MACOS_ARM],
        requestedSlug: 'windows-x86',
      })
      await expect(
        repo.validatePlatformForUpdate({
          platformId: PLATFORM_WINDOWS,
          pcListingId: PC_LISTING_ID,
        }),
      ).rejects.toThrow(/emulator does not support/i)
    })
  })

  describe('happy paths', () => {
    it('accepts windows-x86 for WINDOWS when emulator supports it', async () => {
      stubExisting(null, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({
        emulatorSupported: [PLATFORM_WINDOWS, PLATFORM_LINUX_X86],
        requestedSlug: 'windows-x86',
      })
      await expect(
        repo.validatePlatformForUpdate({
          platformId: PLATFORM_WINDOWS,
          pcListingId: PC_LISTING_ID,
        }),
      ).resolves.toBeUndefined()
    })

    it('accepts linux-arm (UNIVERSAL) for LINUX', async () => {
      stubExisting(null, EMULATOR_ID, PcOs.LINUX)
      stubContext({
        emulatorSupported: [],
        requestedSlug: 'linux-arm',
      })
      await expect(
        repo.validatePlatformForUpdate({
          platformId: PLATFORM_LINUX_ARM,
          pcListingId: PC_LISTING_ID,
        }),
      ).resolves.toBeUndefined()
    })
  })

  describe('re-validation when emulator or OS changes without platformId', () => {
    it('re-validates stored platformId when admin changes emulator', async () => {
      // Stored as windows-x86. Admin swaps to a mobile-only emulator.
      const NEW_EMULATOR = '00000000-0000-4000-a000-000000000030'
      stubExisting(PLATFORM_WINDOWS, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({
        emulatorSupported: [PLATFORM_ANDROID],
        requestedSlug: 'windows-x86',
      })

      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          pcListingId: PC_LISTING_ID,
          emulatorId: NEW_EMULATOR,
        }),
      ).rejects.toThrow(/emulator does not support/i)
    })

    it('re-validates stored platformId when user changes OS', async () => {
      // Stored as windows-x86 with os=WINDOWS. User changes os to MACOS.
      stubExisting(PLATFORM_WINDOWS, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({
        emulatorSupported: [],
        requestedSlug: 'windows-x86',
      })

      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          pcListingId: PC_LISTING_ID,
          os: PcOs.MACOS,
        }),
      ).rejects.toThrow(/does not match the selected operating system/i)
    })

    it('accepts stored platform when new OS is still compatible', async () => {
      // Stored as linux-arm (UNIVERSAL). User changes os WINDOWS -> LINUX — still compatible.
      stubExisting(PLATFORM_LINUX_ARM, EMULATOR_ID, PcOs.WINDOWS)
      stubContext({
        emulatorSupported: [],
        requestedSlug: 'linux-arm',
      })

      await expect(
        repo.validatePlatformForUpdate({
          platformId: undefined,
          pcListingId: PC_LISTING_ID,
          os: PcOs.LINUX,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
