import { ResourceError, AppError } from '@/lib/errors'
import {
  UpdateUserPreferencesSchema,
  AddDevicePreferenceSchema,
  RemoveDevicePreferenceSchema,
  BulkUpdateDevicePreferencesSchema,
  BulkUpdateSocPreferencesSchema,
} from '@/schemas/userPreferences'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { sanitizeBio } from '@/utils/sanitization'

export const userPreferencesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        bio: true,
        defaultToUserDevices: true,
        defaultToUserSocs: true,
        notifyOnNewListings: true,
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
      },
    })

    return user ?? ResourceError.user.notFound()
  }),

  update: protectedProcedure
    .input(UpdateUserPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Sanitize bio if provided
      const updateData: {
        defaultToUserDevices?: boolean
        defaultToUserSocs?: boolean
        notifyOnNewListings?: boolean
        bio?: string
      } = {}

      if (input.defaultToUserDevices !== undefined) {
        updateData.defaultToUserDevices = input.defaultToUserDevices
      }
      if (input.defaultToUserSocs !== undefined) {
        updateData.defaultToUserSocs = input.defaultToUserSocs
      }
      if (input.notifyOnNewListings !== undefined) {
        updateData.notifyOnNewListings = input.notifyOnNewListings
      }
      if (input.bio !== undefined) {
        updateData.bio = sanitizeBio(input.bio)
      }

      return ctx.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          bio: true,
          defaultToUserDevices: true,
          defaultToUserSocs: true,
          notifyOnNewListings: true,
        },
      })
    }),

  addDevice: protectedProcedure
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
      const existingPreference =
        await ctx.prisma.userDevicePreference.findUnique({
          where: {
            userId_deviceId: {
              userId: user.id,
              deviceId: input.deviceId,
            },
          },
        })

      if (existingPreference)
        return ResourceError.userDevicePreference.alreadyExists()

      return ctx.prisma.userDevicePreference.create({
        data: { userId: user.id, deviceId: input.deviceId },
        include: { device: { include: { brand: true, soc: true } } },
      })
    }),

  removeDevice: protectedProcedure
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

  bulkUpdateDevices: protectedProcedure
    .input(BulkUpdateDevicePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Validate all devices exist
      if (input.deviceIds.length > 0) {
        const devices = await ctx.prisma.device.findMany({
          where: { id: { in: input.deviceIds } },
        })

        if (devices.length !== input.deviceIds.length) {
          const foundIds = new Set(devices.map((d) => d.id))
          const missingIds = input.deviceIds.filter((id) => !foundIds.has(id))
          return AppError.badRequest(
            `Device(s) not found: ${missingIds.join(', ')}`,
          )
        }
      }

      // Remove existing preferences
      await ctx.prisma.userDevicePreference.deleteMany({
        where: { userId: user.id },
      })

      // Add new preferences
      if (input.deviceIds.length > 0) {
        await ctx.prisma.userDevicePreference.createMany({
          data: input.deviceIds.map((deviceId) => ({
            userId: user.id,
            deviceId,
          })),
        })
      }

      // Return updated preferences
      return ctx.prisma.userDevicePreference.findMany({
        where: { userId: user.id },
        include: { device: { include: { brand: true, soc: true } } },
      })
    }),

  bulkUpdateSocs: protectedProcedure
    .input(BulkUpdateSocPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      // Validate all SOCs exist
      if (input.socIds.length > 0) {
        const socs = await ctx.prisma.soC.findMany({
          where: { id: { in: input.socIds } },
        })

        if (socs.length !== input.socIds.length) {
          const foundIds = new Set(socs.map((s) => s.id))
          const missingIds = input.socIds.filter((id) => !foundIds.has(id))
          return AppError.badRequest(
            `SOC(s) not found: ${missingIds.join(', ')}`,
          )
        }
      }

      // Remove existing preferences
      await ctx.prisma.userSocPreference.deleteMany({
        where: { userId: user.id },
      })

      // Add new preferences
      if (input.socIds.length > 0) {
        await ctx.prisma.userSocPreference.createMany({
          data: input.socIds.map((socId) => ({
            userId: user.id,
            socId,
          })),
        })
      }

      // Return updated preferences
      return ctx.prisma.userSocPreference.findMany({
        where: { userId: user.id },
        include: { soc: true },
      })
    }),
})

export default userPreferencesRouter
