import { prisma } from '@/server/db'
import { notificationAnalyticsService } from '@/server/notifications/analyticsService'
import {
  NotificationDeliveryStatus,
  DeliveryChannel,
  NotificationCategory,
  NotificationType,
} from '@orm'
import { createEmailService } from './emailService'
import { realtimeNotificationService } from './realtimeService'
import type { NotificationData } from './types'

export interface BatchedNotification {
  id: string
  userId: string
  data: NotificationData
  scheduledFor: Date
  attempts: number
  maxAttempts: number
}

export interface BatchConfig {
  batchSize: number
  batchIntervalMs: number
  maxRetries: number
  retryDelayMs: number
}

export class NotificationBatchingService {
  private queue: BatchedNotification[] = []
  private processing = false
  private batchTimer: NodeJS.Timeout | null = null
  private config: BatchConfig
  private emailService = createEmailService()

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      batchSize: 50,
      batchIntervalMs: 30000, // 30 seconds
      maxRetries: 3,
      retryDelayMs: 5000, // 5 seconds
      ...config,
    }

    this.startBatchTimer()
  }

  // Add notification to batch queue
  scheduleNotification(
    data: NotificationData,
    scheduledFor: Date = new Date(),
    maxAttempts: number = this.config.maxRetries,
  ): string {
    const id = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const batchedNotification: BatchedNotification = {
      id,
      userId: data.userId,
      data,
      scheduledFor,
      attempts: 0,
      maxAttempts,
    }

    this.queue.push(batchedNotification)
    console.log(`Notification scheduled for batch processing: ${id}`)

    // Process immediately if batch is full
    if (this.queue.length >= this.config.batchSize) {
      this.processBatch().catch(console.error)
    }

    return id
  }

  // Schedule weekly digest notifications
  scheduleWeeklyDigest(userId: string): void {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(9, 0, 0, 0) // 9 AM next week

    this.scheduleNotification(
      {
        userId,
        type: 'FEATURE_ANNOUNCEMENT',
        category: 'SYSTEM',
        title: 'Weekly EmuReady Digest',
        message: "Here's what happened this week in your gaming community.",
        deliveryChannel: 'EMAIL',
      },
      nextWeek,
    )
  }

  // Schedule maintenance notifications
  scheduleMaintenanceNotification(scheduledFor: Date, title: string, message: string): void {
    // Get all users who want maintenance notifications
    prisma.user
      .findMany({
        where: {
          notificationPreferences: {
            some: {
              type: NotificationType.MAINTENANCE_NOTICE,
              inAppEnabled: true,
            },
          },
        },
        select: { id: true },
      })
      .then((users) => {
        for (const user of users) {
          this.scheduleNotification(
            {
              userId: user.id,
              type: NotificationType.MAINTENANCE_NOTICE,
              category: NotificationCategory.SYSTEM,
              title,
              message,
              deliveryChannel: DeliveryChannel.BOTH,
            },
            scheduledFor,
          )
        }
      })
      .catch(console.error)
  }

  // Process batch of notifications
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const now = new Date()

    // Get notifications ready for processing
    const readyNotifications = this.queue.filter((notification) => notification.scheduledFor <= now)

    if (readyNotifications.length === 0) {
      this.processing = false
      return
    }

    // Take up to batchSize notifications
    const batch = readyNotifications.slice(0, this.config.batchSize)

    console.log(`Processing batch of ${batch.length} notifications`)

    const results = await Promise.allSettled(
      batch.map((notification) => this.processNotification(notification)),
    )

    // Handle results and retries
    for (let i = 0; i < batch.length; i++) {
      const notification = batch[i]
      const result = results[i]

      if (result.status === 'fulfilled' && result.value) {
        // Success - remove from queue
        this.removeFromQueue(notification.id)
      } else {
        // Failed - increment attempts and potentially retry
        notification.attempts++

        if (notification.attempts >= notification.maxAttempts) {
          console.error(
            `Notification ${notification.id} failed after ${notification.attempts} attempts`,
          )
          this.removeFromQueue(notification.id)
        } else {
          // Schedule retry
          notification.scheduledFor = new Date(Date.now() + this.config.retryDelayMs)
          console.log(
            `Notification ${notification.id} scheduled for retry (attempt ${notification.attempts + 1})`,
          )
        }
      }
    }

    this.processing = false
  }

  // Process individual notification
  private async processNotification(notification: BatchedNotification): Promise<boolean> {
    try {
      const { data } = notification

      // Create notification in database
      const dbNotification = await prisma.notification.create({
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

      // Deliver via appropriate channels
      const deliveryPromises: Promise<boolean>[] = []

      // In-app delivery
      if (
        data.deliveryChannel === DeliveryChannel.IN_APP ||
        data.deliveryChannel === DeliveryChannel.BOTH
      ) {
        deliveryPromises.push(this.deliverInApp(dbNotification.id, data))
      }

      // Email delivery
      if (
        (data.deliveryChannel === 'EMAIL' || data.deliveryChannel === 'BOTH') &&
        this.emailService
      ) {
        deliveryPromises.push(this.deliverEmail(data))
      }

      const results = await Promise.all(deliveryPromises)
      const success = results.some((result) => result)

      // Update delivery status
      await prisma.notification.update({
        where: { id: dbNotification.id },
        data: {
          deliveryStatus: success
            ? NotificationDeliveryStatus.SENT
            : NotificationDeliveryStatus.FAILED,
        },
      })

      // Invalidate analytics cache when notifications are processed in batches
      if (success) {
        notificationAnalyticsService.clearCache()
      }

      return success
    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error)
      return false
    }
  }

  // Deliver in-app notification
  private async deliverInApp(notificationId: string, data: NotificationData): Promise<boolean> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) return false

      realtimeNotificationService.sendNotificationToUser(data.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl || undefined,
        createdAt: notification.createdAt.toISOString(),
      })

      // Update unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId: data.userId,
          isRead: false,
        },
      })

      realtimeNotificationService.sendUnreadCountToUser(data.userId, unreadCount)

      return true
    } catch (error) {
      console.error('In-app delivery error:', error)
      return false
    }
  }

  // Deliver email notification
  private async deliverEmail(data: NotificationData): Promise<boolean> {
    if (!this.emailService) return false

    try {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true },
      })

      if (!user?.email) return false

      const result = await this.emailService.sendNotificationEmail(user.email, data)
      return result.success
    } catch (error) {
      console.error('Email delivery error:', error)
      return false
    }
  }

  // Remove notification from queue
  private removeFromQueue(id: string): void {
    const index = this.queue.findIndex((notification) => notification.id === id)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }
  }

  // Start batch processing timer
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch().catch(console.error)
    }, this.config.batchIntervalMs)
    // Allow process to exit if no other tasks are queued
    this.batchTimer.unref?.()
  }

  // Get queue status
  getQueueStatus(): {
    queueLength: number
    processing: boolean
    nextScheduled: Date | null
  } {
    const nextScheduled =
      this.queue.length > 0
        ? new Date(Math.min(...this.queue.map((n) => n.scheduledFor.getTime())))
        : null

    return {
      queueLength: this.queue.length,
      processing: this.processing,
      nextScheduled,
    }
  }

  // Cleanup
  destroy() {
    if (!this.batchTimer) return
    clearInterval(this.batchTimer)
    this.batchTimer = null
  }
}

// Singleton instance
export const notificationBatchingService = new NotificationBatchingService()
