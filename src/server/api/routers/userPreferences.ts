import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { ResourceError } from '@/lib/errors'
import {
  UpdateUserPreferencesSchema,
  AddDevicePreferenceSchema,
  RemoveDevicePreferenceSchema,
  BulkUpdateDevicePreferencesSchema,
} from '@/schemas/userPreferences'

export const userPreferencesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        defaultToUserDevices: true,
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
      },
    })

    if (!user) return ResourceError.user.notFound()

    return user
  }),

  update: protectedProcedure
    .input(UpdateUserPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) return ResourceError.user.notFound()

      return ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          defaultToUserDevices: input.defaultToUserDevices,
          notifyOnNewListings: input.notifyOnNewListings,
        },
        select: {
          id: true,
          defaultToUserDevices: true,
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

      if (existingPreference) {
        throw new Error('Device is already in your preferences')
      }

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
        throw new Error('Device not found in your preferences')
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
      const devices = await ctx.prisma.device.findMany({
        where: { id: { in: input.deviceIds } },
      })

      if (devices.length !== input.deviceIds.length) {
        throw new Error('One or more devices not found')
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
        include: {
          device: {
            include: {
              brand: true,
              soc: true,
            },
          },
        },
      })
    }),
})

export default userPreferencesRouter
