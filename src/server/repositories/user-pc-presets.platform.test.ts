import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PcOs, Role, type PrismaClient } from '@orm'
import { UserPcPresetsRepository } from './user-pc-presets.repository'

const USER_ID = '00000000-0000-4000-a000-000000000001'
const PRESET_ID = '00000000-0000-4000-a000-000000000002'
const CPU_ID = '00000000-0000-4000-a000-000000000003'
const GPU_ID = '00000000-0000-4000-a000-000000000004'
const PLATFORM_WINDOWS = '00000000-0000-4000-a000-000000000101'
const PLATFORM_MACOS_ARM = '00000000-0000-4000-a000-000000000102'
const PLATFORM_LINUX_ARM = '00000000-0000-4000-a000-000000000103'

type MockPrisma = {
  userPcPreset: {
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  cpu: { findUnique: ReturnType<typeof vi.fn> }
  gpu: { findUnique: ReturnType<typeof vi.fn> }
  platform: { findUnique: ReturnType<typeof vi.fn> }
}

function createMockPrisma(): MockPrisma {
  return {
    userPcPreset: {
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: PRESET_ID }),
      update: vi.fn().mockResolvedValue({ id: PRESET_ID }),
    },
    cpu: { findUnique: vi.fn().mockResolvedValue({ id: CPU_ID }) },
    gpu: { findUnique: vi.fn().mockResolvedValue({ id: GPU_ID }) },
    platform: { findUnique: vi.fn() },
  }
}

function baseCreateData(
  override: Partial<{
    platformId: string | null | undefined
    os: PcOs | null | undefined
  }> = {},
) {
  return {
    userId: USER_ID,
    name: 'Gaming Rig',
    cpuId: CPU_ID,
    gpuId: GPU_ID,
    memorySize: 32,
    os: override.os === undefined ? PcOs.WINDOWS : override.os,
    osVersion: 'Windows 11',
    platformId: override.platformId === undefined ? undefined : override.platformId,
  }
}

describe('UserPcPresetsRepository platform/OS consistency (create)', () => {
  let prisma: MockPrisma
  let repo: UserPcPresetsRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repo = new UserPcPresetsRepository(prisma as unknown as PrismaClient)
  })

  it('skips platform lookup when platformId is undefined', async () => {
    await repo.create(baseCreateData({ platformId: undefined }))
    expect(prisma.platform.findUnique).not.toHaveBeenCalled()
    expect(prisma.userPcPreset.create).toHaveBeenCalled()
  })

  it('skips platform lookup when platformId is null', async () => {
    await repo.create(baseCreateData({ platformId: null }))
    expect(prisma.platform.findUnique).not.toHaveBeenCalled()
    expect(prisma.userPcPreset.create).toHaveBeenCalled()
  })

  it('throws platform.notFound when the platformId does not exist', async () => {
    prisma.platform.findUnique.mockResolvedValueOnce(null)
    await expect(repo.create(baseCreateData({ platformId: 'bogus-id' }))).rejects.toThrow(
      /not found/i,
    )
    expect(prisma.userPcPreset.create).not.toHaveBeenCalled()
  })

  it('accepts windows-x86 platform with WINDOWS os', async () => {
    prisma.platform.findUnique.mockResolvedValueOnce({ slug: 'windows-x86' })
    await expect(
      repo.create(baseCreateData({ platformId: PLATFORM_WINDOWS, os: PcOs.WINDOWS })),
    ).resolves.toBeDefined()
    expect(prisma.userPcPreset.create).toHaveBeenCalled()
  })

  it('throws inconsistentWithOs when windows-x86 platform paired with MACOS', async () => {
    prisma.platform.findUnique.mockResolvedValueOnce({ slug: 'windows-x86' })
    await expect(
      repo.create(baseCreateData({ platformId: PLATFORM_WINDOWS, os: PcOs.MACOS })),
    ).rejects.toThrow(/does not match the selected operating system/i)
    expect(prisma.userPcPreset.create).not.toHaveBeenCalled()
  })

  it('accepts macos-arm platform with MACOS os', async () => {
    prisma.platform.findUnique.mockResolvedValueOnce({ slug: 'macos-arm' })
    await expect(
      repo.create(baseCreateData({ platformId: PLATFORM_MACOS_ARM, os: PcOs.MACOS })),
    ).resolves.toBeDefined()
  })

  it('accepts linux-arm (UNIVERSAL scope) with any desktop OS', async () => {
    prisma.platform.findUnique.mockResolvedValueOnce({ slug: 'linux-arm' })
    await expect(
      repo.create(baseCreateData({ platformId: PLATFORM_LINUX_ARM, os: PcOs.LINUX })),
    ).resolves.toBeDefined()
  })
})

