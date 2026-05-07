import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type PrismaClient } from '@orm'
import { EmulatorsRepository } from './emulators.repository'

const EMULATOR_ID = '00000000-0000-4000-a000-000000000001'
const PLATFORM_WINDOWS = '00000000-0000-4000-a000-000000000101'
const PLATFORM_LINUX_X86 = '00000000-0000-4000-a000-000000000102'
const PLATFORM_MACOS_ARM = '00000000-0000-4000-a000-000000000103'

type MockPrisma = {
  emulator: { update: ReturnType<typeof vi.fn> }
}

function createMockPrisma(): MockPrisma {
  return {
    emulator: {
      update: vi.fn().mockResolvedValue({
        id: EMULATOR_ID,
        systems: [],
        platforms: [],
        verifiedDevelopers: [],
        _count: { listings: 0, systems: 0 },
      }),
    },
  }
}

describe('EmulatorsRepository.updateSupportedPlatforms', () => {
  let prisma: MockPrisma
  let repo: EmulatorsRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repo = new EmulatorsRepository(prisma as unknown as PrismaClient)
  })

  it('issues a single update that clears then recreates junction rows for the given platform ids', async () => {
    await repo.updateSupportedPlatforms(EMULATOR_ID, [PLATFORM_WINDOWS, PLATFORM_LINUX_X86])

    expect(prisma.emulator.update).toHaveBeenCalledTimes(1)
    const call = prisma.emulator.update.mock.calls[0][0]
    expect(call.where).toEqual({ id: EMULATOR_ID })
    expect(call.data.platforms).toEqual({
      deleteMany: {},
      create: [{ platformId: PLATFORM_WINDOWS }, { platformId: PLATFORM_LINUX_X86 }],
    })
  })

  it('clears all platforms when given an empty list (deleteMany + empty create)', async () => {
    await repo.updateSupportedPlatforms(EMULATOR_ID, [])

    const call = prisma.emulator.update.mock.calls[0][0]
    expect(call.data.platforms).toEqual({
      deleteMany: {},
      create: [],
    })
  })

  it('is idempotent: re-running with the same ids produces the same operation shape', async () => {
    const ids = [PLATFORM_WINDOWS, PLATFORM_MACOS_ARM]
    await repo.updateSupportedPlatforms(EMULATOR_ID, ids)
    await repo.updateSupportedPlatforms(EMULATOR_ID, ids)

    const [firstCall, secondCall] = prisma.emulator.update.mock.calls
    expect(firstCall[0].data.platforms).toEqual(secondCall[0].data.platforms)
  })

  it('includes the `default` shape for the return payload', async () => {
    await repo.updateSupportedPlatforms(EMULATOR_ID, [PLATFORM_WINDOWS])
    const call = prisma.emulator.update.mock.calls[0][0]
    expect(call.include).toBeDefined()
    // Confirm we're returning platforms + systems + verifiedDevelopers via
    // the default include shape. The runtime include object is the same
    // object reference exposed on the class, so pointer-equality is fine
    // and prevents accidental regressions to a different include.
    expect(call.include).toBe(EmulatorsRepository.includes.default)
  })
})
