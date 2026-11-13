import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/server/db'
import { PcOs, Role } from '@orm'
import { mobilePcPresetsRouter } from './mobile/pcPresets'
import { coreRouter } from './pcListings/core'

vi.unmock('@orm')
vi.unmock('@orm/client')
vi.unmock('@/server/api/trpc')
vi.unmock('@/server/api/root')
vi.unmock('@/server/api/mobileContext')

const models = vi.hoisted(() => ({
  userPcPreset: { findFirst: vi.fn(), create: vi.fn() },
  cpu: { findUnique: vi.fn() },
  gpu: { findUnique: vi.fn() },
}))
vi.mock('@/server/db', () => ({ prisma: models }))

const userId = '00000000-0000-4000-a000-000000000001'
const otherUserId = '00000000-0000-4000-a000-000000000002'
const cpuId = '00000000-0000-4000-a000-000000000010'
const gpuId = '00000000-0000-4000-a000-000000000011'
const input = {
  name: 'Desktop',
  cpuId,
  gpuId,
  memorySize: 16,
  os: PcOs.LINUX,
  osVersion: '6.12',
}
const context = {
  prisma,
  headers: new Headers(),
  session: {
    user: {
      id: userId,
      name: 'User',
      email: 'user@example.com',
      role: Role.USER,
      permissions: [],
      showNsfw: false,
    },
  },
}
const web = coreRouter.createCaller(context)
const mobile = mobilePcPresetsRouter.createCaller({ ...context, apiKey: null })

beforeEach(() => {
  vi.clearAllMocks()
  models.userPcPreset.findFirst.mockResolvedValue(null)
  models.userPcPreset.create.mockResolvedValue({ ...input, userId, id: 'preset-1' })
  models.cpu.findUnique.mockResolvedValue({ id: cpuId })
  models.gpu.findUnique.mockResolvedValue({ id: gpuId })
})

describe.each(['web', 'mobile'] as const)('%s PC preset validation', (transport) => {
  it.each([{ name: '' }, { cpuId: 'invalid-uuid' }, { gpuId: 'invalid-uuid' }])(
    'rejects invalid input before repository access: %o',
    async (invalid) => {
      const data = { ...input, ...invalid }
      const result = transport === 'web' ? web.presets.create(data) : mobile.create(data)
      await expect(result).rejects.toMatchObject({ code: 'BAD_REQUEST' })
      expect(models.userPcPreset.findFirst).not.toHaveBeenCalled()
      expect(models.cpu.findUnique).not.toHaveBeenCalled()
      expect(models.gpu.findUnique).not.toHaveBeenCalled()
      expect(models.userPcPreset.create).not.toHaveBeenCalled()
    },
  )

  it('takes preset ownership from the session instead of extra input', async () => {
    const data = { ...input, userId: otherUserId }
    const result = transport === 'web' ? web.presets.create(data) : mobile.create(data)
    await expect(result).resolves.toMatchObject({ userId })
    expect(models.userPcPreset.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ...input, userId } }),
    )
  })

  it('still refuses a duplicate name', async () => {
    models.userPcPreset.findFirst.mockResolvedValue({ id: 'existing-preset' })
    const result = transport === 'web' ? web.presets.create(input) : mobile.create(input)
    await expect(result).rejects.toMatchObject({ code: 'CONFLICT' })
    expect(models.userPcPreset.create).not.toHaveBeenCalled()
  })

  it.each(['cpu', 'gpu'] as const)('still refuses a missing %s', async (hardware) => {
    models[hardware].findUnique.mockResolvedValue(null)
    const result = transport === 'web' ? web.presets.create(input) : mobile.create(input)
    await expect(result).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(models.userPcPreset.create).not.toHaveBeenCalled()
  })
})
