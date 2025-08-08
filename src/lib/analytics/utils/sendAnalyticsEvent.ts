import { sendGAEvent } from '@next/third-parties/google'
import { track } from '@vercel/analytics'
import { type AnalyticsEventData } from '@/lib/analytics/analytics.types'
import { isTrackingAllowed } from './isTrackingAllowed'
/**
 * Send analytics event with proper consent checking and environment handling
 */
export function sendAnalyticsEvent(params: AnalyticsEventData) {
  // Check if tracking is allowed (handles client/server-side logic)
  if (!isTrackingAllowed(params.category)) {
    console.warn('Analytics event blocked by cookie consent:', params.category, params.action)
    return
  }

  // Build event data with proper typing
  const eventData: Record<string, string | number | boolean> = {
    category: params.category,
    action: params.action,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
  }

  // Add optional fields if they exist
  if (params.listingId) eventData.listingId = params.listingId
  if (params.gameId) eventData.gameId = params.gameId
  if (params.systemId) eventData.systemId = params.systemId
  if (params.emulatorId) eventData.emulatorId = params.emulatorId
  if (params.deviceId) eventData.deviceId = params.deviceId
  if (params.userId) eventData.userId = params.userId
  if (params.adminId) eventData.adminId = params.adminId
  if (params.commentId) eventData.commentId = params.commentId
  if (params.page) eventData.page = params.page
  if (params.filterName) eventData.filterName = params.filterName
  if (params.entityName) eventData.entityName = params.entityName
  if (params.errorType) eventData.errorType = params.errorType
  if (params.sessionId) eventData.sessionId = params.sessionId
  if (params.url) eventData.url = params.url
  if (params.searchQuery) eventData.searchQuery = params.searchQuery
  if (params.feature) eventData.feature = params.feature
  if (params.entityType) eventData.entityType = params.entityType
  if (params.duration) eventData.duration = params.duration
  if (params.value !== undefined) eventData.value = params.value

  // Add metadata
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      eventData[key] = value
    })
  }

  // Log in development, send it to external service in production
  if (process.env.NODE_ENV === 'development') {
    const context = typeof window !== 'undefined' ? 'CLIENT' : 'SERVER'
    return console.info(`📊 Analytics Event [${context}]:`, {
      category: params.category,
      action: params.action,
      data: eventData,
    })
  }

  // Only send to analytics services in production and on client-side
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    track(params.action, eventData)
    sendGAEvent('event', params.action, {
      event_category: params.category,
      ...eventData,
    })
  }
}
