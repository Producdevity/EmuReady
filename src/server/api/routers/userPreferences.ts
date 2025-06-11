import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'

export const userPreferencesRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        defaultToUserDevices: true,
        notifyOnNewListings: true,
        devicePreferences: {
          include: { device: { include: { brand: true, soc: true } } },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return user
  }),

  update: protectedProcedure
    .input(
      z.object({
        defaultToUserDevices: z.boolean().optional(),
        notifyOnNewListings: z.boolean().optional(),
      }),
    )
    .mutation(async function (opts) {
      const { ctx, input } = opts

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

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
    .input(
      z.object({
        deviceId: z.string(),
      }),
    )
    .mutation(async function (opts) {
      const { ctx, input } = opts

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Check if device exists
      const device = await ctx.prisma.device.findUnique({
        where: { id: input.deviceId },
      })

      if (!device) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device not found',
        })
      }

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
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Device is already in your preferences',
        })
      }

      return ctx.prisma.userDevicePreference.create({
        data: { userId: user.id, deviceId: input.deviceId },
        include: { device: { include: { brand: true, soc: true } } },
      })
    }),

  removeDevice: protectedProcedure
    .input(
      z.object({
        deviceId: z.string(),
      }),
    )
    .mutation(async function (opts) {
      const { ctx, input } = opts

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const preference = await ctx.prisma.userDevicePreference.findUnique({
        where: {
          userId_deviceId: { userId: user.id, deviceId: input.deviceId },
        },
      })

      if (!preference) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Device not found in your preferences',
        })
      }

      await ctx.prisma.userDevicePreference.delete({
        where: { id: preference.id },
      })

      return { success: true }
    }),

  bulkUpdateDevices: protectedProcedure
    .input(
      z.object({
        deviceIds: z.array(z.string()),
      }),
    )
    .mutation(async function (opts) {
      const { ctx, input } = opts

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      // Validate all devices exist
      const devices = await ctx.prisma.device.findMany({
        where: { id: { in: input.deviceIds } },
      })

      if (devices.length !== input.deviceIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'One or more devices not found',
        })
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
