import { AppError } from '@/lib/errors'
import {
  CreateSystemNotificationSchema,
  DeleteNotificationSchema,
  GetListingPreferencesSchema,
  GetNotificationsSchema,
  MarkAsReadSchema,
  UpdateListingNotificationPreferenceSchema,
  UpdateNotificationPreferenceSchema,
} from '@/schemas/notification'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { notificationService } from '@/server/notifications/service'
import { hasPermission } from '@/utils/permissions'
import { DeliveryChannel, NotificationCategory, Role } from '@orm'

export const notificationsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(GetNotificationsSchema)
    .query(async ({ ctx, input }) => {
      return notificationService.getUserNotifications(
        ctx.session.user.id,
        input,
      )
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) =>
    notificationService.getUnreadCount(ctx.session.user.id),
  ),

  markAsRead: protectedProcedure
    .input(MarkAsReadSchema)
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
    .input(DeleteNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      await notificationService.deleteNotification(
        input.notificationId,
        ctx.session.user.id,
      )
      return { success: true }
    }),

  getPreferences: protectedProcedure.query(
    async ({ ctx }) =>
      await ctx.prisma.notificationPreference.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { type: 'asc' },
      }),
  ),

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
    .input(GetListingPreferencesSchema)
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
    .input(CreateSystemNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (!hasPermission(ctx.session.user.role, Role.ADMIN)) {
        return AppError.insufficientPermissions()
      }

      // Get all users
      const users = await ctx.prisma.user.findMany({
        select: { id: true },
      })

      // Create notification for each user
      const notificationIds: string[] = []
      for (const user of users) {
        const notificationId = await notificationService.createNotification(
          {
            userId: user.id,
            type: input.type,
            category: NotificationCategory.SYSTEM,
            title: input.title,
            message: input.message,
            actionUrl: input.actionUrl,
            metadata: input.metadata,
            deliveryChannel: DeliveryChannel.IN_APP,
          },
          { immediate: true }, // Admin system notifications should be delivered immediately
        )
        notificationIds.push(notificationId)
      }

      return { success: true, notificationIds }
    }),

  // Analytics endpoints
  getNotificationStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, unread, byCategory] = await Promise.all([
      ctx.prisma.notification.count({ where: { userId: ctx.session.user.id } }),
      ctx.prisma.notification.count({
        where: { userId: ctx.session.user.id, isRead: false },
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

  // Admin endpoint for monitoring batching queue
  getBatchingStatus: protectedProcedure.query(async ({ ctx }) => {
    return hasPermission(ctx.session.user.role, Role.ADMIN)
      ? notificationService.getBatchingQueueStatus()
      : AppError.insufficientPermissions()
  }),
})
