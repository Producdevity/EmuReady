import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { notificationService } from '@/server/notifications/service'

const GetNotificationsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  isRead: z.boolean().optional(),
  category: z
    .enum(['ENGAGEMENT', 'CONTENT', 'SYSTEM', 'MODERATION'])
    .optional(),
})

const UpdateNotificationPreferenceSchema = z.object({
  type: z.enum([
    'LISTING_COMMENT',
    'LISTING_VOTE_UP',
    'LISTING_VOTE_DOWN',
    'COMMENT_REPLY',
    'USER_MENTION',
    'NEW_DEVICE_LISTING',
    'NEW_SOC_LISTING',
    'GAME_ADDED',
    'EMULATOR_UPDATED',
    'MAINTENANCE_NOTICE',
    'FEATURE_ANNOUNCEMENT',
    'POLICY_UPDATE',
    'LISTING_APPROVED',
    'LISTING_REJECTED',
    'CONTENT_FLAGGED',
    'ACCOUNT_WARNING',
  ]),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
})

const UpdateListingNotificationPreferenceSchema = z.object({
  listingId: z.string(),
  isEnabled: z.boolean(),
})

export const notificationsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(GetNotificationsSchema)
    .query(async ({ ctx, input }) => {
      return notificationService.getUserNotifications(
        ctx.session.user.id,
        input,
      )
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return notificationService.getUnreadCount(ctx.session.user.id)
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await notificationService.markAsRead(
        input.notificationId,
        ctx.session.user.id,
      )
      return { success: true }
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await notificationService.markAllAsRead(ctx.session.user.id)
    return { success: true }
  }),

  delete: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await notificationService.deleteNotification(
        input.notificationId,
        ctx.session.user.id,
      )
      return { success: true }
    }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await ctx.prisma.notificationPreference.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { type: 'asc' },
    })

    return preferences
  }),

  updatePreference: protectedProcedure
    .input(UpdateNotificationPreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      await notificationService.updateNotificationPreference(
        ctx.session.user.id,
        input.type,
        {
          inAppEnabled: input.inAppEnabled,
          emailEnabled: input.emailEnabled,
        },
      )

      return { success: true }
    }),

  getListingPreferences: protectedProcedure
    .input(z.object({ listingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const preference =
        await ctx.prisma.listingNotificationPreference.findUnique({
          where: {
            userId_listingId: {
              userId: ctx.session.user.id,
              listingId: input.listingId,
            },
          },
        })

      return preference || { isEnabled: true } // Default to enabled if no preference exists
    }),

  updateListingPreference: protectedProcedure
    .input(UpdateListingNotificationPreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      await notificationService.updateListingNotificationPreference(
        ctx.session.user.id,
        input.listingId,
        input.isEnabled,
      )

      return { success: true }
    }),

  // Admin endpoints for system notifications
  createSystemNotification: protectedProcedure
    .input(
      z.object({
        title: z.string().max(255),
        message: z.string(),
        actionUrl: z.string().optional(),
        type: z.enum([
          'MAINTENANCE_NOTICE',
          'FEATURE_ANNOUNCEMENT',
          'POLICY_UPDATE',
        ]),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (
        ctx.session.user.role !== 'ADMIN' &&
        ctx.session.user.role !== 'SUPER_ADMIN'
      ) {
        throw new Error('Insufficient permissions')
      }

      // Get all users
      const users = await ctx.prisma.user.findMany({
        select: { id: true },
      })

      // Create notification for each user
      const notificationIds: string[] = []
      for (const user of users) {
        const notificationId = await notificationService.createNotification({
          userId: user.id,
          type: input.type,
          category: 'SYSTEM',
          title: input.title,
          message: input.message,
          actionUrl: input.actionUrl,
          metadata: input.metadata,
          deliveryChannel: 'IN_APP',
        })
        notificationIds.push(notificationId)
      }

      return { success: true, notificationIds }
    }),

  // Analytics endpoints
  getNotificationStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, unread, byCategory] = await Promise.all([
      ctx.prisma.notification.count({
        where: { userId: ctx.session.user.id },
      }),
      ctx.prisma.notification.count({
        where: {
          userId: ctx.session.user.id,
          isRead: false,
        },
      }),
      ctx.prisma.notification.groupBy({
        by: ['category'],
        where: { userId: ctx.session.user.id },
        _count: { id: true },
      }),
    ])

    return {
      total,
      unread,
      byCategory: byCategory.reduce(
        (acc, item) => {
          acc[item.category] = item._count.id
          return acc
        },
        {} as Record<string, number>,
      ),
    }
  }),
})
