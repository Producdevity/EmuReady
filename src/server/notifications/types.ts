import type {
  NotificationType,
  NotificationCategory,
  DeliveryChannel,
  NotificationDeliveryStatus,
} from '@orm'

export interface NotificationEvent {
  id: string
  eventType: string
  entityType: string
  entityId: string
  triggeredBy?: string
  payload?: Record<string, unknown>
  processedAt?: Date
  createdAt: Date
}

export interface NotificationData {
  userId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  message: string
  actionUrl?: string
  metadata?: Record<string, unknown>
  deliveryChannel?: DeliveryChannel
}

export interface NotificationPreferenceData {
  userId: string
  type: NotificationType
  inAppEnabled: boolean
  emailEnabled: boolean
}

export interface ListingNotificationPreferenceData {
  userId: string
  listingId: string
  isEnabled: boolean
}

export interface NotificationTemplate {
  title: string
  message: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export interface NotificationDeliveryResult {
  success: boolean
  channel: DeliveryChannel
  status: NotificationDeliveryStatus
  error?: string
}

export interface NotificationEventPayload {
  listingId?: string
  commentId?: string
  voteId?: string
  gameId?: string
  emulatorId?: string
  deviceId?: string
  socId?: string
  userId?: string
  [key: string]: unknown
}

export interface NotificationServiceConfig {
  enableEmailDelivery: boolean
  enableRealTimeDelivery: boolean
  maxRetries: number
  retryDelayMs: number
  batchSize: number
  rateLimitPerMinute: number
}
