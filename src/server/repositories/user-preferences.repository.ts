import { ResourceError } from '@/lib/errors'
import { sanitizeBio } from '@/utils/sanitization'
import { type Prisma } from '@orm'
import { BaseRepository } from './base.repository'
import type { UpdateUserPreferencesSchema } from '@/schemas/userPreferences'
import type { z } from 'zod'

type UpdatePreferencesInput = z.infer<typeof UpdateUserPreferencesSchema>

const SETTINGS_FIELDS = {
  defaultToUserDevices: true,
  defaultToUserSocs: true,
  notifyOnNewListings: true,
  showNsfw: true,
  lastUsedDeviceId: true,
  profilePublic: true,
  showActivityInFeed: true,
  showVotingActivity: true,
  allowFollows: true,
  allowFriendRequests: true,
  followersVisible: true,
  followingVisible: true,
} satisfies Prisma.UserSettingsSelect

/**
 * Repository for User Preferences data access.
 * Settings are stored in the UserSettings 1:1 model.
 * Bio and device/soc preferences remain on/associated with User.
 */
export class UserPreferencesRepository extends BaseRepository {
  static readonly selects = {
    preferences: {
      id: true,
      bio: true,
      settings: {
        select: SETTINGS_FIELDS,
      },
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
      settings: {
        select: SETTINGS_FIELDS,
      },
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
   * Get user preferences by user ID.
   * Returns a flat object merging User fields (bio) with UserSettings fields.
   */
  async get(userId: string) {
    return this.handleDatabaseOperation(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: UserPreferencesRepository.selects.preferences,
      })

      if (!user) throw ResourceError.user.notFound()

      return {
        id: user.id,
        bio: user.bio,
        ...this.flattenSettings(user.settings),
        devicePreferences: user.devicePreferences,
        socPreferences: user.socPreferences,
      }
    }, 'UserPreferences')
  }

  /**
   * Update user preference fields.
   * Bio is written to User, all other settings to UserSettings.
   */
  async update(userId: string, input: UpdatePreferencesInput) {
    return this.handleDatabaseOperation(async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!user) throw ResourceError.user.notFound()

      // Build settings update data
      const settingsData: Record<string, boolean> = {}
      if (input.defaultToUserDevices !== undefined) {
        settingsData.defaultToUserDevices = input.defaultToUserDevices
      }
      if (input.defaultToUserSocs !== undefined) {
        settingsData.defaultToUserSocs = input.defaultToUserSocs
      }
      if (input.notifyOnNewListings !== undefined) {
        settingsData.notifyOnNewListings = input.notifyOnNewListings
      }
      if (input.showNsfw !== undefined) {
        settingsData.showNsfw = input.showNsfw
      }
      if (input.profilePublic !== undefined) {
        settingsData.profilePublic = input.profilePublic
      }
      if (input.showActivityInFeed !== undefined) {
        settingsData.showActivityInFeed = input.showActivityInFeed
      }
      if (input.showVotingActivity !== undefined) {
        settingsData.showVotingActivity = input.showVotingActivity
      }
      if (input.allowFollows !== undefined) {
        settingsData.allowFollows = input.allowFollows
      }
      if (input.allowFriendRequests !== undefined) {
        settingsData.allowFriendRequests = input.allowFriendRequests
      }
      if (input.followersVisible !== undefined) {
        settingsData.followersVisible = input.followersVisible
      }
      if (input.followingVisible !== undefined) {
        settingsData.followingVisible = input.followingVisible
      }

      // Atomic: bio update + settings upsert + re-read in a single transaction
      return this.prisma.$transaction(async (tx) => {
        if (input.bio !== undefined) {
          await tx.user.update({
            where: { id: userId },
            data: { bio: sanitizeBio(input.bio) },
          })
        }

        if (Object.keys(settingsData).length > 0) {
          await tx.userSettings.upsert({
            where: { userId },
            create: { userId, ...settingsData },
            update: settingsData,
          })
        }

        const updated = await tx.user.findUnique({
          where: { id: userId },
          select: UserPreferencesRepository.selects.preferencesBasic,
        })

        if (!updated) throw ResourceError.user.notFound()

        return {
          id: updated.id,
          bio: updated.bio,
          ...this.flattenSettings(updated.settings),
        }
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

  /**
   * Flatten UserSettings into a plain object with defaults for missing settings
   */
  private flattenSettings(
    settings: {
      defaultToUserDevices: boolean
      defaultToUserSocs: boolean
      notifyOnNewListings: boolean
      showNsfw: boolean
      lastUsedDeviceId: string | null
      profilePublic: boolean
      showActivityInFeed: boolean
      showVotingActivity: boolean
      allowFollows: boolean
      allowFriendRequests: boolean
      followersVisible: boolean
      followingVisible: boolean
    } | null,
  ) {
    return {
      defaultToUserDevices: settings?.defaultToUserDevices ?? false,
      defaultToUserSocs: settings?.defaultToUserSocs ?? false,
      notifyOnNewListings: settings?.notifyOnNewListings ?? true,
      showNsfw: settings?.showNsfw ?? false,
      lastUsedDeviceId: settings?.lastUsedDeviceId ?? null,
      profilePublic: settings?.profilePublic ?? true,
      showActivityInFeed: settings?.showActivityInFeed ?? true,
      showVotingActivity: settings?.showVotingActivity ?? true,
      allowFollows: settings?.allowFollows ?? true,
      allowFriendRequests: settings?.allowFriendRequests ?? true,
      followersVisible: settings?.followersVisible ?? true,
      followingVisible: settings?.followingVisible ?? true,
    }
  }
}
