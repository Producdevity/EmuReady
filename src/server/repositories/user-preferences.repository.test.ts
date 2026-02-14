import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role, type PrismaClient } from '@orm'
import { UserPreferencesRepository } from './user-preferences.repository'

vi.mock('@orm', async () => {
  const actual = await import('@orm')
  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      QueryMode: { insensitive: 'insensitive' },
      SortOrder: { asc: 'asc', desc: 'desc' },
    },
  }
})

const now = new Date()

const mockUser = {
  id: 'user-1',
  clerkId: 'clerk-1',
  email: 'test@example.com',
  name: 'Test User',
  bio: 'Hello world',
  profileImage: null,
  role: Role.USER,
  createdAt: now,
  trustScore: 0,
  lastActiveAt: now,
  defaultToUserDevices: false,
  defaultToUserSocs: false,
  notifyOnNewListings: true,
  showNsfw: false,
  lastUsedDeviceId: null,
  devicePreferences: [],
  socPreferences: [],
}

const mockDevice = {
  id: 'device-1',
  socId: 'soc-1',
  brandId: 'brand-1',
  modelName: 'Steam Deck',
}

const mockSoc = {
  id: 'soc-1',
  name: 'Snapdragon 8 Gen 2',
  manufacturer: 'Qualcomm',
  architecture: null,
  processNode: null,
  cpuCores: null,
  gpuModel: null,
  createdAt: now,
}

function createMockPrisma() {
  const mock = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    device: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    userDevicePreference: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    soC: {
      findMany: vi.fn(),
    },
    userSocPreference: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: typeof mock) => Promise<unknown>) => fn(mock)),
  } as unknown as PrismaClient
  return mock
}

