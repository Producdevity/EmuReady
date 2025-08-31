import { ResourceError } from '@/lib/errors'
import { GetNotificationsSchema, MarkNotificationReadSchema } from '@/schemas/mobile'
import { createMobileTRPCRouter, mobileProtectedProcedure } from '@/server/api/mobileContext'
import { paginate } from '@/server/utils/pagination'

export const mobileNotificationsRouter = createMobileTRPCRouter({
  /**
   * Get notifications with pagination
   */
  get: mobileProtectedProcedure.input(GetNotificationsSchema).query(async ({ ctx, input }) => {
    const { page = 1, limit = 20, unreadOnly = false } = input ?? {}
    const actualOffset = (page - 1) * limit

    const baseWhere = { userId: ctx.session.user.id }

    if (unreadOnly) Object.assign(baseWhere, { isRead: false })

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

    const pagination = paginate({ total: total, page, limit: limit })

    return {
      notifications,
      pagination,
    }
  }),

  /**
   * Get unread notification count
   */
  unreadCount: mobileProtectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.notification.count({
      where: {
        userId: ctx.session.user.id,
        isRead: false,
      },
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
})
