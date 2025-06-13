import { prisma } from '@/server/db'
import {
  type NotificationType,
  type NotificationCategory,
  type Prisma,
} from '@orm'
import { createEmailService } from './emailService'
import {
  notificationEventEmitter,
  type NotificationEventData,
} from './eventEmitter'
import { notificationRateLimitService } from './rateLimitService'
import { realtimeNotificationService } from './realtimeService'
import { notificationTemplateEngine } from './templates'
import type {
  NotificationData,
  NotificationServiceConfig,
  NotificationDeliveryResult,
  NotificationEventPayload,
} from './types'

export class NotificationService {
  private config: NotificationServiceConfig
  private emailService = createEmailService()

  constructor(config: Partial<NotificationServiceConfig> = {}) {
    this.config = {
      enableEmailDelivery: false,
      enableRealTimeDelivery: true,
      maxRetries: 3,
      retryDelayMs: 1000,
      batchSize: 50,
      rateLimitPerMinute: 60,
      ...config,
    }
    this.setupEventListeners()
  }

  async createNotification(data: NotificationData): Promise<string> {
    // Check rate limits first
    const rateLimitStatus = await notificationRateLimitService.checkRateLimit(
      data.userId,
      data.type,
    )

    if (!rateLimitStatus.allowed) {
      console.warn(
        `Notification blocked by rate limit: ${rateLimitStatus.reason}`,
      )
      throw new Error(`Rate limit exceeded: ${rateLimitStatus.reason}`)
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        deliveryChannel: data.deliveryChannel || 'IN_APP',
        deliveryStatus: 'PENDING',
      },
    })

    // Record the notification for rate limiting
    notificationRateLimitService.recordNotification(data.userId, data.type)

    // Attempt delivery
    await this.deliverNotification(notification.id, data)

    return notification.id
  }

  async createNotificationFromEvent(
    eventData: NotificationEventData,
    userId: string,
  ): Promise<string | null> {
    try {
      // Map event type to notification type
      const notificationType = this.mapEventToNotificationType(
        eventData.eventType,
      )
      if (!notificationType) {
        return null
      }

      // Check user preferences
      const shouldSend = await this.shouldSendNotification(
        userId,
        notificationType,
        eventData,
      )
      if (!shouldSend) {
        return null
      }

      // Generate notification content
      const template = notificationTemplateEngine.generateTemplate(
        notificationType,
        {
          eventData,
          userId,
        },
      )

      // Create notification
      const notificationData: NotificationData = {
        userId,
        type: notificationType,
        category: notificationTemplateEngine.getCategory(notificationType),
        title: template.title,
        message: template.message,
        actionUrl: template.actionUrl,
        metadata: template.metadata,
        deliveryChannel: 'IN_APP', // Default to in-app for now
      }

      return await this.createNotification(notificationData)
    } catch (error) {
      console.error('Error creating notification from event:', error)
      return null
    }
  }

  private async deliverNotification(
    notificationId: string,
    data: NotificationData,
  ): Promise<void> {
    const deliveryResults: NotificationDeliveryResult[] = []

    // Always deliver in-app notifications
    const inAppResult = await this.deliverInApp(notificationId, data)
    deliveryResults.push(inAppResult)

    // Deliver email if enabled and email service is configured
    if (
      this.config.enableEmailDelivery &&
      this.emailService &&
      data.deliveryChannel === 'EMAIL'
    ) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true },
      })

      if (user?.email) {
        const emailResult = await this.emailService.sendNotificationEmail(
          user.email,
          data,
        )
        deliveryResults.push(emailResult)
      }
    }

    // Update delivery status based on results
    const hasSuccessfulDelivery = deliveryResults.some(
      (result) => result.success,
    )
    const allDeliveriesFailed = deliveryResults.every(
      (result) => !result.success,
    )

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: hasSuccessfulDelivery
          ? 'SENT'
          : allDeliveriesFailed
            ? 'FAILED'
            : 'PENDING',
      },
    })
  }

  private async deliverInApp(
    notificationId: string,
    data: NotificationData,
  ): Promise<NotificationDeliveryResult> {
    try {
      // Send real-time notification if user is connected
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (notification) {
        const sent = realtimeNotificationService.sendNotificationToUser(
          data.userId,
          {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl || undefined,
            createdAt: notification.createdAt.toISOString(),
          },
        )

        // Also update unread count
        const unreadCount = await prisma.notification.count({
          where: {
            userId: data.userId,
            isRead: false,
          },
        })

        realtimeNotificationService.sendUnreadCountToUser(
          data.userId,
          unreadCount,
        )

        console.log(
          `Real-time notification ${sent ? 'sent' : 'queued'} for user ${data.userId}`,
        )
      }

      return {
        success: true,
        channel: 'IN_APP',
        status: 'SENT',
      }
    } catch (error) {
      console.error('In-app delivery error:', error)
      return {
        success: false,
        channel: 'IN_APP',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private async shouldSendNotification(
    userId: string,
    notificationType: NotificationType,
    eventData: NotificationEventData,
  ): Promise<boolean> {
    // Check global preferences
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId,
          type: notificationType,
        },
      },
    })

    if (!preference || !preference.inAppEnabled) {
      return false
    }

    // Check per-listing preferences for listing-related notifications
    if (eventData.payload?.listingId) {
      const listingPreference =
        await prisma.listingNotificationPreference.findUnique({
          where: {
            userId_listingId: {
              userId,
              listingId: eventData.payload.listingId as string,
            },
          },
        })

      if (listingPreference && !listingPreference.isEnabled) {
        return false
      }
    }

    return true
  }

  private mapEventToNotificationType(
    eventType: string,
  ): NotificationType | null {
    const eventTypeMap: Record<string, NotificationType> = {
      'listing.created': 'NEW_DEVICE_LISTING',
      'listing.commented': 'LISTING_COMMENT',
      'listing.voted': 'LISTING_VOTE_UP',
      'comment.created': 'COMMENT_REPLY',
      'comment.replied': 'COMMENT_REPLY',
      'user.mentioned': 'USER_MENTION',
      'listing.approved': 'LISTING_APPROVED',
      'listing.rejected': 'LISTING_REJECTED',
      'listing.status_overridden': 'LISTING_APPROVED',
      'content.flagged': 'CONTENT_FLAGGED',
      'game.added': 'GAME_ADDED',
      'emulator.updated': 'EMULATOR_UPDATED',
      'maintenance.scheduled': 'MAINTENANCE_NOTICE',
      'feature.announced': 'FEATURE_ANNOUNCEMENT',
    }

    return eventTypeMap[eventType] || null
  }

  async getUserNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      isRead?: boolean
      category?: string
    } = {},
  ) {
    const { limit = 20, offset = 0, isRead, category } = options

    const where: Prisma.NotificationWhereInput = { userId }
    if (isRead !== undefined) {
      where.isRead = isRead
    }
    if (category) {
      where.category = category as NotificationCategory
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ])

    return {
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    })
  }

  async updateNotificationPreference(
    userId: string,
    type: NotificationType,
    preferences: { inAppEnabled?: boolean; emailEnabled?: boolean },
  ): Promise<void> {
    await prisma.notificationPreference.upsert({
      where: {
        userId_type: { userId, type },
      },
      update: preferences,
      create: {
        userId,
        type,
        inAppEnabled: preferences.inAppEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? false,
      },
    })
  }

  async updateListingNotificationPreference(
    userId: string,
    listingId: string,
    isEnabled: boolean,
  ): Promise<void> {
    await prisma.listingNotificationPreference.upsert({
      where: {
        userId_listingId: { userId, listingId },
      },
      update: { isEnabled },
      create: {
        userId,
        listingId,
        isEnabled,
      },
    })
  }

  setupEventListeners(): void {
    notificationEventEmitter.onNotificationEvent(
      this.handleNotificationEvent.bind(this),
    )
  }

  private async handleNotificationEvent(
    eventData: NotificationEventData,
  ): Promise<void> {
    try {
      // Get users to notify
      const userIds = await this.getUsersForEvent(eventData)

      // Create notifications for each user
      const notificationPromises = userIds.map((userId) =>
        this.createNotificationFromEvent(eventData, userId),
      )

      await Promise.allSettled(notificationPromises)
    } catch (error) {
      console.error('Error handling notification event:', error)
    }
  }

  private async getUsersForEvent(
    eventData: NotificationEventData,
  ): Promise<string[]> {
    const userIds: string[] = []

    switch (eventData.eventType) {
      case 'listing.commented':
      case 'listing.voted':
        // Get listing author (but not the person who triggered the event)
        if (eventData.payload?.listingId && eventData.triggeredBy) {
          const listing = await prisma.listing.findUnique({
            where: { id: eventData.payload.listingId as string },
            select: { authorId: true },
          })
          if (listing && listing.authorId !== eventData.triggeredBy) {
            userIds.push(listing.authorId)
          }
        }
        break

      case 'comment.replied':
        // Get parent comment author
        if (eventData.payload?.parentId && eventData.triggeredBy) {
          const comment = await prisma.comment.findUnique({
            where: { id: eventData.payload.parentId as string },
            select: { userId: true },
          })
          if (comment && comment.userId !== eventData.triggeredBy) {
            userIds.push(comment.userId)
          }
        }
        break

      case 'listing.created':
        // Get users with matching device/SOC preferences
        if (eventData.payload?.deviceId || eventData.payload?.socId) {
          const users = await this.getUsersWithMatchingPreferences(
            eventData.payload,
          )
          userIds.push(...users.map((u) => u.id))
        }
        break

      case 'user.mentioned':
        // Get mentioned user
        if (eventData.payload?.userId) {
          userIds.push(eventData.payload.userId as string)
        }
        break

      case 'listing.approved':
      case 'listing.rejected':
        // Get listing author
        if (eventData.payload?.listingId) {
          const listing = await prisma.listing.findUnique({
            where: { id: eventData.payload.listingId as string },
            select: { authorId: true },
          })
          if (listing) {
            userIds.push(listing.authorId)
          }
        }
        break

      default:
        // For system events, get all users with system notification preferences enabled
        const systemUsers = await prisma.user.findMany({
          where: {
            notificationPreferences: {
              some: {
                type: 'MAINTENANCE_NOTICE',
                inAppEnabled: true,
              },
            },
          },
          select: { id: true },
        })
        userIds.push(...systemUsers.map((u) => u.id))
    }

    return userIds
  }

  private async getUsersWithMatchingPreferences(
    payload: NotificationEventPayload,
  ): Promise<{ id: string }[]> {
    const where: Prisma.UserWhereInput = {
      notifyOnNewListings: true,
    }

    if (payload.deviceId) {
      where.devicePreferences = {
        some: { deviceId: payload.deviceId },
      }
    }

    if (payload.socId) {
      where.socPreferences = {
        some: { socId: payload.socId },
      }
    }

    return prisma.user.findMany({
      where,
      select: { id: true },
    })
  }
}

export const notificationService = new NotificationService()
