import { logger } from '@/lib/logger'
import { prisma } from '@/server/db'
import { notificationAnalyticsService } from '@/server/notifications/analyticsService'
import { notificationBatchingService } from '@/server/notifications/batchingService'
import { paginate, calculateOffset } from '@/server/utils/pagination'
import { hasPermission } from '@/utils/permissions'
import { ms } from '@/utils/time'
import {
  DeliveryChannel,
  type NotificationCategory,
  NotificationDeliveryStatus,
  NotificationType,
  type Prisma,
  Role,
} from '@orm'
import { createEmailService } from './emailService'
import { type NotificationEventData, notificationEventEmitter } from './eventEmitter'
import { notificationRateLimitService } from './rateLimitService'
import { realtimeNotificationService } from './realtimeService'
import { notificationTemplateEngine, type TemplateContext } from './templates'
import type {
  NotificationData,
  NotificationDeliveryResult,
  NotificationEventPayload,
  NotificationServiceConfig,
} from './types'

export class NotificationService {
  private config: NotificationServiceConfig
  private emailService = createEmailService()
  private listenersSetup = false
  private systemRoles: Role[] = [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN]
  private aliasPreferenceMap: Partial<Record<NotificationType, NotificationType>> = {
    [NotificationType.COMMENT_ON_LISTING]: NotificationType.LISTING_COMMENT,
    [NotificationType.REPLY_TO_COMMENT]: NotificationType.COMMENT_REPLY,
    [NotificationType.LISTING_UPVOTED]: NotificationType.LISTING_VOTE_UP,
    [NotificationType.LISTING_DOWNVOTED]: NotificationType.LISTING_VOTE_DOWN,
  }

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