describe('UserPcPresetsRepository platform/OS consistency (update)', () => {
  let prisma: MockPrisma
  let repo: UserPcPresetsRepository

  function stubExistingPreset(os: PcOs | null = PcOs.WINDOWS) {
    prisma.userPcPreset.findUnique.mockResolvedValueOnce({
      id: PRESET_ID,
      userId: USER_ID,
      name: 'Existing',
      cpuId: CPU_ID,
      gpuId: GPU_ID,
      memorySize: 16,
      os,
      osVersion: 'Windows 10',
      platformId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      cpu: { id: CPU_ID, brand: { id: 'b', name: 'Intel' } },
      gpu: { id: GPU_ID, brand: { id: 'b', name: 'NVIDIA' } },
    })
  }

  beforeEach(() => {
    prisma = createMockPrisma()
    repo = new UserPcPresetsRepository(prisma as unknown as PrismaClient)
  })

  it('skips platform lookup when platformId is undefined', async () => {
    stubExistingPreset()
    await repo.update(PRESET_ID, USER_ID, { name: 'Renamed' }, { requestingUserRole: Role.USER })
    expect(prisma.platform.findUnique).not.toHaveBeenCalled()
  })

  it('validates against incoming os when os is also updated', async () => {
    stubExistingPreset(PcOs.WINDOWS)
    prisma.platform.findUnique.mockResolvedValueOnce({ slug: 'windows-x86' })
    await expect(
      repo.update(
        PRESET_ID,
        USER_ID,
        { platformId: PLATFORM_WINDOWS, os: PcOs.MACOS },
        { requestingUserRole: Role.USER },
      ),
    ).rejects.toThrow(/does not match the selected operating system/i)
  })

  it('falls back to stored os when os is not part of the update', async () => {
    stubExistingPreset(PcOs.MACOS)
    prisma.platform.findUnique.mockResolvedValueOnce({ slug: 'windows-x86' })
    await expect(
      repo.update(
        PRESET_ID,
        USER_ID,
        { platformId: PLATFORM_WINDOWS },
        { requestingUserRole: Role.USER },
      ),
    ).rejects.toThrow(/does not match the selected operating system/i)
  })

  it('accepts consistent platform/os update', async () => {
    stubExistingPreset(PcOs.LINUX)
    prisma.platform.findUnique.mockResolvedValueOnce({ slug: 'linux-arm' })
    await expect(
      repo.update(
        PRESET_ID,
        USER_ID,
        { platformId: PLATFORM_LINUX_ARM, os: PcOs.LINUX },
        { requestingUserRole: Role.USER },
      ),
    ).resolves.toBeDefined()
  })

  it('rejects an update that sets a nonexistent platformId', async () => {
    stubExistingPreset(PcOs.WINDOWS)
    prisma.platform.findUnique.mockResolvedValueOnce(null)
    await expect(
      repo.update(PRESET_ID, USER_ID, { platformId: 'nope' }, { requestingUserRole: Role.USER }),
    ).rejects.toThrow(/not found/i)
  })

  it('allows explicit null to clear platformId without validation', async () => {
    stubExistingPreset(PcOs.WINDOWS)
    await expect(
      repo.update(PRESET_ID, USER_ID, { platformId: null }, { requestingUserRole: Role.USER }),
    ).resolves.toBeDefined()
    expect(prisma.platform.findUnique).not.toHaveBeenCalled()
  })
})
