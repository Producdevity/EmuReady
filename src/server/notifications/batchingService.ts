import { prisma } from '@/server/db'
import { notificationAnalyticsService } from '@/server/notifications/analyticsService'
import { NotificationDeliveryStatus, DeliveryChannel } from '@orm/client'
import { createEmailService } from './emailService'
import type { NotificationData } from './types'

interface BatchedNotification {
  id: string
  userId: string
  data: NotificationData
  scheduledFor: Date
  attempts: number
  maxAttempts: number
}

interface BatchConfig {
  batchSize: number
  batchIntervalMs: number
  maxRetries: number
  retryDelayMs: number
}

class NotificationBatchingService {
  private queue: BatchedNotification[] = []
  private processing = false
  private batchTimer: NodeJS.Timeout | null = null
  private config: BatchConfig
  private emailService = createEmailService()

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      batchSize: 50,
      batchIntervalMs: 30000,
      maxRetries: 3,
      retryDelayMs: 5000,
      ...config,
    }

    this.startBatchTimer()
  }

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

    if (this.queue.length >= this.config.batchSize) {
      this.processBatch().catch(console.error)
    }

    return id
  }

  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true
    const now = new Date()

    const readyNotifications = this.queue.filter((notification) => notification.scheduledFor <= now)

    if (readyNotifications.length === 0) {
      this.processing = false
      return
    }

    const batch = readyNotifications.slice(0, this.config.batchSize)

    console.log(`Processing batch of ${batch.length} notifications`)

    const results = await Promise.allSettled(
      batch.map((notification) => this.processNotification(notification)),
    )

    for (let i = 0; i < batch.length; i++) {
      const notification = batch[i]
      const result = results[i]

      if (result.status === 'fulfilled' && result.value) {
        this.removeFromQueue(notification.id)
      } else {
        notification.attempts++

        if (notification.attempts >= notification.maxAttempts) {
          console.error(
            `Notification ${notification.id} failed after ${notification.attempts} attempts`,
          )
          this.removeFromQueue(notification.id)
        } else {
          notification.scheduledFor = new Date(Date.now() + this.config.retryDelayMs)
          console.log(
            `Notification ${notification.id} scheduled for retry (attempt ${notification.attempts + 1})`,
          )
        }
      }
    }

    this.processing = false
  }

  private async processNotification(notification: BatchedNotification): Promise<boolean> {
    try {
      const { data } = notification

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

      const deliveryPromises: Promise<boolean>[] = []

      if (
        data.deliveryChannel === DeliveryChannel.IN_APP ||
        data.deliveryChannel === DeliveryChannel.BOTH
      ) {
        deliveryPromises.push(Promise.resolve(true))
      }

      if (
        (data.deliveryChannel === 'EMAIL' || data.deliveryChannel === 'BOTH') &&
        this.emailService
      ) {
        deliveryPromises.push(this.deliverEmail(data))
      }

      const results = await Promise.all(deliveryPromises)
      const success = results.some((result) => result)

      await prisma.notification.update({
        where: { id: dbNotification.id },
        data: {
          deliveryStatus: success
            ? NotificationDeliveryStatus.SENT
            : NotificationDeliveryStatus.FAILED,
        },
      })

      if (success) {
        notificationAnalyticsService.clearCache()
      }

      return success
    } catch (error) {
      console.error(`Error processing notification ${notification.id}:`, error)
      return false
    }
  }

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

  private removeFromQueue(id: string): void {
    const index = this.queue.findIndex((notification) => notification.id === id)
    if (index !== -1) {
      this.queue.splice(index, 1)
    }
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.processBatch().catch(console.error)
    }, this.config.batchIntervalMs)
    this.batchTimer.unref?.()
  }

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
}

export const notificationBatchingService = new NotificationBatchingService()