  async createNotification(
    data: NotificationData,
    options: {
      immediate?: boolean
      scheduledFor?: Date
    } = {},
  ): Promise<string> {
    // Check rate limits first
    const rateLimitStatus = await notificationRateLimitService.checkRateLimit(
      data.userId,
      data.type,
    )

    if (!rateLimitStatus.allowed) {
      console.warn(`Notification blocked by rate limit: ${rateLimitStatus.reason}`)
      throw new Error(`Rate limit exceeded: ${rateLimitStatus.reason}`)
    }

    // Record the notification for rate limiting
    notificationRateLimitService.recordNotification(data.userId, data.type)

    // Determine if we should use immediate processing or batching
    const useImmediate = options.immediate ?? false
    const scheduledFor = options.scheduledFor ?? new Date()

    if (useImmediate) {
      // Process immediately (for direct API calls, admin notifications, etc.)
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          category: data.category,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
          deliveryChannel: data.deliveryChannel || DeliveryChannel.IN_APP,
          deliveryStatus: NotificationDeliveryStatus.PENDING,
        },
      })

      // Attempt immediate delivery
      await this.deliverNotification(notification.id, data)

      // Invalidate analytics cache when new notifications are created
      notificationAnalyticsService.clearCache()

      return notification.id
    } else {
      // Use batching service for better performance and retry logic
      const batchId = notificationBatchingService.scheduleNotification(data, scheduledFor)

      console.log(`Notification scheduled for batch processing: ${batchId}`)
      return batchId
    }
  }

  async createNotificationFromEvent(
    eventData: NotificationEventData,
    userId: string,
  ): Promise<string | null> {
    try {
      // Map event type to notification type (with payload-based refinements)
      let notificationType = this.mapEventToNotificationType(eventData.eventType)
      // Refine types that depend on payload values
      if (eventData.eventType === 'listing.voted') {
        const vote = (eventData.payload?.voteValue as boolean | undefined) ?? true
        notificationType = vote
          ? NotificationType.LISTING_UPVOTED
          : NotificationType.LISTING_DOWNVOTED
      }
      if (eventData.eventType === 'comment.voted') {
        const vote = (eventData.payload?.voteValue as boolean | undefined) ?? true
        notificationType = vote
          ? NotificationType.COMMENT_UPVOTED
          : NotificationType.COMMENT_DOWNVOTED
      }
      if (!notificationType) return null

      // Check user preferences
      const shouldSend = await this.shouldSendNotification(userId, notificationType, eventData)
      if (!shouldSend) return null

      // Check for duplicate notifications before creating
      const isDuplicate = await this.checkForDuplicateNotification(userId, notificationType)
      if (isDuplicate) {
        logger.log(`Skipping duplicate notification for user ${userId}, type ${notificationType}`)
        return null
      }

      // Enrich context with database data
      const enrichedContext = await this.enrichContextWithData(eventData, notificationType)

      // Generate notification content
      const template = notificationTemplateEngine.generateTemplate(
        notificationType,
        enrichedContext,
      )

      // Create notification data
      const notificationData: NotificationData = {
        userId,
        type: notificationType,
        category: notificationTemplateEngine.getCategory(notificationType),
        title: template.title,
        message: template.message,
        actionUrl: template.actionUrl,
        metadata: template.metadata,
        deliveryChannel: DeliveryChannel.IN_APP, // Default to in-app for now
      }

      // Event-driven notifications use batching for better performance
      // This is especially important for bulk operations like listing approvals
      return await this.createNotification(notificationData, {
        immediate: false, // Use batching for event-driven notifications
      })
    } catch (error) {
      logger.error('Error creating notification from event:', error)
      return null
    }
  }

  private async deliverNotification(notificationId: string, data: NotificationData): Promise<void> {
    const deliveryResults: NotificationDeliveryResult[] = []

    // Always deliver in-app notifications
    const inAppResult = await this.deliverInApp(notificationId, data)
    deliveryResults.push(inAppResult)

    // Deliver email if enabled and email service is configured
    if (
      this.config.enableEmailDelivery &&
      this.emailService &&
      data.deliveryChannel === DeliveryChannel.EMAIL
    ) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true },
      })

      if (user?.email) {
        const emailResult = await this.emailService.sendNotificationEmail(user.email, data)
        deliveryResults.push(emailResult)
      }
    }

    // Update delivery status based on results
    const hasSuccessfulDelivery = deliveryResults.some((result) => result.success)
    const allDeliveriesFailed = deliveryResults.every((result) => !result.success)

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: hasSuccessfulDelivery
          ? NotificationDeliveryStatus.SENT
          : allDeliveriesFailed
            ? NotificationDeliveryStatus.FAILED
            : NotificationDeliveryStatus.PENDING,
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
        const sent = realtimeNotificationService.sendNotificationToUser(data.userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl || undefined,
          createdAt: notification.createdAt.toISOString(),
        })

        // Also update unread count
        const unreadCount = await prisma.notification.count({
          where: { userId: data.userId, isRead: false },
        })

        realtimeNotificationService.sendUnreadCountToUser(data.userId, unreadCount)

        logger.log(`Real-time notification ${sent ? 'sent' : 'queued'} for user ${data.userId}`)
      }

      return {
        success: true,
        channel: DeliveryChannel.IN_APP,
        status: NotificationDeliveryStatus.SENT,
      }
    } catch (error) {
      console.error('In-app delivery error:', error)
      return {
        success: false,
        channel: DeliveryChannel.IN_APP,
        status: NotificationDeliveryStatus.FAILED,
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
      where: { userId_type: { userId, type: notificationType } },
    })

    // If no preference exists and this type has an alias, check alias preference
    const aliasType = this.aliasPreferenceMap[notificationType]
    const aliasPreference =
      !preference && aliasType
        ? await prisma.notificationPreference.findUnique({
            where: { userId_type: { userId, type: aliasType } },
          })
        : null

    // If no preference exists, default to enabled for most notification types
    // Only default to disabled for system notifications for non-admin users
    if (!preference && !aliasPreference) {
      // Check if user is admin for system notifications
      if (
        notificationType === NotificationType.MAINTENANCE_NOTICE ||
        notificationType === NotificationType.FEATURE_ANNOUNCEMENT ||
        notificationType === NotificationType.POLICY_UPDATE
      ) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        })
        // Only send system notifications to moderators and above
        return user ? hasPermission(user.role, Role.MODERATOR) : false
      }
      return true // Default to enabled for other notification types
    }
    if (!(preference?.inAppEnabled ?? aliasPreference?.inAppEnabled ?? true)) return false

    // Check per-listing preferences for listing-related notifications
    if (eventData.payload?.listingId) {
      const listingPreference = await prisma.listingNotificationPreference.findUnique({
        where: { userId_listingId: { userId, listingId: eventData.payload.listingId } },
      })

      if (listingPreference && !listingPreference.isEnabled) return false
    }

    return true
  }

  private mapEventToNotificationType(eventType: string): NotificationType | null {
    const eventTypeMap: Record<string, NotificationType> = {
      'listing.created': NotificationType.NEW_DEVICE_LISTING,
      'listing.commented': NotificationType.COMMENT_ON_LISTING,
      'listing.voted': NotificationType.LISTING_UPVOTED,
      'comment.created': NotificationType.COMMENT_ON_LISTING,
      'comment.replied': NotificationType.REPLY_TO_COMMENT,
      'comment.upvoted': NotificationType.COMMENT_UPVOTED,
      'comment.downvoted': NotificationType.COMMENT_DOWNVOTED,
      'user.mentioned': NotificationType.USER_MENTION,
      'listing.approved': NotificationType.LISTING_APPROVED,
      'listing.rejected': NotificationType.LISTING_REJECTED,
      'listing.status_overridden': NotificationType.LISTING_APPROVED,
      'content.flagged': NotificationType.CONTENT_FLAGGED,
      'game.added': NotificationType.GAME_ADDED,
      'emulator.updated': NotificationType.EMULATOR_UPDATED,
      'maintenance.scheduled': NotificationType.MAINTENANCE_NOTICE,
      'feature.announced': NotificationType.FEATURE_ANNOUNCEMENT,
      'user.role_changed': NotificationType.ROLE_CHANGED,
      'user.banned': NotificationType.USER_BANNED,
      'user.unbanned': NotificationType.USER_UNBANNED,
      'report.created': NotificationType.REPORT_CREATED,
      'report.status_changed': NotificationType.REPORT_STATUS_CHANGED,
      'developer.verified': NotificationType.VERIFIED_DEVELOPER,
    }

    return eventTypeMap[eventType] || null
  }

  async getUserNotifications(
    userId: string,
    options: {
      limit?: number
      offset?: number
      page?: number
      isRead?: boolean
      category?: string
    } = {},
  ) {
    const { limit = 20, offset = 0, page, isRead, category } = options

    const where: Prisma.NotificationWhereInput = { userId }
    if (isRead !== undefined) where.isRead = isRead
    if (category) where.category = category as NotificationCategory

    const actualOffset = calculateOffset({ page, offset }, limit)

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: actualOffset,
      }),
      prisma.notification.count({ where }),
    ])

    const pagination = paginate({
      total,
      page: page ?? Math.floor(actualOffset / limit) + 1,
      limit,
    })

    return {
      notifications,
      pagination,
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Update notification as read
    const updatedCount = await prisma.notification.updateMany({
      where: { id: notificationId, userId, isRead: false }, // Only update if currently unread
      data: { isRead: true },
    })

    // If notification was actually updated, invalidate caches and update real-time count
    if (updatedCount.count > 0) {
      // Get updated unread count
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false },
      })

      // Send real-time unread count update
      realtimeNotificationService.sendUnreadCountToUser(userId, unreadCount)

      // Clear analytics cache since notification status changed
      notificationAnalyticsService.clearCache()

      logger.log(`Marked notification ${notificationId} as read for user ${userId}`)
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    // Update all unread notifications as read
    const updatedCount = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    // If any notifications were updated, invalidate caches and update real-time count
    if (updatedCount.count > 0) {
      // Send real-time unread count update (should be 0 after marking all as read)
      realtimeNotificationService.sendUnreadCountToUser(userId, 0)

      // Clear analytics cache since notification status changed
      notificationAnalyticsService.clearCache()

      logger.log(`Marked ${updatedCount.count} notifications as read for user ${userId}`)
    }
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    // First check if the notification exists and is unread
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { isRead: true },
    })

    // Delete the notification
    const deletedCount = await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    })

    // If notification was deleted and was unread, update real-time count
    if (deletedCount.count > 0) {
      // If the deleted notification was unread, update the unread count
      if (notification && !notification.isRead) {
        const unreadCount = await prisma.notification.count({
          where: { userId, isRead: false },
        })

        // Send real-time unread count update
        realtimeNotificationService.sendUnreadCountToUser(userId, unreadCount)
      }

      // Clear analytics cache since a notification was deleted
      notificationAnalyticsService.clearCache()

      console.log(`Deleted notification ${notificationId} for user ${userId}`)
    }
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
    const canonicalType = this.aliasPreferenceMap[type] ?? type
    await prisma.notificationPreference.upsert({
      where: {
        userId_type: { userId, type: canonicalType },
      },
      update: preferences,
      create: {
        userId,
        type: canonicalType,
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
    // Prevent duplicate listener registration
    if (this.listenersSetup) return

    notificationEventEmitter.onNotificationEvent(this.handleNotificationEvent.bind(this))

    this.listenersSetup = true
  }

  private async handleNotificationEvent(eventData: NotificationEventData): Promise<void> {
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

  private async getUsersForEvent(eventData: NotificationEventData): Promise<string[]> {
    const userIds: string[] = []

    switch (eventData.eventType) {
      case 'listing.verified': {
        // Notify listing author (exclude actor via global filter below)
        if (eventData.payload?.listingId) {
          const listing = await prisma.listing.findUnique({
            where: { id: eventData.payload.listingId },
            select: { authorId: true },
          })
          if (listing?.authorId) userIds.push(listing.authorId)
        }
        break
      }
      case 'listing.commented':
      case 'listing.voted':
        // Get listing author (but not the person who triggered the event)
        if (eventData.payload?.listingId && eventData.triggeredBy) {
          const listing = await prisma.listing.findUnique({
            where: { id: eventData.payload.listingId },
            select: { authorId: true },
          })
          if (listing && listing.authorId !== eventData.triggeredBy) {
            userIds.push(listing.authorId)
          }
        }
        break

      case 'comment.upvoted':
      case 'comment.downvoted':
      case 'comment.created':
      case 'comment.replied':
        // Notify comment author (but not the actor)
        if (eventData.payload?.commentId && eventData.triggeredBy) {
          const comment = await prisma.comment.findUnique({
            where: { id: eventData.payload.commentId as string },
            select: { userId: true },
          })
          if (comment && comment.userId !== eventData.triggeredBy) {
            userIds.push(comment.userId)
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
          const users = await this.getUsersWithMatchingPreferences(eventData.payload)
          userIds.push(...users.map((u) => u.id))
        }
        break

      case 'user.mentioned':
        // Get mentioned user
        if (eventData.payload?.userId) {
          userIds.push(eventData.payload.userId)
        }
        break

      case 'user.banned':
      case 'user.unbanned':
      case 'user.role_changed':
      case 'developer.verified':
        if (eventData.payload?.userId) {
          userIds.push(eventData.payload.userId)
        }
        break

      case 'report.created':
        // Notify moderators and above
        {
          const systemUsers = await prisma.user.findMany({
            where: {
              role: { in: this.systemRoles },
            },
            select: { id: true },
          })
          userIds.push(...systemUsers.map((u) => u.id))
        }
        break

      case 'report.status_changed':
        // Notify reporting user if provided
        if (eventData.payload?.userId) {
          userIds.push(eventData.payload.userId)
        }
        break

      case 'listing.approved':
      case 'listing.rejected':
        // Get listing author
        if (eventData.payload?.listingId) {
          const listing = await prisma.listing.findUnique({
            where: { id: eventData.payload.listingId },
            select: { authorId: true },
          })
          if (listing) {
            userIds.push(listing.authorId)
          }
        }
        break

      case 'user.role_changed':
        // Get the user whose role was changed
        if (eventData.payload?.userId) {
          userIds.push(eventData.payload.userId)
        }
        break

      case 'comment.deleted':
        // Do not notify anyone for deletes (avoid moderator spam)
        break

      default:
        // Unknown events: do not notify anyone by default
        break
    }

    // Exclude the actor from recipients universally (no self-notifications)
    if (eventData.triggeredBy) {
      const actorId = eventData.triggeredBy
      for (let i = userIds.length - 1; i >= 0; i--) {
        if (userIds[i] === actorId) userIds.splice(i, 1)
      }
    }

    // Filter out banned users - they should not receive notifications
    return await this.filterBannedUsers(userIds)
  }

  private async getUsersWithMatchingPreferences(
    payload: NotificationEventPayload,
  ): Promise<{ id: string }[]> {
    const where: Prisma.UserWhereInput = {
      notifyOnNewListings: true,
    }

    if (payload.deviceId) where.devicePreferences = { some: { deviceId: payload.deviceId } }

    if (payload.socId) where.socPreferences = { some: { socId: payload.socId } }

    return prisma.user.findMany({ where, select: { id: true } })
  }

  /**
   * Filter out banned users from receiving notifications
   * Banned users should not receive any notifications while their ban is active
   */
  private async filterBannedUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return []

    try {
      // Get all users who have active bans
      const bannedUserIds = await prisma.userBan.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { userId: true },
      })

      const bannedUserIdsSet = new Set(bannedUserIds.map((ban) => ban.userId))

      // Filter out banned users
      const filteredUserIds = userIds.filter((userId) => !bannedUserIdsSet.has(userId))

      if (bannedUserIds.length > 0) {
        console.log(`Filtered out ${bannedUserIds.length} banned users from notification targeting`)
      }

      return filteredUserIds
    } catch (error) {
      console.error('Error filtering banned users from notifications:', error)
      // If we can't filter banned users, return all userIds to avoid breaking notifications entirely
      // This is a fallback - in production, you might want to handle this differently
      return userIds
    }
  }

  /**
   * Check for duplicate notifications to prevent spam
   * Prevents the same notification from being sent multiple times for the same event
   */
  private async checkForDuplicateNotification(
    userId: string,
    notificationType: NotificationType,
  ): Promise<boolean> {
    try {
      // Define deduplication window based on notification type
      const deduplicationWindows: Partial<Record<NotificationType, number>> = {
        [NotificationType.LISTING_APPROVED]: ms.hours(1),
        [NotificationType.LISTING_REJECTED]: ms.hours(1),
        [NotificationType.LISTING_COMMENT]: ms.minutes(5),
        [NotificationType.LISTING_VOTE_UP]: ms.minutes(15),
        [NotificationType.LISTING_VOTE_DOWN]: ms.minutes(15),
        [NotificationType.COMMENT_REPLY]: ms.minutes(5),
        [NotificationType.USER_MENTION]: ms.minutes(5),
        [NotificationType.NEW_DEVICE_LISTING]: ms.minutes(30),
        [NotificationType.GAME_ADDED]: ms.hours(1),
        [NotificationType.EMULATOR_UPDATED]: ms.hours(1),
        [NotificationType.ROLE_CHANGED]: ms.hours(1),
        [NotificationType.CONTENT_FLAGGED]: ms.hours(1),
        [NotificationType.MAINTENANCE_NOTICE]: ms.days(1),
        [NotificationType.FEATURE_ANNOUNCEMENT]: ms.days(1),
        [NotificationType.NEW_SOC_LISTING]: ms.minutes(30),
        [NotificationType.POLICY_UPDATE]: ms.days(1),
        [NotificationType.ACCOUNT_WARNING]: ms.hours(1),
      }

      const windowMs = deduplicationWindows[notificationType] || ms.minutes(30)
      const windowStart = new Date(Date.now() - windowMs)

      // Check for existing similar notifications within the deduplication window
      // For simplicity, we check by userId, type, and time window only
      // This prevents rapid-fire duplicate notifications for the same user and type
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: notificationType,
          createdAt: { gte: windowStart },
        },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })

      if (existingNotification) {
        console.log(
          `Duplicate notification detected for user ${userId}, type ${notificationType}, within ${windowMs / 1000}s window`,
        )
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking for duplicate notifications:', error)
      // If we can't check for duplicates, allow the notification to prevent breaking functionality
      return false
    }
  }

  private async enrichContextWithData(
    eventData: NotificationEventData,
    notificationType: NotificationType,
  ): Promise<TemplateContext> {
    const context: TemplateContext = {}
    const payload = eventData.payload || {}

    try {
      // Get triggering user info
      if (eventData.triggeredBy) {
        const user = await prisma.user.findUnique({
          where: { id: eventData.triggeredBy },
          select: { name: true },
        })
        context.userName = user?.name || undefined
      }

      // Enrich based on notification type and available data
      if (payload.listingId) {
        const listing = await prisma.listing.findUnique({
          where: { id: payload.listingId },
          include: {
            game: { select: { title: true, id: true } },
            device: {
              select: {
                modelName: true,
                id: true,
                brand: { select: { name: true } },
              },
            },
            emulator: { select: { name: true, id: true } },
          },
        })

        if (listing) {
          context.listingId = listing.id
          context.listingTitle = listing.game.title
          context.gameTitle = listing.game.title
          context.gameId = listing.game.id
          context.deviceName = `${listing.device.brand.name} ${listing.device.modelName}`
          context.deviceId = listing.device.id
          context.emulatorName = listing.emulator.name
          context.emulatorId = listing.emulator.id
        }
      }

      // Handle comment-specific data
      if (
        payload.commentId &&
        (notificationType === NotificationType.LISTING_COMMENT ||
          notificationType === NotificationType.COMMENT_REPLY ||
          notificationType === NotificationType.USER_MENTION ||
          notificationType === NotificationType.COMMENT_ON_LISTING ||
          notificationType === NotificationType.REPLY_TO_COMMENT ||
          notificationType === NotificationType.COMMENT_UPVOTED ||
          notificationType === NotificationType.COMMENT_DOWNVOTED)
      ) {
        const comment = await prisma.comment.findUnique({
          where: { id: payload.commentId },
          select: {
            id: true,
            content: true,
            listingId: true,
            parentId: true,
          },
        })

        if (comment) {
          context.commentId = comment.id
          context.commentText = comment.content
          context.listingId = comment.listingId
          context.parentCommentId = comment.parentId || undefined

          // If we don't have listing data yet, fetch it
          if (!context.listingTitle && comment.listingId) {
            const listing = await prisma.listing.findUnique({
              where: { id: comment.listingId },
              include: {
                game: { select: { title: true } },
              },
            })
            if (listing) {
              context.listingTitle = listing.game.title
              context.listingId = listing.id
            }
          }
        }
      }

      // Handle game-specific data
      if (payload.gameId) {
        const game = await prisma.game.findUnique({
          where: { id: payload.gameId },
          select: { title: true, id: true },
        })
        if (game) {
          context.gameId = game.id
          context.gameTitle = game.title
        }
      }

      // Handle device-specific data for NEW_DEVICE_LISTING
      if (payload.deviceId && notificationType === NotificationType.NEW_DEVICE_LISTING) {
        const device = await prisma.device.findUnique({
          where: { id: payload.deviceId },
          include: {
            brand: { select: { name: true } },
          },
        })
        if (device) {
          context.deviceId = device.id
          context.deviceName = `${device.brand.name} ${device.modelName}`
        }
      }

      // Handle SOC-specific data for NEW_SOC_LISTING
      if (payload.socId && notificationType === NotificationType.NEW_SOC_LISTING) {
        const soc = await prisma.soC.findUnique({
          where: { id: payload.socId },
          select: { id: true, name: true, manufacturer: true },
        })
        if (soc) {
          context.socId = soc.id
          context.socName = `${soc.manufacturer} ${soc.name}`
        }
      }

      // Handle emulator-specific data
      if (payload.emulatorId) {
        const emulator = await prisma.emulator.findUnique({
          where: { id: payload.emulatorId },
          select: { id: true, name: true },
        })
        if (emulator) {
          context.emulatorId = emulator.id
          context.emulatorName = emulator.name
        }
      }

      // Handle role change specific data
      if (notificationType === NotificationType.ROLE_CHANGED) {
        context.oldRole = payload.oldRole as string
        context.newRole = payload.newRole as string
        context.changedAt = payload.changedAt as string

        if (payload.changedBy) {
          const changer = await prisma.user.findUnique({
            where: { id: payload.changedBy as string },
            select: { name: true },
          })
          context.changedBy = changer?.name || undefined
        }
      }

      // Handle moderation-specific data
      if (
        notificationType === NotificationType.LISTING_APPROVED ||
        notificationType === NotificationType.LISTING_REJECTED
      ) {
        if (payload.approvedBy) {
          const approver = await prisma.user.findUnique({
            where: { id: payload.approvedBy as string },
            select: { name: true },
          })
          context.approvedBy = approver?.name || undefined
        }
        if (payload.rejectedBy) {
          const rejector = await prisma.user.findUnique({
            where: { id: payload.rejectedBy as string },
            select: { name: true },
          })
          context.rejectedBy = rejector?.name || undefined
        }
        context.rejectionReason = payload.rejectionReason as string
        context.approvedAt = payload.approvedAt as string
        context.rejectedAt = payload.rejectedAt as string
      }

      // Handle user ban/unban data
      if (
        notificationType === NotificationType.USER_BANNED ||
        notificationType === NotificationType.USER_UNBANNED
      ) {
        context.warningReason = payload.reason as string
        context.duration = payload.duration as string
        context.changedAt = payload.changedAt as string
        if (payload.issuedBy) {
          const issuer = await prisma.user.findUnique({
            where: { id: payload.issuedBy as string },
            select: { name: true },
          })
          context.issuedBy = issuer?.name || undefined
        }
      }

      // Handle report data
      if (
        notificationType === NotificationType.REPORT_CREATED ||
        notificationType === NotificationType.REPORT_STATUS_CHANGED
      ) {
        context.reportId = payload.reportId as string
        context.status = payload.status as string
        context.contentId = (payload.contentId || payload.listingId) as string
        context.contentType = (payload.contentType || 'Listing') as string
        context.actionUrl =
          (payload.actionUrl as string) ||
          (payload.listingId ? `/listings/${payload.listingId}` : undefined)
      }

      // Handle developer verified
      if (notificationType === NotificationType.VERIFIED_DEVELOPER && payload.emulatorId) {
        const emulator = await prisma.emulator.findUnique({
          where: { id: payload.emulatorId as string },
          select: { id: true, name: true },
        })
        if (emulator) {
          context.emulatorId = emulator.id
          context.emulatorName = emulator.name
        }
      }

      // Refine listing vote events to up/down based on payload
      if (
        (notificationType === NotificationType.LISTING_UPVOTED ||
          notificationType === NotificationType.LISTING_VOTE_UP ||
          notificationType === NotificationType.LISTING_VOTE_DOWN ||
          notificationType === NotificationType.LISTING_DOWNVOTED) &&
        typeof payload.voteValue === 'boolean'
      ) {
        context.voteValue = payload.voteValue
      }

      // Copy over any additional metadata
      Object.keys(payload).forEach((key) => {
        if (!context[key]) {
          context[key] = payload[key]
        }
      })
    } catch (error) {
      console.error('Error enriching notification context:', error)
    }

    return context
  }

  /**
   * Schedule a notification for future delivery (e.g., weekly digests, maintenance notices)
   */
  async scheduleNotification(
    data: NotificationData,
    scheduledFor: Date,
    maxAttempts?: number,
  ): Promise<string> {
    return notificationBatchingService.scheduleNotification(data, scheduledFor, maxAttempts)
  }

  /**
   * Schedule weekly digest notifications for a user
   */
  scheduleWeeklyDigest(userId: string): void {
    notificationBatchingService.scheduleWeeklyDigest(userId)
  }

  /**
   * Schedule maintenance notifications for all users
   */
  scheduleMaintenanceNotification(scheduledFor: Date, title: string, message: string): void {
    notificationBatchingService.scheduleMaintenanceNotification(scheduledFor, title, message)
  }

  /**
   * Get current batching queue status
   */
  getBatchingQueueStatus() {
    return notificationBatchingService.getQueueStatus()
  }
}

export const notificationService = new NotificationService()
