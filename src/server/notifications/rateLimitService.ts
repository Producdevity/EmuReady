import { RATE_LIMITS } from '@/data/constants'
import { prisma } from '@/server/db'
import { ms } from '@/utils/time'
import { NotificationType } from '@orm'

export interface RateLimitRule {
  type: NotificationType | 'GLOBAL'
  maxRequests: number
  windowMs: number
  userSpecific: boolean
}

export interface RateLimitStatus {
  allowed: boolean
  remaining: number
  resetTime: Date
  reason?: string
}

export interface RateLimitEntry {
  key: string
  count: number
  windowStart: Date
  resetTime: Date
}

export class NotificationRateLimitService {
  private limits = new Map<string, RateLimitEntry>()
  private rules: RateLimitRule[] = []
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeDefaultRules()
    this.startCleanupInterval()
  }

  // Initialize default rate limiting rules
  private initializeDefaultRules(): void {
    this.rules = [
      // Global limits per user
      {
        type: 'GLOBAL',
        maxRequests: RATE_LIMITS.REQUESTS_PER_WINDOW,
        windowMs: RATE_LIMITS.WINDOW_SIZE_MS,
        userSpecific: true,
      },

      // Engagement notifications (aggressive rate limiting)
      {
        type: NotificationType.LISTING_COMMENT,
        maxRequests: 10,
        windowMs: ms.minutes(10),
        userSpecific: true,
      },
      {
        type: NotificationType.LISTING_VOTE_UP,
        maxRequests: 20,
        windowMs: ms.minutes(15),
        userSpecific: true,
      },
      {
        type: NotificationType.LISTING_VOTE_DOWN,
        maxRequests: 10,
        windowMs: ms.minutes(15),
        userSpecific: true,
      },
      {
        type: NotificationType.COMMENT_REPLY,
        maxRequests: 15,
        windowMs: ms.minutes(10),
        userSpecific: true,
      },

      // Content notifications (moderate rate limiting)
      {
        type: NotificationType.NEW_DEVICE_LISTING,
        maxRequests: 5,
        windowMs: ms.minutes(30),
        userSpecific: false,
      },
      {
        type: NotificationType.GAME_ADDED,
        maxRequests: 10,
        windowMs: ms.hours(1),
        userSpecific: false,
      },

      // System notifications (conservative rate limiting)
      {
        type: NotificationType.MAINTENANCE_NOTICE,
        maxRequests: 1,
        windowMs: ms.days(1),
        userSpecific: false,
      },
      {
        type: NotificationType.FEATURE_ANNOUNCEMENT,
        maxRequests: 2,
        windowMs: ms.hours(12),
        userSpecific: false,
      },

      // Moderation notifications
      {
        type: NotificationType.LISTING_APPROVED,
        maxRequests: 50,
        windowMs: ms.hours(1),
        userSpecific: true,
      },
      {
        type: NotificationType.LISTING_REJECTED,
        maxRequests: 50,
        windowMs: ms.hours(1),
        userSpecific: true,
      },
    ]
  }

  // Check if notification is allowed based on rate limits
  async checkRateLimit(
    userId: string,
    notificationType: NotificationType,
  ): Promise<RateLimitStatus> {
    const now = new Date()

    // Check global user limit
    const globalStatus = this.checkLimit('GLOBAL', userId, now)
    if (!globalStatus.allowed) {
      return {
        ...globalStatus,
        reason: 'Global rate limit exceeded',
      }
    }

    // Check specific notification type limit
    const typeStatus = this.checkLimit(notificationType, userId, now)
    if (!typeStatus.allowed) {
      return {
        ...typeStatus,
        reason: `Rate limit exceeded for ${notificationType}`,
      }
    }

    // Check user preference overrides
    const preferenceOverride = await this.checkUserPreferences(userId, notificationType)
    return preferenceOverride.allowed ? typeStatus : preferenceOverride
  }

  // Record a notification sending attempt
  recordNotification(userId: string, notificationType: NotificationType): void {
    const now = new Date()

    // Record for global limit
    this.recordLimit('GLOBAL', userId, now)

    // Record for specific type limit
    this.recordLimit(notificationType, userId, now)
  }

  // Check limit for a specific rule
  private checkLimit(
    ruleType: NotificationType | 'GLOBAL',
    userId: string,
    now: Date,
  ): RateLimitStatus {
    const rule = this.rules.find((r) => r.type === ruleType)
    if (!rule) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(now.getTime() + ms.hours(1)),
      }
    }

    const key = rule.userSpecific ? `${ruleType}:${userId}` : ruleType
    const entry = this.limits.get(key)

    if (!entry) {
      // No previous records, allow
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: new Date(now.getTime() + rule.windowMs),
      }
    }

    // Check if window has expired
    if (now >= entry.resetTime) {
      // Window expired, reset
      this.limits.delete(key)
      return {
        allowed: true,
        remaining: rule.maxRequests - 1,
        resetTime: new Date(now.getTime() + rule.windowMs),
      }
    }

    // Check if limit is exceeded
    if (entry.count >= rule.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    return {
      allowed: true,
      remaining: rule.maxRequests - entry.count - 1,
      resetTime: entry.resetTime,
    }
  }

  // Record a limit hit
  private recordLimit(ruleType: NotificationType | 'GLOBAL', userId: string, now: Date): void {
    const rule = this.rules.find((r) => r.type === ruleType)
    if (!rule) return

    const key = rule.userSpecific ? `${ruleType}:${userId}` : ruleType
    const entry = this.limits.get(key)

    if (!entry || now >= entry.resetTime) {
      // Create new entry
      this.limits.set(key, {
        key,
        count: 1,
        windowStart: now,
        resetTime: new Date(now.getTime() + rule.windowMs),
      })
    } else {
      // Increment existing entry
      entry.count++
    }
  }

  // Check user-specific notification preferences
  private async checkUserPreferences(
    userId: string,
    notificationType: NotificationType,
  ): Promise<RateLimitStatus> {
    try {
      const preference = await prisma.notificationPreference.findUnique({
        where: { userId_type: { userId, type: notificationType } },
      })

      // If user has disabled this notification type
      if (preference && !preference.inAppEnabled && !preference.emailEnabled) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + ms.days(1)),
          reason: 'User has disabled this notification type',
        }
      }

      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + ms.hours(1)),
      }
    } catch (error) {
      console.error('Error checking user preferences:', error)
      // Default to allowing if we can't check preferences
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: new Date(Date.now() + ms.hours(1)),
      }
    }
  }

  // Add or update a rate limit rule
  addRule(rule: RateLimitRule): void {
    const existingIndex = this.rules.findIndex((r) => r.type === rule.type)
    if (existingIndex !== -1) {
      this.rules[existingIndex] = rule
    } else {
      this.rules.push(rule)
    }
  }

  // Remove a rate limit rule
  removeRule(type: NotificationType | 'GLOBAL'): void {
    const index = this.rules.findIndex((r) => r.type === type)
    if (index !== -1) this.rules.splice(index, 1)
  }

  // Get current rate limit status for a user
  getUserRateLimitStatus(userId: string): Array<{
    type: NotificationType | 'GLOBAL'
    remaining: number
    resetTime: Date
    windowMs: number
  }> {
    const now = new Date()
    const status = []

    for (const rule of this.rules) {
      if (!rule.userSpecific) continue

      const key = `${rule.type}:${userId}`
      const entry = this.limits.get(key)

      let remaining = rule.maxRequests
      let resetTime = new Date(now.getTime() + rule.windowMs)

      if (entry && now < entry.resetTime) {
        remaining = Math.max(0, rule.maxRequests - entry.count)
        resetTime = entry.resetTime
      }

      status.push({
        type: rule.type,
        remaining,
        resetTime,
        windowMs: rule.windowMs,
      })
    }

    return status
  }

  // Reset rate limits for a specific user
  resetUserLimits(userId: string): void {
    const keysToDelete = []
    for (const [key] of this.limits) {
      if (key.includes(userId)) keysToDelete.push(key)
    }

    for (const key of keysToDelete) this.limits.delete(key)
  }

  // Get rate limiting statistics
  getStatistics(): {
    totalLimits: number
    activeLimits: number
    rules: RateLimitRule[]
    topLimitedTypes: Array<{
      type: string
      hitCount: number
    }>
  } {
    const now = new Date()
    const activeLimits = Array.from(this.limits.values()).filter((entry) => now < entry.resetTime)

    // Count hits by type
    const typeHits = new Map<string, number>()
    for (const entry of this.limits.values()) {
      const type = entry.key.split(':')[0]
      typeHits.set(type, (typeHits.get(type) || 0) + entry.count)
    }

    const topLimitedTypes = Array.from(typeHits.entries())
      .map(([type, hitCount]) => ({ type, hitCount }))
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 10)

    return {
      totalLimits: this.limits.size,
      activeLimits: activeLimits.length,
      rules: this.rules,
      topLimitedTypes,
    }
  }

  // Start cleanup interval to remove expired entries
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, ms.minutes(5))
    // Let process exit if this is the only timer
    this.cleanupInterval.unref?.()
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = new Date()
    const expiredKeys = []

    for (const [key, entry] of this.limits) {
      if (now >= entry.resetTime) expiredKeys.push(key)
    }

    for (const key of expiredKeys) this.limits.delete(key)

    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired rate limit entries`)
    }
  }

  // Destroy the service
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.limits.clear()
  }
}

// Singleton instance
export const notificationRateLimitService = new NotificationRateLimitService()
