import { ResourceError } from '@/lib/errors'
import {
  GetNotificationsSchema,
  MarkNotificationReadSchema,
  UpdateNotificationPreferenceMobileSchema,
} from '@/schemas/mobile'
import { createMobileTRPCRouter, mobileProtectedProcedure } from '@/server/api/mobileContext'
import { notificationService } from '@/server/notifications/service'
import { notificationTemplateEngine } from '@/server/notifications/templates'
import { paginate } from '@/server/utils/pagination'
import { formatEnumLabel } from '@/utils/format'
import { NotificationType, Role } from '@orm'

export const mobileNotificationsRouter = createMobileTRPCRouter({
  /**
   * Get notifications with pagination
   */
  get: mobileProtectedProcedure.input(GetNotificationsSchema).query(async ({ ctx, input }) => {
    const { page = 1, limit = 20, unreadOnly = false } = input ?? {}
    const actualOffset = (page - 1) * limit

    const baseWhere = {
      userId: ctx.session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    }

    const [notifications, total] = await Promise.all([
      ctx.prisma.notification.findMany({
        where: baseWhere,
        skip: actualOffset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
          actionUrl: true,
        },
      }),
      ctx.prisma.notification.count({ where: baseWhere }),
    ])

    return {
      notifications,
      pagination: paginate({ total, page, limit }),
    }
  }),

  /**
   * Get unread notification count
   */
  unreadCount: mobileProtectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.notification.count({
      where: { userId: ctx.session.user.id, isRead: false },
    })
  }),

  /**
   * Mark notification as read
   */
  markAsRead: mobileProtectedProcedure
    .input(MarkNotificationReadSchema)
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.notificationId },
        select: { userId: true },
      })

      if (!notification) return ResourceError.notification.notFound()

      if (notification.userId !== ctx.session.user.id) {
        return ResourceError.notification.canOnlyMarkOwnAsRead()
      }

      await ctx.prisma.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      })

      return { success: true }
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: mobileProtectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: { userId: ctx.session.user.id, isRead: false },
      data: { isRead: true },
    })

    return { success: true }
  }),

  // Preferences subgroup following cpus-style naming (get/update)
  preferences: createMobileTRPCRouter({
    get: mobileProtectedProcedure.query(async ({ ctx }) => {
      return await ctx.prisma.notificationPreference.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { type: 'asc' },
      })
    }),
    // Return the available notification types with categories and default behavior
    types: createMobileTRPCRouter({
      get: mobileProtectedProcedure.query(async ({ ctx }) => {
        const types = notificationTemplateEngine.getAvailableTypes()

        const defaultsOffForNonModerators = new Set<NotificationType>([
          NotificationType.MAINTENANCE_NOTICE,
          NotificationType.FEATURE_ANNOUNCEMENT,
          NotificationType.POLICY_UPDATE,
        ])

        const isModeratorOrAbove =
          ctx.session.user.role === Role.MODERATOR ||
          ctx.session.user.role === Role.ADMIN ||
          ctx.session.user.role === Role.SUPER_ADMIN

        return types.map((type) => ({
          type,
          category: notificationTemplateEngine.getCategory(type),
          label: formatEnumLabel(type),
          defaultInAppEnabled: isModeratorOrAbove || !defaultsOffForNonModerators.has(type),
          defaultEmailEnabled: false,
        }))
      }),
    }),
    update: mobileProtectedProcedure
      .input(UpdateNotificationPreferenceMobileSchema)
      .mutation(async ({ ctx, input }) => {
        await notificationService.updateNotificationPreference(ctx.session.user.id, input.type, {
          inAppEnabled: input.inAppEnabled,
          emailEnabled: input.emailEnabled,
        })
        return { success: true }
      }),
  }),
})
