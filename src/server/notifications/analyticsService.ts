import { prisma } from '@/server/db'
import { notificationAnalyticsCache } from '@/server/utils/cache'
import {
  DeliveryChannel,
  NotificationDeliveryStatus,
  type NotificationType,
} from '@orm'

export interface NotificationMetrics {
  totalSent: number
  totalDelivered: number
  totalFailed: number
  deliveryRate: number
  openRate: number
  clickRate: number
  unsubscribeRate: number
}

export interface ChannelMetrics {
  inApp: NotificationMetrics
  email: NotificationMetrics
  combined: NotificationMetrics
}

export interface TypeMetrics {
  [key: string]: NotificationMetrics
}

export interface UserEngagementMetrics {
  userId: string
  totalReceived: number
  totalRead: number
  totalClicked: number
  readRate: number
  clickRate: number
  lastActive: Date | null
  preferredChannel: DeliveryChannel
}

export interface TimeSeriesData {
  date: string
  sent: number
  delivered: number
  opened: number
  clicked: number
}

export class NotificationAnalyticsService {
  private generateCacheKey(
    method: string,
    params: Record<string, unknown> = {},
  ): string {
    // Sort params for consistent cache keys
    const sortedParams = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')

    return `analytics:${method}:${sortedParams}`
  }

  // Get overall notification metrics
  async getOverallMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<NotificationMetrics> {
    const cacheKey = this.generateCacheKey('getOverallMetrics', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    })

    const cached = notificationAnalyticsCache.get(cacheKey)
    if (cached) {
      return cached as NotificationMetrics
    }

    const whereClause = this.buildDateFilter(startDate, endDate)

    const [totalSent, totalDelivered, totalFailed, totalRead] =
      await Promise.all([
        // Total attempted notifications (sent + failed)
        prisma.notification.count({
          where: whereClause,
        }),
        // Successfully delivered notifications
        prisma.notification.count({
          where: {
            ...whereClause,
            deliveryStatus: NotificationDeliveryStatus.SENT,
          },
        }),
        prisma.notification.count({
          where: {
            ...whereClause,
            deliveryStatus: NotificationDeliveryStatus.FAILED,
          },
        }),
        prisma.notification.count({
          where: {
            ...whereClause,
            isRead: true,
          },
        }),
      ])

    // For now, click rate is estimated based on action URL presence and read status
    const totalWithActions = await prisma.notification.count({
      where: {
        ...whereClause,
        actionUrl: { not: null },
        isRead: true,
      },
    })

    const result: NotificationMetrics = {
      totalSent,
      totalDelivered,
      totalFailed,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
      clickRate: totalRead > 0 ? (totalWithActions / totalRead) * 100 : 0,
      unsubscribeRate: 0, // Would need to track unsubscribe events
    }

