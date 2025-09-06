/**
 * Server-side initialization that runs once on startup
 * This file should be imported at the top of instrumentation.ts
 *
 * Services are initialized with retry logic to handle transient failures.
 * If a service fails to initialize, it will be retried on next access.
 */

import { logger } from '@/lib/logger'
import { ms } from '@/utils/time'
import { initializeNotificationService } from './notifications/init'
import { initializeSwitchGameService } from './utils/switchGameInit'

interface ServiceStatus {
  initialized: boolean
  lastAttempt: Date | null
  failureCount: number
}

// Use global to persist across hot reloads in development
const globalForServices = globalThis as unknown as {
  serviceStatus: Record<string, ServiceStatus>
  initializationPromise?: Promise<void>
}

const serviceStatus: Record<string, ServiceStatus> = globalForServices.serviceStatus ?? {
  notification: { initialized: false, lastAttempt: null, failureCount: 0 },
  switchGame: { initialized: false, lastAttempt: null, failureCount: 0 },
}

if (process.env.NODE_ENV !== 'production') globalForServices.serviceStatus = serviceStatus

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = ms.seconds(5) // 5 seconds between retries

/**
 * Initialize notification service with retry logic
 */
async function initNotificationServiceWithRetry(): Promise<boolean> {
  const status = serviceStatus.notification

  logger.info('[init] Notification service status:', status)
  // Skip if already initialized
  if (status.initialized) return true

  // Skip if we've exceeded max retries recently
  if (status.failureCount >= MAX_RETRY_ATTEMPTS) {
    const timeSinceLastAttempt = status.lastAttempt
      ? Date.now() - status.lastAttempt.getTime()
      : Infinity

    // Only retry after delay if we've failed too many times
    if (timeSinceLastAttempt < RETRY_DELAY_MS) return false

    // Reset failure count after delay for another round of attempts
    status.failureCount = 0
  }

  status.lastAttempt = new Date()

  try {
    initializeNotificationService()
    status.initialized = true
    status.failureCount = 0
    logger.info('[init] ✅ Notification service initialized successfully')
    return true
  } catch (error) {
    status.failureCount++
    logger.error(
      `❌ Failed to initialize notification service (attempt ${status.failureCount}/${MAX_RETRY_ATTEMPTS}):`,
      error,
    )
    return false
  }
}

/**
 * Initialize switch game service with retry logic
 */
async function initSwitchGameServiceWithRetry(): Promise<boolean> {
  const status = serviceStatus.switchGame

  // Skip if already initialized
  if (status.initialized) return true

  // Skip if we've exceeded max retries recently
  if (status.failureCount >= MAX_RETRY_ATTEMPTS) {
    const timeSinceLastAttempt = status.lastAttempt
      ? Date.now() - status.lastAttempt.getTime()
      : Infinity

    // Only retry after delay if we've failed too many times
    if (timeSinceLastAttempt < RETRY_DELAY_MS) return false

    // Reset failure count after delay for another round of attempts
    status.failureCount = 0
  }

  status.lastAttempt = new Date()

  try {
    await initializeSwitchGameService()
    status.initialized = true
    status.failureCount = 0
    logger.info('✅ Switch game service initialized successfully')
    return true
  } catch (error) {
    status.failureCount++
    logger.error(
      `❌ Failed to initialize switch game service (attempt ${status.failureCount}/${MAX_RETRY_ATTEMPTS}):`,
      error,
    )
    return false
  }
}

/**
 * Main initialization function that handles all services
 */
export async function initializeServer(): Promise<void> {
  logger.info('🚀 Initializing server services...')

  // Initialize services in parallel with individual error handling
  const [notificationSuccess, switchGameSuccess] = await Promise.all([
    initNotificationServiceWithRetry(),
    initSwitchGameServiceWithRetry(),
  ])

  // Log overall status
  const allSuccess = notificationSuccess && switchGameSuccess
  if (allSuccess) {
    logger.info('✅ All server services initialized successfully')
  } else {
    logger.warn('⚠️ Some services failed to initialize. They will be retried on next access.')
  }
}

/**
 * Ensure all services are initialized, retrying if necessary
 */
export async function ensureServicesInitialized(): Promise<void> {
  const promises: Promise<boolean>[] = []

  if (!serviceStatus.notification.initialized) promises.push(initNotificationServiceWithRetry())

  if (!serviceStatus.switchGame.initialized) promises.push(initSwitchGameServiceWithRetry())

  if (promises.length > 0) await Promise.all(promises)
}

/**
 * Get current status of all services
 */
export function getServiceStatus() {
  return {
    notification: { ...serviceStatus.notification },
    switchGame: { ...serviceStatus.switchGame },
  }
}

// Auto-initialize on module load with singleton pattern
if (typeof window === 'undefined' && !globalForServices.initializationPromise) {
  globalForServices.initializationPromise = initializeServer().catch(logger.error)
}
