import { AppError, ResourceError } from '@/lib/errors'
import {
  AddDevicePreferenceSchema,
  BulkUpdateDevicePreferencesSchema,
  BulkUpdateSocPreferencesSchema,
  GetUserProfileSchema,
  RemoveDevicePreferenceSchema,
  UpdateProfileSchema,
  UpdateUserPreferencesSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobileProtectedProcedure } from '@/server/api/mobileContext'
import { checkProfileAccess } from '@/server/services/user-profile.service'
import { sanitizeBio } from '@/utils/sanitization'

export const mobilePreferencesRouter = createMobileTRPCRouter({
  /**
   * Get user preferences
   */
  get: mobileProtectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        settings: {
          select: {
            defaultToUserDevices: true,
            defaultToUserSocs: true,
            notifyOnNewListings: true,
          },
        },
        devicePreferences: {
          include: {
            device: {
              include: {
                brand: { select: { id: true, name: true } },
                soc: { select: { id: true, name: true, manufacturer: true } },
              },
            },
          },
        },
        socPreferences: {
          include: {
            soc: { select: { id: true, name: true, manufacturer: true } },
          },
        },
      },
    })

    if (!user) return ResourceError.user.notFound()

    return {
      devicePreferences: user.devicePreferences,
      socPreferences: user.socPreferences,
      defaultToUserDevices: user.settings?.defaultToUserDevices ?? false,
      defaultToUserSocs: user.settings?.defaultToUserSocs ?? false,
      notifyOnNewListings: user.settings?.notifyOnNewListings ?? true,
    }
  }),

  /**
   * Update user preferences
   */
  update: mobileProtectedProcedure
    .input(UpdateUserPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      })

      if (!user) return ResourceError.user.notFound()

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

      // Atomic: bio + settings + re-read in a single transaction
      return ctx.prisma.$transaction(async (tx) => {
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

        const updated = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            id: true,
            bio: true,
            settings: {
              select: {
                defaultToUserDevices: true,
                defaultToUserSocs: true,
                notifyOnNewListings: true,
              },
            },
          },
        })

        return {
          id: updated.id,
          bio: updated.bio,
          defaultToUserDevices: updated.settings?.defaultToUserDevices ?? false,
          defaultToUserSocs: updated.settings?.defaultToUserSocs ?? false,
          notifyOnNewListings: updated.settings?.notifyOnNewListings ?? true,
        }
      })
    }),

  /**
   * Add device preference
   */
  addDevice: mobileProtectedProcedure
    .input(AddDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Check if device exists
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.deviceId },
      })

      if (!device) return ResourceError.device.notFound()

      // Check if preference already exists
      const existingPreference = await ctx.prisma.userDevicePreference.findUnique({
        where: {
          userId_deviceId: { userId: user.id, deviceId: input.deviceId },
        },
      })

      if (existingPreference) {
        return ResourceError.userDevicePreference.alreadyExists()
      }

      return ctx.prisma.userDevicePreference.create({
        data: { userId: user.id, deviceId: input.deviceId },
        include: { device: { include: { brand: true, soc: true } } },
      })
    }),

  /**
   * Remove device preference
   */
  removeDevice: mobileProtectedProcedure
    .input(RemoveDevicePreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      const preference = await ctx.prisma.userDevicePreference.findUnique({
        where: {
          userId_deviceId: { userId: user.id, deviceId: input.deviceId },
        },
      })

      if (!preference) {
        return ResourceError.userDevicePreference.notInPreferences()
      }

      await ctx.prisma.userDevicePreference.delete({
        where: { id: preference.id },
      })

      return { success: true }
    }),

  /**
   * Bulk update device preferences
   */
  bulkUpdateDevices: mobileProtectedProcedure
    .input(BulkUpdateDevicePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Skip validation if no devices provided (user wants to clear all)
      if (input.deviceIds.length > 0) {
        // Validate all devices exist
        const devices = await ctx.prisma.device.findMany({
          where: { id: { in: input.deviceIds } },
        })

        if (devices.length !== input.deviceIds.length) {
          const foundIds = devices.map((d) => d.id)
          const missingIds = input.deviceIds.filter((id) => !foundIds.includes(id))
          return AppError.badRequest(`Devices not found: ${missingIds.join(', ')}`)
        }
      }

      // Use transaction for atomic operation
      await ctx.prisma.$transaction(async (tx) => {
        // Get existing preferences
        const existing = await tx.userDevicePreference.findMany({
          where: { userId: user.id },
          select: { deviceId: true },
        })

        const existingIds = new Set(existing.map((e) => e.deviceId))
        const newIds = new Set(input.deviceIds)

        // Calculate differences
        const toDelete = [...existingIds].filter((id) => !newIds.has(id))
        const toAdd = [...newIds].filter((id) => !existingIds.has(id))

        // Delete removed preferences
        if (toDelete.length > 0) {
          await tx.userDevicePreference.deleteMany({
            where: {
              userId: user.id,
              deviceId: { in: toDelete },
            },
          })
        }

        // Add new preferences
        if (toAdd.length > 0) {
          await tx.userDevicePreference.createMany({
            data: toAdd.map((deviceId) => ({
              userId: user.id,
              deviceId,
            })),
          })
        }
      })

      // Return updated preferences
      return ctx.prisma.userDevicePreference.findMany({
        where: { userId: user.id },
        include: { device: { include: { brand: true, soc: true } } },
      })
    }),

  /**
   * Bulk update SOC preferences
   */
  bulkUpdateSocs: mobileProtectedProcedure
    .input(BulkUpdateSocPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Skip validation if no SOCs provided (user wants to clear all)
      if (input.socIds.length > 0) {
        // Validate all SOCs exist
        const socs = await ctx.prisma.soC.findMany({
          where: { id: { in: input.socIds } },
        })

        if (socs.length !== input.socIds.length) {
          const foundIds = socs.map((s) => s.id)
          const missingIds = input.socIds.filter((id) => !foundIds.includes(id))
          return AppError.badRequest(`SOCs not found: ${missingIds.join(', ')}`)
        }
      }

      // Use transaction for atomic operation
      await ctx.prisma.$transaction(async (tx) => {
        // Get existing preferences
        const existing = await tx.userSocPreference.findMany({
          where: { userId: user.id },
          select: { socId: true },
        })

        const existingIds = new Set(existing.map((e) => e.socId))
        const newIds = new Set(input.socIds)

        // Calculate differences
        const toDelete = [...existingIds].filter((id) => !newIds.has(id))
        const toAdd = [...newIds].filter((id) => !existingIds.has(id))

        // Delete removed preferences
        if (toDelete.length > 0) {
          await tx.userSocPreference.deleteMany({
            where: {
              userId: user.id,
              socId: { in: toDelete },
            },
          })
        }

        // Add new preferences
        if (toAdd.length > 0) {
          await tx.userSocPreference.createMany({
            data: toAdd.map((socId) => ({ userId: user.id, socId })),
          })
        }
      })

      // Return updated preferences
      return ctx.prisma.userSocPreference.findMany({
        where: { userId: user.id },
        include: { soc: true },
      })
    }),

  /**
   * Get current user's profile
   */
  currentProfile: mobileProtectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        trustScore: true,
        profileImage: true,
        role: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            votes: true,
            comments: true,
            submittedGames: true,
            pcListings: true,
          },
        },
      },
    })

    if (!user) return null

    // Get total votes received on user's content
    const [listingVotesReceived, pcListingVotesReceived] = await Promise.all([
      ctx.prisma.vote.count({
        where: {
          listing: {
            authorId: ctx.session.user.id,
          },
        },
      }),
      ctx.prisma.pcListingVote.count({
        where: {
          pcListing: {
            authorId: ctx.session.user.id,
          },
        },
      }),
    ])

    return {
      ...user,
      votesReceived: listingVotesReceived + pcListingVotesReceived,
    }
  }),

  /**
   * Get user profile by ID
   */
  profile: mobileProtectedProcedure.input(GetUserProfileSchema).query(async ({ ctx, input }) => {
    const access = await checkProfileAccess(ctx.prisma, input.userId, {
      currentUserId: ctx.session.user.id,
      currentUserRole: ctx.session.user.role,
    })

    if (!access.accessible) {
      if (access.reason === 'not_found') return null
      if (access.reason === 'banned') return ResourceError.user.profileNotAccessible()

      // Private profile: return minimal data with zeroed counts
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true, name: true, createdAt: true },
      })
      if (!user) return null
      return { ...user, bio: null, _count: { listings: 0, votes: 0, comments: 0 } }
    }

    return await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        name: true,
        bio: true,
        createdAt: true,
        _count: { select: { listings: true, votes: true, comments: true } },
      },
    })
  }),

  /**
   * Update profile
   */
  updateProfile: mobileProtectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      // Explicitly filter allowed fields to prevent updatedAt errors
      const updateData: { name?: string; bio?: string } = {}

      if (input.name !== undefined) updateData.name = input.name
      if (input.bio !== undefined) updateData.bio = sanitizeBio(input.bio)

      return await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: updateData,
        select: { id: true, name: true, bio: true, createdAt: true },
      })
    }),
})