    notificationAnalyticsCache.set(cacheKey, result)
    return result
  }

  // Get metrics by delivery channel
  async getChannelMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<ChannelMetrics> {
    const cacheKey = this.generateCacheKey('getChannelMetrics', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    })

    const cached = notificationAnalyticsCache.get(cacheKey)
    if (cached) {
      return cached as ChannelMetrics
    }

    const whereClause = this.buildDateFilter(startDate, endDate)

    const [inAppMetrics, emailMetrics] = await Promise.all([
      this.getMetricsForChannel(DeliveryChannel.IN_APP, whereClause),
      this.getMetricsForChannel(DeliveryChannel.EMAIL, whereClause),
    ])

    const combined: NotificationMetrics = {
      totalSent: inAppMetrics.totalSent + emailMetrics.totalSent,
      totalDelivered: inAppMetrics.totalDelivered + emailMetrics.totalDelivered,
      totalFailed: inAppMetrics.totalFailed + emailMetrics.totalFailed,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
    }

    // Calculate combined rates
    combined.deliveryRate =
      combined.totalSent > 0
        ? (combined.totalDelivered / combined.totalSent) * 100
        : 0

    const totalRead = await prisma.notification.count({
      where: {
        ...whereClause,
        isRead: true,
      },
    })

    combined.openRate =
      combined.totalSent > 0 ? (totalRead / combined.totalSent) * 100 : 0

    const result: ChannelMetrics = {
      inApp: inAppMetrics,
      email: emailMetrics,
      combined,
    }

    notificationAnalyticsCache.set(cacheKey, result)
    return result
  }

  // Get metrics by notification type
  async getTypeMetrics(startDate?: Date, endDate?: Date): Promise<TypeMetrics> {
    const cacheKey = this.generateCacheKey('getTypeMetrics', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    })

    const cached = notificationAnalyticsCache.get(cacheKey)
    if (cached) {
      return cached as TypeMetrics
    }

    const whereClause = this.buildDateFilter(startDate, endDate)

    const types = await prisma.notification.groupBy({
      by: ['type'],
      where: whereClause,
      _count: true,
    })

    const typeMetrics: TypeMetrics = {}

    for (const typeGroup of types) {
      const typeWhereClause = {
        ...whereClause,
        type: typeGroup.type,
      }

      const [totalSent, totalDelivered, totalFailed, totalRead] =
        await Promise.all([
          // Total attempted notifications (sent + failed)
          prisma.notification.count({
            where: typeWhereClause,
          }),
          // Successfully delivered notifications
          prisma.notification.count({
            where: {
              ...typeWhereClause,
              deliveryStatus: NotificationDeliveryStatus.SENT,
            },
          }),
          prisma.notification.count({
            where: {
              ...typeWhereClause,
              deliveryStatus: NotificationDeliveryStatus.FAILED,
            },
          }),
          prisma.notification.count({
            where: {
              ...typeWhereClause,
              isRead: true,
            },
          }),
        ])

      const totalWithActions = await prisma.notification.count({
        where: {
          ...typeWhereClause,
          actionUrl: { not: null },
          isRead: true,
        },
      })

      typeMetrics[typeGroup.type] = {
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
        clickRate: totalRead > 0 ? (totalWithActions / totalRead) * 100 : 0,
        unsubscribeRate: 0,
      }
    }

    notificationAnalyticsCache.set(cacheKey, typeMetrics)
    return typeMetrics
  }

  // Get user engagement metrics
  async getUserEngagementMetrics(
    limit: number = 100,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserEngagementMetrics[]> {
    const cacheKey = this.generateCacheKey('getUserEngagementMetrics', {
      limit,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    })

    const cached = notificationAnalyticsCache.get(cacheKey)
    if (cached) {
      return cached as UserEngagementMetrics[]
    }

    const whereClause = this.buildDateFilter(startDate, endDate)

    const userStats = await prisma.notification.groupBy({
      by: ['userId'],
      where: whereClause,
      _count: {
        id: true,
      },
      _max: {
        updatedAt: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    })

    const userMetrics: UserEngagementMetrics[] = []

    for (const userStat of userStats) {
      const userId = userStat.userId
      const totalReceived = userStat._count.id

      const [totalRead, totalWithActions, preferredChannelData] =
        await Promise.all([
          prisma.notification.count({
            where: {
              ...whereClause,
              userId,
              isRead: true,
            },
          }),
          prisma.notification.count({
            where: {
              ...whereClause,
              userId,
              actionUrl: { not: null },
              isRead: true,
            },
          }),
          prisma.notification.groupBy({
            by: ['deliveryChannel'],
            where: { ...whereClause, userId },
            _count: true,
            orderBy: { _count: { deliveryChannel: 'desc' } },
            take: 1,
          }),
        ])

      const preferredChannel =
        preferredChannelData[0]?.deliveryChannel || DeliveryChannel.IN_APP

      userMetrics.push({
        userId,
        totalReceived,
        totalRead,
        totalClicked: totalWithActions,
        readRate: totalReceived > 0 ? (totalRead / totalReceived) * 100 : 0,
        clickRate: totalRead > 0 ? (totalWithActions / totalRead) * 100 : 0,
        lastActive: userStat._max.updatedAt,
        preferredChannel,
      })
    }

    notificationAnalyticsCache.set(cacheKey, userMetrics)
    return userMetrics
  }

  // Get time series data for analytics charts
  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day',
  ): Promise<TimeSeriesData[]> {
    const cacheKey = this.generateCacheKey('getTimeSeriesData', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      granularity,
    })

    const cached = notificationAnalyticsCache.get(cacheKey)
    if (cached) {
      return cached as TimeSeriesData[]
    }

    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        deliveryStatus: true,
        isRead: true,
        actionUrl: true,
      },
    })

    // Group notifications by date
    const grouped = new Map<string, TimeSeriesData>()

    for (const notification of notifications) {
      const dateKey = this.formatDate(notification.createdAt, granularity)

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
        })
      }

      const data = grouped.get(dateKey)!
      data.sent++

      if (notification.deliveryStatus === NotificationDeliveryStatus.SENT) {
        data.delivered++
      }

      if (notification.isRead) {
        data.opened++
        if (notification.actionUrl) {
          data.clicked++
        }
      }
    }

    const result = Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    )

    notificationAnalyticsCache.set(cacheKey, result)
    return result
  }

  // Get top performing notification types
  async getTopPerformingTypes(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      type: NotificationType
      totalSent: number
      openRate: number
      clickRate: number
    }>
  > {
    const cacheKey = this.generateCacheKey('getTopPerformingTypes', {
      limit,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    })

    const cached = notificationAnalyticsCache.get(cacheKey)
    if (cached) {
      return cached as Array<{
        type: NotificationType
        totalSent: number
        openRate: number
        clickRate: number
      }>
    }

    const whereClause = this.buildDateFilter(startDate, endDate)

    const typeStats = await prisma.notification.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    })

    const results = []

    for (const typeStat of typeStats) {
      const typeWhereClause = {
        ...whereClause,
        type: typeStat.type,
      }

      const [totalRead, totalWithActions] = await Promise.all([
        prisma.notification.count({
          where: {
            ...typeWhereClause,
            isRead: true,
          },
        }),
        prisma.notification.count({
          where: {
            ...typeWhereClause,
            actionUrl: { not: null },
            isRead: true,
          },
        }),
      ])

      const totalSent = typeStat._count.id
      const openRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0
      const clickRate = totalRead > 0 ? (totalWithActions / totalRead) * 100 : 0

      results.push({
        type: typeStat.type,
        totalSent,
        openRate,
        clickRate,
      })
    }

    const result = results.sort((a, b) => b.openRate - a.openRate)
    notificationAnalyticsCache.set(cacheKey, result)
    return result
  }

  clearCache(): void {
    notificationAnalyticsCache.clear()
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return notificationAnalyticsCache.getStats()
  }

  private buildDateFilter(
    startDate?: Date,
    endDate?: Date,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {}

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate)
        (filter.createdAt as Record<string, unknown>).gte = startDate
      if (endDate) (filter.createdAt as Record<string, unknown>).lte = endDate
    }

    return filter
  }

  private async getMetricsForChannel(
    channel: Exclude<DeliveryChannel, 'BOTH'>,
    whereClause: Record<string, unknown>,
  ): Promise<NotificationMetrics> {
    // Query for exact channel match
    const exactChannelClause = {
      ...whereClause,
      deliveryChannel: channel,
    }

    // Query for BOTH channel match
    const bothChannelClause = {
      ...whereClause,
      deliveryChannel: DeliveryChannel.BOTH,
    }

    const [exactSent, exactDelivered, exactFailed, exactRead] =
      await Promise.all([
        // Total attempted notifications for exact channel
        prisma.notification.count({
          where: exactChannelClause,
        }),
        // Successfully delivered notifications for exact channel
        prisma.notification.count({
          where: {
            ...exactChannelClause,
            deliveryStatus: NotificationDeliveryStatus.SENT,
          },
        }),
        prisma.notification.count({
          where: {
            ...exactChannelClause,
            deliveryStatus: NotificationDeliveryStatus.FAILED,
          },
        }),
        prisma.notification.count({
          where: {
            ...exactChannelClause,
            isRead: true,
          },
        }),
      ])

    const [bothSent, bothDelivered, bothFailed, bothRead] = await Promise.all([
      // Total attempted notifications for BOTH channel
      prisma.notification.count({ where: bothChannelClause }),
      // Successfully delivered notifications for BOTH channel
      prisma.notification.count({
        where: {
          ...bothChannelClause,
          deliveryStatus: NotificationDeliveryStatus.SENT,
        },
      }),
      prisma.notification.count({
        where: {
          ...bothChannelClause,
          deliveryStatus: NotificationDeliveryStatus.FAILED,
        },
      }),
      prisma.notification.count({
        where: { ...bothChannelClause, isRead: true },
      }),
    ])

    const totalSent = exactSent + bothSent
    const totalDelivered = exactDelivered + bothDelivered
    const totalFailed = exactFailed + bothFailed
    const totalRead = exactRead + bothRead

    const exactWithActions = await prisma.notification.count({
      where: {
        ...exactChannelClause,
        actionUrl: { not: null },
        isRead: true,
      },
    })

    const bothWithActions = await prisma.notification.count({
      where: {
        ...bothChannelClause,
        actionUrl: { not: null },
        isRead: true,
      },
    })

    const totalWithActions = exactWithActions + bothWithActions

    return {
      totalSent,
      totalDelivered,
      totalFailed,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      openRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
      clickRate: totalRead > 0 ? (totalWithActions / totalRead) * 100 : 0,
      unsubscribeRate: 0,
    }
  }

  private formatDate(
    date: Date,
    granularity: 'day' | 'week' | 'month',
  ): string {
    switch (granularity) {
      case 'day':
        return date.toISOString().split('T')[0]
      case 'week':
        const week = this.getWeekNumber(date)
        return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`
      case 'month':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      default:
        return date.toISOString().split('T')[0]
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    )
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }
}

// Singleton instance
export const notificationAnalyticsService = new NotificationAnalyticsService()