describe('UserPreferencesRepository', () => {
  let prisma: PrismaClient
  let repository: UserPreferencesRepository

  beforeEach(() => {
    prisma = createMockPrisma()
    repository = new UserPreferencesRepository(prisma)
  })

  describe('get', () => {
    it('should return user preferences', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)

      const result = await repository.get('user-1')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: UserPreferencesRepository.selects.preferences,
      })
    })

    it('should throw when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(repository.get('nonexistent')).rejects.toThrow('User not found')
    })
  })

  describe('update', () => {
    it('should update boolean preferences', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        ...mockUser,
        showNsfw: true,
      })

      await repository.update('user-1', { showNsfw: true })

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { showNsfw: true },
        select: UserPreferencesRepository.selects.preferencesBasic,
      })
    })

    it('should sanitize bio on update', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        ...mockUser,
        bio: 'Clean bio',
      })

      await repository.update('user-1', { bio: '<script>alert("xss")</script>Clean bio' })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bio: 'alert("xss")Clean bio' },
        }),
      )
    })

    it('should only include provided fields in updateData', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUser)

      await repository.update('user-1', { notifyOnNewListings: false })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { notifyOnNewListings: false },
        }),
      )
    })

    it('should throw when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(repository.update('nonexistent', { showNsfw: true })).rejects.toThrow(
        'User not found',
      )
    })
  })

  describe('addDevice', () => {
    it('should add a device preference', async () => {
      const mockCreated = {
        id: 'pref-1',
        userId: 'user-1',
        deviceId: 'device-1',
        createdAt: now,
        device: mockDevice,
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.device.findUnique).mockResolvedValueOnce(mockDevice)
      vi.mocked(prisma.userDevicePreference.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.userDevicePreference.create).mockResolvedValueOnce(mockCreated)

      const result = await repository.addDevice('user-1', 'device-1')

      expect(result).toEqual(mockCreated)
      expect(prisma.userDevicePreference.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', deviceId: 'device-1' },
        include: UserPreferencesRepository.includes.deviceWithRelations,
      })
    })

    it('should throw when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.device.findUnique).mockResolvedValueOnce(mockDevice)

      await expect(repository.addDevice('nonexistent', 'device-1')).rejects.toThrow(
        'User not found',
      )
    })

    it('should throw when device not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.device.findUnique).mockResolvedValueOnce(null)

      await expect(repository.addDevice('user-1', 'nonexistent')).rejects.toThrow(
        'Device not found',
      )
    })

    it('should throw when preference already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.device.findUnique).mockResolvedValueOnce(mockDevice)
      vi.mocked(prisma.userDevicePreference.findUnique).mockResolvedValueOnce({
        id: 'pref-1',
        userId: 'user-1',
        deviceId: 'device-1',
        createdAt: now,
      })

      await expect(repository.addDevice('user-1', 'device-1')).rejects.toThrow(
        'Device preference already exists',
      )
    })
  })

  describe('removeDevice', () => {
    it('should remove a device preference', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.userDevicePreference.findUnique).mockResolvedValueOnce({
        id: 'pref-1',
        userId: 'user-1',
        deviceId: 'device-1',
        createdAt: now,
      })
      vi.mocked(prisma.userDevicePreference.delete).mockResolvedValueOnce({
        id: 'pref-1',
        userId: 'user-1',
        deviceId: 'device-1',
        createdAt: now,
      })

      const result = await repository.removeDevice('user-1', 'device-1')

      expect(result).toEqual({ success: true })
      expect(prisma.userDevicePreference.delete).toHaveBeenCalledWith({
        where: { id: 'pref-1' },
      })
    })

    it('should throw when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(repository.removeDevice('nonexistent', 'device-1')).rejects.toThrow(
        'User not found',
      )
    })

    it('should throw when preference not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.userDevicePreference.findUnique).mockResolvedValueOnce(null)

      await expect(repository.removeDevice('user-1', 'device-1')).rejects.toThrow(
        'Device not found in user preferences',
      )
    })
  })

  describe('bulkUpdateDevices', () => {
    it('should replace all device preferences in a transaction', async () => {
      const mockDevices = [
        { ...mockDevice, id: 'device-1' },
        { ...mockDevice, id: 'device-2' },
      ]
      const mockPreferences = [
        {
          id: 'pref-1',
          userId: 'user-1',
          deviceId: 'device-1',
          createdAt: now,
          device: mockDevices[0],
        },
        {
          id: 'pref-2',
          userId: 'user-1',
          deviceId: 'device-2',
          createdAt: now,
          device: mockDevices[1],
        },
      ]

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.device.findMany).mockResolvedValueOnce(mockDevices)
      vi.mocked(prisma.userDevicePreference.deleteMany).mockResolvedValueOnce({ count: 1 })
      vi.mocked(prisma.userDevicePreference.createMany).mockResolvedValueOnce({ count: 2 })
      vi.mocked(prisma.userDevicePreference.findMany).mockResolvedValueOnce(mockPreferences)

      const result = await repository.bulkUpdateDevices('user-1', ['device-1', 'device-2'])

      expect(result).toEqual(mockPreferences)
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.userDevicePreference.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
      expect(prisma.userDevicePreference.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', deviceId: 'device-1' },
          { userId: 'user-1', deviceId: 'device-2' },
        ],
      })
    })

    it('should clear all preferences when given empty array', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.userDevicePreference.deleteMany).mockResolvedValueOnce({ count: 2 })
      vi.mocked(prisma.userDevicePreference.findMany).mockResolvedValueOnce([])

      const result = await repository.bulkUpdateDevices('user-1', [])

      expect(result).toEqual([])
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.userDevicePreference.deleteMany).toHaveBeenCalled()
      expect(prisma.userDevicePreference.createMany).not.toHaveBeenCalled()
    })

    it('should throw when some devices not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.device.findMany).mockResolvedValueOnce([mockDevice])

      await expect(
        repository.bulkUpdateDevices('user-1', ['device-1', 'device-missing']),
      ).rejects.toThrow('Device not found')
    })

    it('should throw when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(repository.bulkUpdateDevices('nonexistent', ['device-1'])).rejects.toThrow(
        'User not found',
      )
    })
  })

  describe('bulkUpdateSocs', () => {
    it('should replace all SOC preferences in a transaction', async () => {
      const mockSocs = [
        { ...mockSoc, id: 'soc-1' },
        { ...mockSoc, id: 'soc-2' },
      ]
      const mockPreferences = [
        {
          id: 'pref-1',
          userId: 'user-1',
          socId: 'soc-1',
          createdAt: now,
          updatedAt: now,
          soc: mockSocs[0],
        },
        {
          id: 'pref-2',
          userId: 'user-1',
          socId: 'soc-2',
          createdAt: now,
          updatedAt: now,
          soc: mockSocs[1],
        },
      ]

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.soC.findMany).mockResolvedValueOnce(mockSocs)
      vi.mocked(prisma.userSocPreference.deleteMany).mockResolvedValueOnce({ count: 1 })
      vi.mocked(prisma.userSocPreference.createMany).mockResolvedValueOnce({ count: 2 })
      vi.mocked(prisma.userSocPreference.findMany).mockResolvedValueOnce(mockPreferences)

      const result = await repository.bulkUpdateSocs('user-1', ['soc-1', 'soc-2'])

      expect(result).toEqual(mockPreferences)
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.userSocPreference.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      })
      expect(prisma.userSocPreference.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', socId: 'soc-1' },
          { userId: 'user-1', socId: 'soc-2' },
        ],
      })
    })

    it('should clear all SOC preferences when given empty array', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.userSocPreference.deleteMany).mockResolvedValueOnce({ count: 1 })
      vi.mocked(prisma.userSocPreference.findMany).mockResolvedValueOnce([])

      const result = await repository.bulkUpdateSocs('user-1', [])

      expect(result).toEqual([])
      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.userSocPreference.deleteMany).toHaveBeenCalled()
      expect(prisma.userSocPreference.createMany).not.toHaveBeenCalled()
    })

    it('should throw when some SOCs not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser)
      vi.mocked(prisma.soC.findMany).mockResolvedValueOnce([mockSoc])

      await expect(repository.bulkUpdateSocs('user-1', ['soc-1', 'soc-missing'])).rejects.toThrow(
        'SoC not found',
      )
    })

    it('should throw when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      await expect(repository.bulkUpdateSocs('nonexistent', ['soc-1'])).rejects.toThrow(
        'User not found',
      )
    })
  })
})
