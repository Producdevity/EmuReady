import type {
  NotificationType,
  NotificationCategory,
  DeliveryChannel,
  NotificationDeliveryStatus,
} from '@orm/client'

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
  pcListingId?: string
  commentId?: string
  parentId?: string
  voteId?: string
  voteValue?: boolean
  gameId?: string
  gameTitle?: string
  emulatorId?: string
  deviceId?: string
  socId?: string
  userId?: string
  [key: string]: unknown
}

export interface NotificationServiceConfig {
  enableEmailDelivery: boolean
}
