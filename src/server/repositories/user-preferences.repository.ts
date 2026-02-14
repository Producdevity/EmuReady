import { ResourceError } from '@/lib/errors'
import { sanitizeBio } from '@/utils/sanitization'
import { type Prisma } from '@orm'
import { BaseRepository } from './base.repository'
import type { UpdateUserPreferencesSchema } from '@/schemas/userPreferences'
import type { z } from 'zod'

type UpdatePreferencesInput = z.infer<typeof UpdateUserPreferencesSchema>

/**
 * Repository for User Preferences data access
 */
export class UserPreferencesRepository extends BaseRepository {
  static readonly selects = {
    preferences: {
      id: true,
      bio: true,
      defaultToUserDevices: true,
      defaultToUserSocs: true,
      notifyOnNewListings: true,
      showNsfw: true,
      devicePreferences: {
        select: {
          id: true,
          deviceId: true,
          device: {
            select: {
              id: true,
              modelName: true,
              brand: { select: { id: true, name: true } },
              soc: { select: { id: true, name: true, manufacturer: true } },
            },
          },
        },
      },
      socPreferences: {
        select: {
          id: true,
          socId: true,
          soc: { select: { id: true, name: true, manufacturer: true } },
        },
      },
    } satisfies Prisma.UserSelect,

    preferencesBasic: {
      id: true,
      bio: true,
      defaultToUserDevices: true,
      defaultToUserSocs: true,
      notifyOnNewListings: true,
      showNsfw: true,
    } satisfies Prisma.UserSelect,
  } as const

  static readonly includes = {
    deviceWithRelations: {
      device: { include: { brand: true, soc: true } },
    } satisfies Prisma.UserDevicePreferenceInclude,

    socWithRelations: {
      soc: true,
    } satisfies Prisma.UserSocPreferenceInclude,
  } as const

  /**
   * Get user preferences by user ID
   */
  async get(userId: string) {
    return this.handleDatabaseOperation(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: UserPreferencesRepository.selects.preferences,
      })

      if (!user) throw ResourceError.user.notFound()

      return user
    }, 'UserPreferences')
  }

  /**
   * Update user preference fields
   */
  async update(userId: string, input: UpdatePreferencesInput) {
    return this.handleDatabaseOperation(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) throw ResourceError.user.notFound()

      const updateData: Prisma.UserUpdateInput = {}

      if (input.defaultToUserDevices !== undefined) {
        updateData.defaultToUserDevices = input.defaultToUserDevices
      }
      if (input.defaultToUserSocs !== undefined) {
        updateData.defaultToUserSocs = input.defaultToUserSocs
      }
      if (input.notifyOnNewListings !== undefined) {
        updateData.notifyOnNewListings = input.notifyOnNewListings
      }
      if (input.showNsfw !== undefined) {
        updateData.showNsfw = input.showNsfw
      }
      if (input.bio !== undefined) {
        updateData.bio = sanitizeBio(input.bio)
      }

      return this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: UserPreferencesRepository.selects.preferencesBasic,
      })
    }, 'UserPreferences')
  }

  /**
   * Add a device to user preferences
   */
  async addDevice(userId: string, deviceId: string) {
    return this.handleDatabaseOperation(async () => {
      const [user, device] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.device.findUnique({ where: { id: deviceId } }),
      ])

      if (!user) throw ResourceError.user.notFound()
      if (!device) throw ResourceError.device.notFound()

      const existing = await this.prisma.userDevicePreference.findUnique({
        where: { userId_deviceId: { userId, deviceId } },
      })

      if (existing) throw ResourceError.userDevicePreference.alreadyExists()

      return this.prisma.userDevicePreference.create({
        data: { userId, deviceId },
        include: UserPreferencesRepository.includes.deviceWithRelations,
      })
    }, 'UserDevicePreference')
  }

  /**
   * Remove a device from user preferences
   */
  async removeDevice(userId: string, deviceId: string) {
    return this.handleDatabaseOperation(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) throw ResourceError.user.notFound()

      const preference = await this.prisma.userDevicePreference.findUnique({
        where: { userId_deviceId: { userId, deviceId } },
      })

      if (!preference) throw ResourceError.userDevicePreference.notInPreferences()

      await this.prisma.userDevicePreference.delete({
        where: { id: preference.id },
      })

      return { success: true }
    }, 'UserDevicePreference')
  }

  /**
   * Replace all device preferences with a new set
   */
  async bulkUpdateDevices(userId: string, deviceIds: string[]) {
    return this.handleDatabaseOperation(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) throw ResourceError.user.notFound()

      if (deviceIds.length > 0) {
        const devices = await this.prisma.device.findMany({
          where: { id: { in: deviceIds } },
        })

        if (devices.length !== deviceIds.length) {
          throw ResourceError.device.notFound()
        }
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.userDevicePreference.deleteMany({
          where: { userId },
        })

        if (deviceIds.length > 0) {
          await tx.userDevicePreference.createMany({
            data: deviceIds.map((deviceId) => ({ userId, deviceId })),
          })
        }

        return tx.userDevicePreference.findMany({
          where: { userId },
          include: UserPreferencesRepository.includes.deviceWithRelations,
        })
      })
    }, 'UserDevicePreference')
  }

  /**
   * Replace all SOC preferences with a new set
   */
  async bulkUpdateSocs(userId: string, socIds: string[]) {
    return this.handleDatabaseOperation(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) throw ResourceError.user.notFound()

      if (socIds.length > 0) {
        const socs = await this.prisma.soC.findMany({
          where: { id: { in: socIds } },
        })

        if (socs.length !== socIds.length) {
          throw ResourceError.soc.notFound()
        }
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.userSocPreference.deleteMany({
          where: { userId },
        })

        if (socIds.length > 0) {
          await tx.userSocPreference.createMany({
            data: socIds.map((socId) => ({ userId, socId })),
          })
        }

        return tx.userSocPreference.findMany({
          where: { userId },
          include: UserPreferencesRepository.includes.socWithRelations,
        })
      })
    }, 'UserSocPreference')
  }
}
